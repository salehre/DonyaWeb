<script setup>
import { Search, Check } from 'lucide-vue-next'

const stats = [
  { value: '+۱۵۰۰', label: 'مشتری فعال', color: 'text-purple-400' },
  { value: '۲۴/۷', label: 'پشتیبانی فنی', color: 'text-blue-400' },
  { value: '۱۰Gbps', label: 'پورت شبکه', color: 'text-pink-400' },
  { value: '۹۹.۹۹٪', label: 'آپتایم', color: 'text-green-400' }
]

const domainPrices = [
  { tld: '.com', price: 'تماس بگیرید' },
  { tld: '.ir', price: 'تماس بگیرید' },
  { tld: '.net', price: 'تماس بگیرید' }
]

const domainQuery = ref('')

function searchDomain() {
  const name = domainQuery.value.trim()
  if (!name) return
  navigateTo({ path: '/domain', query: { domain: name } })
}
</script>

<template>
  <section class="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center relative z-10">
      <div class="inline-flex items-center gap-1 mb-4 px-4 py-1 rounded-full glass text-sm text-purple-300 border border-purple-500/30">
        🚀uptime تضمینی 99.9%
      </div>

      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        میزبانی وب <span class="bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">نسل آینده</span><br>
        برای کسب‌وکار شما
      </h1>

      <p class="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
        با تکنولوژی NVMe و پردازنده‌های نسل ۵ اینتل، تجربه‌ای متفاوت از سرعت و امنیت را احساس کنید. زیرساخت ابری کاملاً مقیاس‌پذیر.
      </p>

      <!-- Domain Search -->
      <div class="max-w-3xl mx-auto mb-12 relative">
        <div class="glass-strong rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl">
          <input
            v-model="domainQuery"
            type="text"
            dir="rtl"
            placeholder="نام دامنه مورد نظر خود را وارد کنید..."
            class="flex-1 px-6 py-4 rounded-xl input-glass text-white placeholder-gray-400 outline-none text-lg text-right"
            @keyup.enter="searchDomain"
          >
          <button
            type="button"
            class="px-8 py-4 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            @click="searchDomain"
          >
            <Search class="w-5 h-5" />
            جستجو دامنه
          </button>
        </div>
        <!-- <div class="flex justify-center gap-4 mt-4 text-sm text-gray-400">
          <span v-for="d in domainPrices" :key="d.tld" class="flex items-center gap-1" dir="ltr">
            <Check class="w-4 h-4 text-green-400" /> {{ d.tld }} {{ d.price }}
          </span>
        </div> -->
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
        <div v-for="stat in stats" :key="stat.label" class="glass-card rounded-2xl p-6 text-center hover-lift">
          <div class="text-3xl font-bold mb-1" :class="stat.color">{{ stat.value }}</div>
          <div class="text-gray-400 text-sm">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>