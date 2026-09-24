<script setup>
// جزئیات فاکتور با API واقعی توی purchaserecords/[id] هست؛ این آدرس فقط ریدایرکت می‌کنه
definePageMeta({ layout: 'dashboard' })

const route = useRoute()

await navigateTo(`/dashboard/purchaserecords/${route.params.id}`, { replace: true })
</script>

<template>
  <div />
</template>