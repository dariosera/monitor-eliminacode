<script setup>
import {ref, reactive, onMounted} from 'vue'
import client from '@/mqtt/client'
import { Modal } from 'bootstrap';

const elencoSale = ["1","2","3"];

const sala = ref(null)

const connected = ref(false)

let last_update = null;

const errMsg = ref(null);


const pazienti = ref([]);

const uid = typeof(crypto.randomUUID) === "function" ? crypto.randomUUID() : (Math.random()).toString().split(".")[1];

let modalBenvenuto;
onMounted(() => {
    modalBenvenuto = new Modal(document.querySelector("#modal-benvenuto"))
    modalBenvenuto.show()
})

client.on("connect", () => {
  console.log("connected");
});

client.on("message", (topic, message) => {

    const data = JSON.parse(message);

    last_update = (new Date()).toISOString();

    if (topic === `lista/${sala.value}`) {
        pazienti.value = [];
        data.forEach(p => {
            pazienti.value.push(p)
        })
        
    }

});

client.on("close", () => {
  console.log("close");
  connected.value = false
});

const setSala = function() {
    client.subscribe(`lista/${sala.value}`, (err) => {
    if (!err) {
        connected.value = true
        console.log("subscribed");
        client.pub("info/slave",{
            client_id : uid,
            sala: sala.value
        });

        setTimeout(() => {
            if (last_update === null) {
                errMsg.value = `Verificare che il pc segreteria sia connesso e che l'applicazione sia attiva, quindi riprovare.`;
                connected.value = false;
                sala.value = null;
                modalBenvenuto.show()
            } else {
                errMsg.value = null;
            }
        },5000)

    }
  });
}

const chiamaPaziente = function(id) {
    client.pub('medicochiama',{
        id : id,
        sala : sala.value,
    })
}

const cambiaSala = function() {
    client.unsubscribe(`lista/${sala.value}`);
    sala.value = null;
    connected.value = false;
    modalBenvenuto.show()
}


</script>
<template>
<div class="container" v-if="connected">

    <!-- As a heading -->
    <nav class="navbar bg-body-tertiary">
    <div class="container-fluid">
        <span class="navbar-brand mb-0 h1">Studio oculistico - Medico sala {{ sala }} <button class="btn btn-sm btn-outline-secondary" @click="cambiaSala"><i class="bi bi-door-open"></i> Cambia sala</button></span>

        <div><span :class="{'text-success' : connected && last_update!==null, 'text-danger' : !(connected && last_update!==null)}"><i class="bi bi-circle-fill"></i></span> <small>{{ connected && last_update!==null ? "Connesso" : "Disconnesso" }}</small></div>
    </div>
    </nav>

    <div class="row">
       
        <div class="col-md-6 offset-md-3">
            <table class="table table-sm">
                <tbody>
                    <tr>
                        <th colspan="4" class="text-center py-3">Pazienti in attesa</th>
                    </tr>
                    <tr v-if="pazienti.filter(x => x.chiamata===null).length > 0">
                        <th>#</th>
                        <th>Paziente</th>
                        <th>Orario</th>
                        <th></th>
                    </tr>
                    <tr v-else class="text-center">
                        <td colspan="4">Nessuno</td>
                    </tr>
                    <tr v-for="p in pazienti.filter(x => x.chiamata===null).sort(a,b => a.numero > b.numero)" :key="p.id">
                        <td>{{ p.numero }}</td>
                        <td><span class="badge rounded-pill mx-2" :class="{'bg-primary': (p.sala=='1'),'bg-success': (p.sala=='2'), 'bg-danger': (p.sala=='3')}">Sala {{ p.sala }}</span> {{ p.nome }} {{ p.cognome }}</td>
                        <td>{{ p.orario }}</td>
                        <td class="text-end">
                          
                            <button class="btn btn-sm btn-danger" @click="chiamaPaziente(p.id)">
                                <i class="bi bi-megaphone-fill"></i> Chiama
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <th colspan="4" class="text-center py-3">Pazienti già chiamati</th>
                    </tr>
                    <tr  v-if="pazienti.filter(x => x.chiamata!==null).length > 0">
                        <th>#</th>
                        <th>Paziente</th>
                        <th>Orario</th>
                        <th></th>
                    </tr>
                    <tr v-else class="text-center">
                        <td colspan="4">Nessuno</td>
                    </tr>
                    <tr v-for="p in pazienti.filter(x => x.chiamata!==null)" :key="p.id">
                        <td>{{ p.numero }}</td>
                        <td><span class="badge rounded-pill mx-2" :class="{'bg-primary': (p.sala=='1'),'bg-success': (p.sala=='2'), 'bg-danger': (p.sala=='3')}">Sala {{ p.sala }}</span> {{ p.nome }} {{ p.cognome }}</td>
                        <td>{{ p.orario }}</td>
                        <td class="text-end">
                            
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal fade" id="modal-benvenuto" tabindex="-1">
  <div class="modal-dialog  modal-dialog-centered">
    <div class="modal-content">
        <div class="modal-header">
        <h5 class="modal-title">Benvenuto!</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">

        <div v-if="errMsg" class="alert alert-danger">{{ errMsg }}</div>
        
        <div class="mb-3">
            <label class="form-label">
                Seleziona la sala
            </label>
            <select required class="form-select me-2" placeholder="Sala" v-model="sala">
                <option v-for="s,i in elencoSale" :value="s" :key="i">{{ s }}</option>
            </select>
        </div>

      </div>
      <div class="modal-footer text-end">
        <button class="btn btn-success" data-bs-dismiss="modal" @click="setSala">Conferma</button>
      </div>

    </div>
  </div>
</div>


</template>