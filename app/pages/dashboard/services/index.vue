<script setup>
import { computed, watch } from 'vue'
import { Plus } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

useHead({
  title: 'سرویس‌های من | دنیاوب'
})

const route = useRoute()
const router = useRouter()
const services = []

const filters = [
  { value: 'all', label: 'همه' },
  { value: 'hosting', label: 'هاست' },
  { value: 'vps', label: 'VPS' },
  { value: 'domain', label: 'دامنه' }
]

const validTypes = filters.map((f) => f.value)

// فیلتر فعال از روی کوئری استرینگ خونده می‌شه تا لینک‌های سایدبار (مدیریت هاست/VPS/دامنه) درست کار کنن
const activeFilter = computed(() => {
  const type = route.query.type
  return validTypes.includes(type) ? type : 'all'
})

function setFilter(value) {
  router.replace({ query: value === 'all' ? {} : { type: value } })
}

const filteredServices = computed(() => {
  if (activeFilter.value === 'all') return services
  return services.filter((s) => s.type === activeFilter.value)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all border"
          :class="activeFilter === f.value
            ? 'bg-linear-to-r from-purple-600 to-blue-600 border-transparent shadow-lg shadow-purple-500/30'
            : 'glass border-white/10 text-gray-300 hover:text-white hover:border-purple-500/40'"
          @click="setFilter(f.value)"
        >
          {{ f.label }}
        </button>
      </div>

      <NuxtLink
        to="/start"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm shadow-lg shadow-purple-500/30"
      >
        <Plus class="w-4 h-4" />
        سرویس جدید
      </NuxtLink>
    </div>

    <div v-if="filteredServices.length" class="space-y-4">
      <DashboardServiceCard v-for="s in filteredServices" :key="s.id" :service="s" />
    </div>
    <div v-else class="glass-card rounded-3xl p-12 text-center text-gray-400">
      سرویسی در این دسته پیدا نشد.
    </div>
  </div>
</template>