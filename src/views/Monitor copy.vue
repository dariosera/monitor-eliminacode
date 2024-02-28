<script setup>
import { ref, reactive, watch, onMounted} from 'vue'
import client from '@/mqtt/client'
import { Modal } from 'bootstrap';


const connected = ref(false)

const time = ref((new Date()).toLocaleTimeString('it-IT'));
setInterval(function() {
		time.value = (new Date()).toLocaleTimeString('it-IT')
	},1000);


const pVoid = {
    numero : null,
    sala : null
};

const paziente = reactive({...pVoid})

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
});

client.on("message", (topic, message) => {
    
    const data = JSON.parse(message);

    if (topic === "chiamata") {
      Object.assign(paziente,data);

      setTimeout(
          () => {
              Object.assign(paziente,pVoid);
          },
      5000)
    }

    if (topic === "info/cmd") {
        alert(data.command)
    }

    

});


const slideshow = ["video.mp4"];

const videoplayer = ref(null);

onMounted(() => {

  videoplayer.value.setAttribute("src",slideshow[0])
  videoplayer.value.play()

})


</script>
<template>
<div class="monitor">
  <div class="top">
        Studio Oculistico Dott. Luca Ventre
    </div>
    <div class="center">
      <div class="center-right">
        <div class="left paziente">
          <div class="attuale">
            <h3>PAZIENTE</h3>
            <h1></h1>
          </div>
          <div class="lista">
            <h1>3</h1>
            <h1>2</h1>
          </div>
        </div>
        <div class="right sala">
          <div class="attuale">
            <h3>SALA</h3>
            <h1>2</h1>
          </div>
          <div class="lista">
            <h1>3</h1>
            <h1>2</h1>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="left date">{{ (new Date()).toLocaleDateString('it-IT',{
  weekday : 'long',
  day: '2-digit',
  month : 'long',
  year : 'numeric'
}) }}</div>
      <div class="right time">{{ time }}</div>
    </div>
  
    <div class="player">
       <video ref="videoplayer" muted class="videoplayer"></video>
        <!-- <div class="photoplayer"></div> -->
    </div>
  
    <audio class="voice"></audio>
</div>
</template>
<style scoped>
	* {
		box-sizing:border-box;
		
			font-family: 'Roboto', sans-serif;
	
	}	
	
	.monitor {
		margin:0;
		padding:0;
		overflow:hidden;
		background: #c94b4b;  /* fallback for old browsers */
	background: -webkit-linear-gradient(to right, #4b134f, #c94b4b);  /* Chrome 10-25, Safari 5.1-6 */
	background: linear-gradient(to right, #4b134f, #c94b4b); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
		color: white;
    aspect-ratio: 16/9;
    max-width: 100vw;
    max-height: 100vh;
    position: relative;
	}
	.top {
		width:100vw;
		height:10vh;
		padding:.5rem;
		letter-spacing:.02rem;
	}
	.center {
		width:100%;
		height:80vh;
	}
	
	.center-right.inlista {
		width: 50%;
		height: 100%;
		float: right;
	}
	
	.bottom {
		width:100%;
		height:10vh;
		letter-spacing:.05rem;
	}
	
	.left, .right {
		display:block;
		width:50%;
		float:left;
		font-size:2em;
		padding:1em;
	}
	
	.left { text-align:left }
	.right { text-align:right }
	
	.paziente, .sala {
		text-align:center;
	}
	
	.paziente h1, .sala h1 {
		margin:0;
		padding:0;
		font-size:13em;
	}
	
	.paziente h1.inlista, .sala h1.inlista {
		margin:0;
		padding:0;
		font-size:5em;
		display: none;
	}
	
	
	.paziente h3, .sala h3 {
		margin:0;
		padding:0;
		font-size:1.7em;
		letter-spacing:.3em;
	}
	
	.paziente h3.inlista, .sala h3.inlista {
		margin:0;
		padding:0;
		font-size:1.2em;
		letter-spacing:.3em;
	}
	
	
	.lista {
		display: none;
	}
	
	
	.player {
		display:block;
		position:absolute;
		height: 80vh;
    aspect-ratio: 16/9;
    top: 10vh;
    left : 17vh;
		box-shadow:1px 1px 15px rgba(0,0,0,.4);
		background:white;
		transition:width 1s, height 1s, top 1s, left 1s, bottom 1s;
	}
	
	.videoplayer {
		width:100%;
		height:100%;
	}
	
	.photoplayer {
		width:100%;
		height:100%;
		background-size:contain;
		background-color:white;
		background-repeat:no-repeat;
		background-position:center center;
	}
	
	.player.small {
		height:20vh;
		width: calc(20vh * 1.777777778);
		left:0.5em;
		bottom:0.5em;
		top:auto;
	}
	
	.player.medium {
		height:50vh;
		width: calc(50vh * 1.777777778);
		left:1em;
		bottom:30vh;
		top:auto;
	}
	
	
	</style>