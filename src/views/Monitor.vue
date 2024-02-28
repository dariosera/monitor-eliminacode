
<script setup>
import { ref, reactive, watch, onMounted, onBeforeMount} from 'vue'
import client from '@/mqtt/client'
import { Modal } from 'bootstrap';


const playerMode = ref('big')
const audioPlayer = ref(null)
const videoPlayer = ref(null)
const currentVideo = ref("#")

const videoList = ref([])
const videoIndex = ref(0);

onBeforeMount(async () => {
    
})

onMounted(async () => {
    audioPlayer.value.volume = "1";
    videoPlayer.value.volume = "0.01";

    let response = await fetch(import.meta.env.VITE_MEDIA_URL)
    let videos = await response.json();

    videoList.value = videos;
    console.log(videos)

    currentVideo.value = videoList.value[videoIndex.value];


})

const project_name = import.meta.env.VITE_PROJECT_NAME;


const connected = ref(false)

const time = ref((new Date()).toLocaleTimeString('it-IT'));
setInterval(function() {
		time.value = (new Date()).toLocaleTimeString('it-IT')
	},1000);

let date = (new Date()).toLocaleDateString("it-IT",{
    weekday : "long",
    day : "numeric",
    month : "long",
    year : "numeric"
})

date = date.substring(0,1).toUpperCase() + date.substring(1)

const annunci = ref([])

client.on("connect", () => {
  console.log("connected");
  connected.value = true

  client.subscribe(`chiamata`, (err) => {
    if (!err) {
      console.log("subscribed");
    }
  });

  client.subscribe(`info/cmd`, (err) => {
    if (!err) {
      console.log("subscribed");
    }
  });

  client.subscribe(`info/volumi`, (err) => {
    if (!err) {
      console.log("subscribed");
    }
  });
});

client.on("message", (topic, message) => {

    const data = JSON.parse(message);

    if (topic === "chiamata") {

        data.annunciato = false;

        annunci.value.forEach((p,i) => {
            if (p.id == data.id) {
                annunci.value[i].id = false;
            }
        })

        annunci.value = annunci.value.filter(x => x.id !== false)

        annunci.value.unshift(data);
        //annunci.value = annunci.value.slice(0,3);

        mostraAnnuncio()

    }

    if (topic === "info/cmd") {
        if (data.command == "reboot") {
            window.top.location.href = "http://localhost/cgi-bin/reboot.cgi";
        }
        if (data.command == "shutdown") {
            window.top.location.href = "http://localhost/cgi-bin/shutdown.cgi";
        }
    }
    
    if (topic === "info/volumi") {
        console.log(`aggiorno volumi`)
        audioPlayer.value.volume = data.volume.annunci;
        videoPlayer.value.volume = data.volume.media;
    }

});

let lock = false;
const mostraAnnuncio = function() {
    let found = false;
    if (lock === true) {
        console.log(`[BLOCCATO] Annuncio `)
        return;
    }
    lock = true;

    annunci.value.forEach((a,i) => {

        if (a.annunciato === false && !found) {
            console.log(`Annuncio ${a.numero} in sala ${a.sala}`)
            found = true;
            a.annunciato = "now";
            playerMode.value = "small";

            import(`@/audio/sala${a.sala}_paziente${a.numero}.mp3`).then(audio => {
                audioPlayer.value.setAttribute("src",audio.default);
                
            })

            setTimeout(() => {
                playerMode.value = "big";
                a.annunciato = true;
                lock = false;

                let nCoda = annunci.value.filter(x => x.annunciato === false).length;
                if (nCoda === 0) {
                    playerMode.value = "medium";
                    setTimeout(() => {
                        if (playerMode.value == "medium") {
                            playerMode.value = "big";
                        }
                        
                    },8000)

                } else if (nCoda > 0) {
                    mostraAnnuncio()
                }

            }, 8000)
        }
       
       
    })

    
}

const onEnded = function() {
    if (videoIndex.value == videoList.value.length -1) {
        videoIndex.value = 0;
    } else {
        videoIndex.value++;
    }
    currentVideo.value = videoList.value[videoIndex.value]
}
</script>
<template>
<div class="container-fluid p-0">
    <div class="d-flex column">
        <div class="top">
            {{ project_name }}            
        </div>
        <div class="center" :class="{'player-big': playerMode=='big', 'player-medium': playerMode=='medium', 'player-small': playerMode=='small' }">
            <div class="videoplayer">
                <video ref="videoPlayer" :src="currentVideo" autoplay @ended="onEnded" @error="onEnded"></video>
            </div>
            <div class="announce-area">

                <div class="row text-center">
                    <div class="col-6 t">
                        Paziente
                    </div>
                    <div class="col-6 t">
                        Sala
                    </div>
                    <template v-if="playerMode == 'small'">
                        <div class="col-6 n">
                            {{ annunci.filter(x=>x.annunciato=='now')[0].numero }}
                        </div>
                        <div class="col-6 n">
                            {{ annunci.filter(x=>x.annunciato=='now')[0].sala }}
                        </div>
                    </template>
                    <template v-if="playerMode == 'medium'">
                        <template v-for="p,i in annunci" :key="i">
                            <div class="col-6 n">
                                {{ p.numero }}
                            </div>
                            <div class="col-6 n">
                                {{ p.sala }}
                            </div>
                        </template>
                    </template>
                   
                </div>

            </div>
           
        </div>
        <div class="bottom">
            <div class="row">
                <div class="col-6">
                    {{ date }}
                </div>
                <div class="col-6 text-end">
                    {{ time }}
                </div>
            </div>
        </div>
    </div>
</div>
<audio ref="audioPlayer" @canplaythrough="audioPlayer.play()"></audio>
</template>
<style scoped lang="scss">


.container-fluid {
	color: white;
    background-color: #FF3CAC;
    background: linear-gradient(112.1deg, rgb(32, 38, 57) 11.4%, rgb(63, 76, 119) 70.2%);
    cursor: none;

    * {
        transition: width .5s ease-in-out;
    }
}

.column {
    flex-direction: column;
    height: 100vh;
}

.top {
    height: 3rem;
    line-height: 3rem;
    padding:0 1rem;
    font-size:1.5rem;
}

.center {
    flex : 1;
    display: flex;
    padding: 1rem;

    .videoplayer {
        position: relative;
        display: block;
        text-align: center;        
        video {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
    }

    .announce-area {
        margin-left: 1rem;  
        
        .n {
            font-weight: bold;
        }

        .t {
            font-size: 2rem;
            text-transform: uppercase;
        }
    }

    &.player-big {
        .videoplayer {
            width: 100%;
            position: relative;
           

        }
        .announce-area {
            width: 0;
            overflow: hidden;
        }
    }

    &.player-medium {
        .videoplayer {
            width: 65%;

            


        }
        .announce-area {
            display: block;
            width: 35%;

            .n {
                font-size: 9rem;
            }
        }
    }

    &.player-small {
        .videoplayer {
            width: 50%;


        }
        .announce-area {
            display: block;
            width: 50%;

            .n {
                font-size: 13rem;
            }
        }
    }
}

.bottom {
    height: 3rem;
    line-height: 3rem;
    padding:0 1rem;
    font-size:2rem;
}
</style>