<template>
  <div id="app">
    <template v-if="!pageLoading">
        <section>
            <b-table
                :data="isEmpty ? [] : data"
                :striped="true"
                :loading="isLoading"
                :mobile-cards="true">

                <template slot-scope="props">
                    <b-table-column field="id" label="ID" width="40" numeric>
                        {{ props.row.id }}
                    </b-table-column>

                    <b-table-column field="first_name" label="First Name">
                        {{ props.row.first_name }}
                    </b-table-column>

                    <b-table-column field="last_name" label="Last Name">
                        {{ props.row.last_name }}
                    </b-table-column>

                    <b-table-column field="date" label="Date" centered>
                        <span class="tag is-success">
                            {{ new Date(props.row.date).toLocaleDateString() }}
                        </span>
                    </b-table-column>

                    <b-table-column label="Gender">
                        <span>
                            <b-icon pack="fas"
                                :icon="props.row.gender === 'Male' ? 'mars' : 'venus'">
                            </b-icon>
                            {{ props.row.gender }}
                        </span>
                    </b-table-column>
                </template>

                <template slot="empty">
                    <section class="section">
                        <div class="content has-text-grey has-text-centered">
                            <p>
                                <b-icon
                                    icon="emoticon-sad"
                                    size="is-large">
                                </b-icon>
                            </p>
                            <p v-if="isEmpty">Nothing here.</p>
                        </div>
                    </section>
                </template>
            </b-table>
        </section>
    </template>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import io from "socket.io-client";
  import Buefy from 'buefy';
  import 'buefy/dist/buefy.css';
  
  Vue.use(Buefy);

  let socket: SocketIOClient.Socket;

  function setCookie(cname: string, cvalue: string, exdays: number) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  function getCookie(cname: string) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  @Component({
    components: {}
  })
  export default class App extends Vue {
    data: [];
    isEmpty: boolean = false;
    isLoading: boolean = true;
    pageLoading: boolean = true;
    reqId: string;
    loadingComponent: { close(): any };

    beforeCreate(){
      socket = io("http://localhost:3000/data");
      let self = this;
      socket.on('connect', function(){
        self.reqId = getCookie("reqId");
        console.log(self.reqId);
        if(!self.reqId){
          socket.once("join", function(reqId: string){
            setCookie("reqId", reqId, 1);
            self.reqId = reqId;
            self.pageLoading = false;
            self.loadingComponent.close();
            socket.on(`data:${self.reqId}`, function(data: any){
              self.data = data;
              if(data){
                self.isEmpty = false;
              }
              else {
                self.isEmpty = true;
              }
              self.isLoading = false;
            });
          });
        }
        else {
          self.pageLoading = false;
          self.loadingComponent.close();
          socket.on(`data:${self.reqId}`, function(data: any){
            self.data = data;
            if(data){
              self.isEmpty = false;
            }
            else {
              self.isEmpty = true;
            }
            self.isLoading = false;
          });
        }
      });
      socket.on('disconnect', function(){
        console.log("disconnected");
      });
    }
    mounted(){
      this.loadingComponent = this.$buefy.loading.open({
          container: null
      });
    }
    beforeDestroy(){
      socket.disconnect();
    }
  }
</script>

<style lang="scss">
  @import "~bulma/sass/utilities/_all";
  @import "~bulma";
  @import "~buefy/src/scss/buefy";
  

  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
</style>
