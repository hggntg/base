<template>
  <div id="app">
    <p>Home vue Home</p>
  </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    console.log("This is home vue home");

    @Component({
    components: {},
    })
    export default class HomeComponent extends Vue {}
</script>
<style lang="scss">

</style>
