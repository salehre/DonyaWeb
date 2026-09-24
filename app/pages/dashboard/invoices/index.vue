<script setup>
// صورت‌حساب‌ها همون «سوابق خرید» هستن که با API واقعی کار می‌کنه؛ این آدرس فقط ریدایرکت می‌کنه
definePageMeta({ layout: 'dashboard' })

await navigateTo('/dashboard/purchaserecords', { replace: true })
</script>

<template>
  <div />
</template>