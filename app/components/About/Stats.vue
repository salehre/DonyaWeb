<script setup>
const stats = [
  { value: '۱۶+', label: 'سال تجربه', color: 'text-purple-400' },
  { value: '۱۵۰۰۰+', label: 'مشتری فعال', color: 'text-blue-400' },
  { value: '۴۰+', label: 'اعضای تیم فنی', color: 'text-pink-400' },
  { value: '۹۹.۹۹٪', label: 'میانگین آپتایم', color: 'text-green-400' }
]
</script>

<template>
  <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div v-for="stat in stats" :key="stat.label" class="glass-card rounded-2xl p-6 text-center hover-lift">
        <div class="text-3xl font-bold mb-1" :class="stat.color">{{ stat.value }}</div>
        <div class="text-gray-400 text-sm">{{ stat.label }}</div>
      </div>
    </div>
  </section>
</template>
