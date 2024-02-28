<script setup>
import { ref, reactive, watch, onMounted} from 'vue'
import client from '@/mqtt/client'
import { Modal } from 'bootstrap';

const elencoSale = ["1","2","3"];

const connected = ref(false)
const messages = ref([])


const volume = reactive({
    annunci : 100,
    media : 0,
})

watch(volume, (a,b) => {
    console.log(`Aggiorno volumi`)
    client.pub(`info/volumi`,{
        volume : {
            media : volume.media/100,
            annunci: volume.annunci/100,
        }
    })
})

const options = reactive({
    mostra : "all",
    ordina : "numero",
})

const pModel = {
    nome : "",
    cognome : "",
    numero : "",
    orario : "",
    chiamata : null,
    sala : "",
};


let avvisoAltroDevice;
let modalModificaPaziente;
let modalImpostazioni;

onMounted(() => {
    avvisoAltroDevice = new Modal(document.querySelector("#avviso-altro-device"), {
    backdrop: 'static',
    Keyboard : false,
})

    modalModificaPaziente = new Modal(document.querySelector("#modal-modifica-paziente"), {})

    modalImpostazioni = new Modal(document.querySelector("#modal-impostazioni"))
})


const nuovoPaziente = reactive({...pModel})
const modificaPaziente = reactive({...pModel})

const uid = typeof(crypto.randomUUID) === "function" ? crypto.randomUUID() : (Math.random()).toString().split(".")[1];
console.log(`UID: ${uid}`);

const pazienti = ref([]);

if (localStorage.getItem("db") !== null) {
    pazienti.value = JSON.parse(localStorage.getItem("db"))
}

watch(pazienti.value, (a,b) => {
    console.log("watch")
    localStorage.setItem('db',JSON.stringify(pazienti.value));
})

const aggiungiPaziente = function() {
    const id = (new Date()).getTime();

    const p = {};
    Object.assign(p,nuovoPaziente);
    p.id = id
    
    pazienti.value.push(p)

    inviaLista(nuovoPaziente.sala)

    Object.assign(nuovoPaziente,pModel)

}

client.on("connect", () => {
  console.log("connected");
  connected.value = true
  client.subscribe("#", (err) => {
    if (!err) {
      console.log("subscribed");
    }
  });
  client.pub("info/master",uid);
  elencoSale.forEach(s => { inviaLista(s)})

});

client.on("message", (topic, message) => {
    
    const data = JSON.parse(message);

    messages.value.push({topic, message: message.toString()});

    if (topic === "info/master" && data != uid) {
        avvisoAltroDevice.show()
    }

    if (topic === "info/slave") {
        const pazienti_sala = pazienti.value.filter(p => {
            if (p.sala == data.sala) return true;
            else return false;
        })

        client.pub(`lista/${data.sala}`, pazienti_sala)
    }

    if (topic === "medicochiama") {
        chiamaPaziente(data.id);
    }

});

client.on("close", () => {
  console.log("close");
  window.location.reload()
  connected.value = false
});

const goToBlank = function() {
    window.location.replace('about:blank')
}

const reload = function() {
    client.pub("info/master",uid);
    window.location.reload()
}

const svuotaLista = function() {
    localStorage.setItem('db',JSON.stringify([]));
    pazienti.value = [];
    elencoSale.forEach(s => { inviaLista(s)})
}

const chiamaPaziente = function(id) {
    pazienti.value.forEach(p => {
        if (p.id == id) {
            p.chiamata = (new Date()).toISOString();
            inviaLista(p.sala)
            client.pub('chiamata',{
                numero : p.numero,
                sala : p.sala,
                id : p.id,
            })
        }  
    })
}

const richiama = function(id) {
    pazienti.value.forEach(p => {
        if (p.id == id) {
            p.chiamata =  null;
            inviaLista(p.sala)
        }  
    })
}


const avviaModificaPaziente = function(id) {
    pazienti.value.forEach(p => {
        if (p.id == id) {
            Object.assign(modificaPaziente,p);
            modalModificaPaziente.show();
        }  
    })
}

const applicaModificaPaziente = function() {
    pazienti.value.forEach(p => {
        if (p.id == modificaPaziente.id) {
            Object.assign(p,modificaPaziente);
            elencoSale.forEach(s => { inviaLista(s)})
        }  
    })
}

const eliminaPaziente = function() {
    let toDel;
    pazienti.value.forEach((p,i) => {
        if (p.id == modificaPaziente.id) {
            p.id = false;
        }  
    })
    pazienti.value = pazienti.value.filter(p => p.id !== false)
    elencoSale.forEach(s => { inviaLista(s)})
    console.log(pazienti.value)
}

const inviaLista = function(sala) {
    client.pub(`lista/${sala}`,pazienti.value.filter(_p => _p.sala == sala))
}


const sortP = function(a,b) {
    if (a[options.ordina] > b[options.ordina]) return 1;
    if (a[options.ordina] < b[options.ordina]) return -1;
    if (a[options.ordina] == b[options.ordina]) return 0;
}

const F_CHIAMATI = 1;
const F_NON_CHIAMATI = 2;
const filtraP = function(x,tipo_filtro=false) {
    let sala = true;
    if (options.mostra !== "all") {
        sala = x.sala == options.mostra;
    }

    if (tipo_filtro === F_CHIAMATI) {
        if (x.chiamata !== null && sala) return true
        else return false
    }
    if (tipo_filtro === F_NON_CHIAMATI) {
        if (x.chiamata === null && sala) return true
        else return false
    }

    if (tipo_filtro === false) {
        if (sala) return true
        else return false
    }
}

const impostazioni = function() {
    modalImpostazioni.show()
}

const sendCmd = function(cmd) {
    client.pub(`info/cmd`,{
        command : cmd
    })
}

</script>
<template>
<div class="container-fluid p-0">
    <!-- As a heading -->
    <nav class="navbar bg-body-tertiary border-bottom px-3">
  
        <div>
            <span class="navbar-brand mb-0 h1">Studio oculistico</span>
            <button class="btn btn-sm btn-outline-secondary" @click="impostazioni"><i class="bi bi-gear"></i> Gestione monitor</button>
        </div>

        <div><span :class="{'text-success' : connected, 'text-danger' : !connected}"><i class="bi bi-circle-fill"></i></span> <small>{{ connected ? "Connesso" : "Disconnesso" }}</small></div>
    </nav>

    <div class="row p-3">
        <div class="col-lg-6"> 
        <form @submit.prevent="aggiungiPaziente" id="form-np">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Nuovo paziente</h5>
                    
                        <div class="form row g-3 mt-3">
                            <div class="col-md-6 mb-3">
                                <label for="np-nome" class="form-label">Nome</label>
                                <input required type="text" id="np-nome" class="form-control me-2" v-model="nuovoPaziente.nome">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label for="np-cognome" class="form-label">Cognome</label>
                                <input required type="text" id="np-cognome" class="form-control me-2" v-model="nuovoPaziente.cognome">
                            </div>
                            
                            <div class="col-md-6">
                                <label>Sala</label>
                                <select required class="form-select me-2" placeholder="Sala" v-model="nuovoPaziente.sala">
                                    <option v-for="s, i in elencoSale" :value="s" :key="i">{{ s }}</option>
                                </select>

                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Numero chiamata</label>
                                <input required type="number" min="1" max="100" class="form-control me-2" v-model="nuovoPaziente.numero">
                            </div>

                            <div class="col-md-6 mb-3">
                                <label class="form-label">Orario prenotazione</label>
                                <input required type="time" class="form-control me-2" v-model="nuovoPaziente.orario">
                            </div>

                            

                           
                        
                            
                            
                            
                        </div>
                    
                </div>
                <div class="card-footer text-end">
                    <button type="submit" class="btn btn-primary"><i class="bi bi-plus"></i> Aggiungi</button>
                </div>
            </div>
        </form>            

        </div>
        <div class="col-lg-6">

            <div class="row">
                <div class="col-6">
                    <label class="form-label">Mostra:</label>
                    <select class="form-select" v-model="options.mostra">
                        <option value="all">Tutte le sale</option>
                        <option v-for="s, i in elencoSale" :value="s" :key="i">Sala {{ s }}</option>
                    </select>
                </div>
                <div class="col-6">
                    <label class="form-label">Ordina per:</label>
                    <select class="form-select" v-model="options.ordina">
                        <option value="numero">Numero</option>
                        <option value="orario">Orario</option>
                    </select>
                </div>
            </div>

            <table class="table table-sm">
                <tbody>
                    <tr v-if="pazienti.filter(x=>filtraP(x,F_NON_CHIAMATI)).length > 0">
                        <th colspan="4" class="text-center py-3">Pazienti in attesa  {{ options.mostra == 'all' ? '' : ' - Sala '+options.mostra }}</th>
                    </tr>
                    <tr v-if="pazienti.filter(x=>filtraP(x,F_NON_CHIAMATI)).length > 0">
                        <th>#</th>
                        <th>Paziente</th>
                        <th>Orario</th>
                        <th></th>
                    </tr>
                    <tr v-for="p in pazienti.filter(x=>filtraP(x,F_NON_CHIAMATI)).sort(sortP)" :key="p.id">
                        <td>{{ p.numero }}</td>
                        <td><span v-if="options.mostra == 'all'" class="badge rounded-pill mx-2" :class="{'bg-primary': (p.sala=='1'),'bg-success': (p.sala=='2'), 'bg-danger': (p.sala=='3')}">Sala {{ p.sala }}</span> {{ p.nome }} {{ p.cognome }}</td>
                        <td>{{ p.orario }}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-primary me-2" @click="avviaModificaPaziente(p.id)">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" @click="chiamaPaziente(p.id)">
                                <i class="bi bi-megaphone-fill"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="pazienti.filter(x=>filtraP(x,F_CHIAMATI)).length > 0">
                        <th colspan="4" class="text-center py-3">Pazienti chiamati {{ options.mostra == 'all' ? '' : ' - Sala '+options.mostra }}</th>
                    </tr>
                    <tr  v-if="pazienti.filter(x=>filtraP(x,F_CHIAMATI)).length > 0">
                        <th>#</th>
                        <th>Paziente</th>
                        <th>Orario</th>
                        <th></th>
                    </tr>
                    <tr v-for="p in pazienti.filter(x=>filtraP(x,F_CHIAMATI))" :key="p.id">
                        <td>{{ p.numero }}</td>
                        <td><span v-if="options.mostra == 'all'" class="badge rounded-pill mx-2" :class="{'bg-primary': (p.sala=='1'),'bg-success': (p.sala=='2'), 'bg-danger': (p.sala=='3')}">Sala {{ p.sala }}</span> {{ p.nome }} {{ p.cognome }}</td>
                        <td>{{ p.orario }}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-primary me-2" @click="avviaModificaPaziente(p.id)">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary" @click="richiama(p.id)">
                                <i class="bi bi-arrow-repeat"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-if="pazienti.filter(x=>filtraP(x)).length === 0">
                <div class="alert alert-info text-center mt-3">Nessun paziente  {{ options.mostra == 'all' ? '' : ' nella sala '+options.mostra }}</div>
            </div>
           
        </div>
     
    </div>
</div>

<div v-if="false" style="position: fixed; width: 100%; height: 20vh; bottom:0 ; left: 0; padding: 2rem; border-top: 1px solid black; ">
    <table class="table table-bordered">
        <tr v-for="m,i in messages" :key="i">
            <td>{{ m.topic }}</td>
            <td>{{ m.message }}</td>
        </tr>
    </table>
</div>

<!-- Modal -->
<div class="modal fade" id="avviso-altro-device" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
  <div class="modal-dialog  modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body">
        <p>Il pannello <b>Segreteria</b> è stato aperto su un altro computer, o in un'altra scheda del browser.</p>
        <p></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-primary me-2" @click="goToBlank">Chiudi</button>
        <button type="button" class="btn btn-primary" @click="reload">Usa qui</button>
      </div>
    </div>
  </div>
</div>


<!-- Modal -->
<div class="modal fade" id="modal-modifica-paziente" tabindex="-1">
  <div class="modal-dialog  modal-dialog-centered">
    <div class="modal-content">
        <div class="modal-header">
        <h5 class="modal-title">Modifica paziente</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="submitModificaPaziente" id="form-mp">


        <div class="form row g-3 mt-3">
                <div class="col-md-6 mb-3">
                    <label for="np-nome" class="form-label">Nome</label>
                    <input required type="text" id="np-nome" class="form-control me-2" v-model="modificaPaziente.nome">
                </div>

                <div class="col-md-6 mb-3">
                    <label for="np-cognome" class="form-label">Cognome</label>
                    <input required type="text" id="np-cognome" class="form-control me-2" v-model="modificaPaziente.cognome">
                </div>

                <div class="col-md-6 mb-3">
                    <label class="form-label">Numero chiamata</label>
                    <input required type="number" min="1" max="100" class="form-control me-2" v-model="modificaPaziente.numero">
                </div>

                <div class="col-md-6 mb-3">
                    <label class="form-label">Orario prenotazione</label>
                    <input required type="time" class="form-control me-2" v-model="modificaPaziente.orario">
                </div>

                <div class="col-md-6">
                    <label>Sala</label>
                    <select required class="form-select me-2" placeholder="Sala" v-model="modificaPaziente.sala">
                                    <option v-for="s,i in elencoSale" :value="s" :key="i">{{ s }}</option>
                                </select>

                </div>
            </div>

        </form>

      </div>
      <div class="modal-footer text-end">
        <button class="btn btn-outline-danger me-auto" data-bs-dismiss="modal" @click="eliminaPaziente"><i class="bi bi-trash"></i> Elimina paziente</button>
        <button class="btn btn-success" data-bs-dismiss="modal" @click="applicaModificaPaziente"><i class="bi bi-save"></i> Salva</button>
      </div>
    </div>
  </div>
</div>


<!-- Modal -->
<div class="modal fade" id="modal-impostazioni" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
        <div class="modal-header">
        <h5 class="modal-title">Gestione monitor</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        
        <div class="row">
            <div class="col-lg-6">

                <label for="volume-media" class="form-label">Volume media</label>
                <input type="range" class="form-range" id="volume-media" v-model="volume.media" min="0" max="100">

                <label for="volume-annunci" class="form-label">Volume annunci</label>
                <input type="range" class="form-range" id="volume-annunci" v-model="volume.annunci" min="0" max="100">

            </div>
            <div class="col-lg-6">
                
                <table class="table align-middle">
                    <tr>
                        <td>Spegni</td>
                        <td class="text-end"><button data-bs-dismiss="modal" @click="sendCmd('shutdown')" class="btn btn-outline-danger"><i class="bi bi-power"></i></button></td>
                    </tr>
                    <tr>
                        <td>Riavvia</td>
                        <td class="text-end"><button data-bs-dismiss="modal" @click="sendCmd('reboot')" class="btn btn-outline-info"><i class="bi bi-repeat"></i></button></td>
                    </tr>
                    <tr>
                        <td>Svuota lista pazienti</td>
                        <td class="text-end"><button data-bs-dismiss="modal" @click="svuotaLista" class="btn btn-outline-danger"><i class="bi bi-trash"></i></button></td>
                    </tr>
                </table>

            </div>
        </div>

      </div>
    </div>
  </div>
</div>


</template>