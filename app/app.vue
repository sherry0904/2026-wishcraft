<template>
  <div class="app-container">
    <VitePwaManifest />
    <NuxtPage />
  </div>
</template>

<script setup>
import '~/assets/css/main.css'
</script>

<style>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>

