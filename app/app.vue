<script setup>
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster
    theme="dark"
    dir="rtl"
    position="bottom-center"
    rich-colors
    :toast-options="{ style: { fontFamily: 'inherit' } }"
  />
</template>