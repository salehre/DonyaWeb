<script setup>
import { computed } from 'vue'
import { Globe, Server, Cpu, RotateCcw, Settings } from 'lucide-vue-next'

const props = defineProps({
  service: { type: Object, required: true }
})

const typeIcons = {
  hosting: Server,
  vps: Cpu,
  domain: Globe
}

// هر سرویس به جزئیات همان آیتم فاکتور می‌رود
const manageLink = computed(() => {
  return { path: `/dashboard/services/${props.service.id}` }
})

// همون منطقی که خودِ صفحه‌ی جزئیات سرویس برای دکمه‌ی تمدید استفاده می‌کنه، اینجا هم تکرار شده
// تا رفتار «تمدید» از روی کارت با رفتار داخل صفحه‌ی مدیریت یکسان باشه
const renewLink = computed(() => {
  if (props.service.type === 'domain') {
    return { path: '/dashboard/domains/renew', query: { domain: props.service.identifier } }
  }
  return { path: `/dashboard/services/${props.service.id}`, query: { action: 'renew' } }
})
</script>

<template>
  <div class="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
    <div class="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
      <component :is="typeIcons[service.type]" class="w-6 h-6 text-white" />
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap mb-1">
        <h3 class="font-bold">{{ service.name }}</h3>
        <DashboardStatusBadge :status="service.status" />
      </div>
      <p class="text-gray-400 text-sm" dir="ltr">{{ service.identifier }}</p>
    </div>

    <div class="text-sm text-gray-400 sm:text-left">
      <div>خرید: {{ service.purchaseDate }}</div>
      <div>{{ service.price }} تومان / {{ service.cycle }}</div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <NuxtLink
        :to="renewLink"
        class="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-all text-sm flex items-center gap-1.5"
      >
        <RotateCcw class="w-4 h-4" />
        تمدید
      </NuxtLink>
      <NuxtLink
        :to="manageLink"
        class="px-4 py-2 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all text-sm flex items-center gap-1.5"
      >
        <Settings class="w-4 h-4" />
        مدیریت
      </NuxtLink>
    </div>
  </div>
</template>