<template>
  <div id="app">
    <template>
      <v-card max-width="344" class="mx-auto">
          <v-card-title>I'm a title</v-card-title>
          <v-card-text>I'm card text</v-card-text>
          <v-card-actions>
            <v-btn text>Click</v-btn>
          </v-card-actions>
        </v-card>   
    </template>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import Vuetify from 'vuetify/lib';

  Vue.use(Vuetify);

  @Component({
    components: {}
  })
  export default class App extends Vue {
    data: [];
    mounted(){

    }
  }
</script>

<style lang="scss">

</style>
