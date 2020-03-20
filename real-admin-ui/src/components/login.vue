<template>
  <v-card max-width="344" class="mx-auto">
    <v-card-title>I'm a title</v-card-title>
    <v-card-text>I'm card text</v-card-text>
    <v-card-actions>
      <v-btn text>Click</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import Vuetify, { VCard, VBtn } from "vuetify/lib";

    Vue.use(Vuetify, {
      theme: {
        options: {
          customProperties: true,
        },
        themes: {
          light: {
            primary: '#ee44aa',
            secondary: '#424242',
            accent: '#82B1FF',
            error: '#FF5252',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FFC107'
          },
        },
      },
      icons: {
        iconfont: 'mdi',
      }
    })

    @Component({
      components: {
        VCard,
        VBtn
      },
    })
    export default class LoginComponent extends Vue {}
</script>
<style lang="scss">

</style>
