<template>
    <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-20">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold mb-3">پلن‌های <span class="gradient-text">VPS</span></h2>
        <p class="text-gray-400">با رشد پروژه‌تان، پلن را هر زمان ارتقا دهید</p>
      </div>

      <div class="grid md:grid-cols-4 gap-6">
        <button
          v-for="plan in plans"
          :key="plan.id"
          type="button"
          class="text-right glass rounded-3xl p-6 border-2 transition-all relative"
          :class="selectedPlan === plan.id
            ? 'border-blue-500 shadow-2xl shadow-blue-500/20 -translate-y-2'
            : 'border-white/10 hover:border-blue-500/40'"
          @click="selectedPlan = plan.id"
        >
          <div
            v-if="plan.badge"
            class="absolute -top-4 right-1/2 translate-x-1/2 px-3 py-1 rounded-full bg-linear-to-r from-blue-600 to-purple-600 text-xs font-bold whitespace-nowrap"
          >
            {{ plan.badge }}
          </div>

          <div
            class="absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
            :class="selectedPlan === plan.id ? 'border-blue-500 bg-blue-500' : 'border-white/30'"
          >
            <Check v-if="selectedPlan === plan.id" class="w-3 h-3 text-white" />
          </div>

          <h3 class="text-lg font-bold mb-3 text-left" :class="selectedPlan === plan.id ? 'text-blue-300' : ''">{{ plan.name }}</h3>
          <div class="text-2xl font-bold mb-4">
            {{ plan.price }} <span class="text-xs font-normal text-gray-400">تومان/ماهانه</span>
          </div>
          <ul class="space-y-2 text-gray-300 text-sm">
            <li class="flex items-center gap-2"><Cpu class="w-4 h-4 text-blue-400 shrink-0" /> {{ plan.cpu }}</li>
            <li class="flex items-center gap-2"><Layers class="w-4 h-4 text-blue-400 shrink-0" /> {{ plan.ram }} رم</li>
            <li class="flex items-center gap-2"><HardDrive class="w-4 h-4 text-blue-400 shrink-0" /> {{ plan.disk }}</li>
            <li class="flex items-center gap-2"><Wifi class="w-4 h-4 text-blue-400 shrink-0" /> {{ plan.ip }} IPv4 <span class="text-xs text-green-400">(رایگان)</span></li>
          </ul>
        </button>
      </div>

      <div class="flex items-center justify-center gap-3 mt-10">
        <NuxtLink
          :to="`/checkout-vps?plan=${selectedPlan}`"
          class="inline-flex px-8 py-4 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-lg shadow-lg shadow-blue-500/30"
        >
          سفارش {{ plans.find(p => p.id === selectedPlan)?.name }}
        </NuxtLink>

        <div class="p-px rounded-xl bg-linear-to-r from-blue-600 to-purple-600">
          <NuxtLink
            to="/checkout-vps?custom=1"
            class="inline-flex px-8 py-4 rounded-[11px] bg-slate-800 hover:bg-black/80 transition-all font-bold text-lg"
          >
            سفارشی
          </NuxtLink>
        </div>
      </div>
    </section>
</template>

<script setup>
import { Cpu, HardDrive, Wifi, Layers, Check } from 'lucide-vue-next'
import { calcVpsPrice, formatVpsPrice } from '~/composables/useVpsPricing'

const selectedPlan = ref('vps2')

// مشخصات خام هر پلن (cpuCores/ramGb/diskGb) که قیمت ازشون محاسبه می‌شه؛
// برچسب‌های فارسی (cpu/ram/disk) فقط برای نمایش‌ان
const planSpecs = [
  { id: 'vps1', name: 'Orbit', cpuCores: 1, ramGb: 2, diskGb: 40, ip: 1, cpu: '۱ هسته', ram: '۲ GB', disk: '۴۰ GB NVMe' },
  { id: 'vps2', name: 'Nova', cpuCores: 2, ramGb: 4, diskGb: 80, ip: 1, cpu: '۲ هسته', ram: '۴ GB', disk: '۸۰ GB NVMe', badge: 'محبوب' },
  { id: 'vps3', name: 'Nebula', cpuCores: 4, ramGb: 8, diskGb: 160, ip: 1, cpu: '۴ هسته', ram: '۸ GB', disk: '۱۶۰ GB NVMe' },
  { id: 'vps4', name: 'Galaxy', cpuCores: 6, ramGb: 16, diskGb: 320, ip: 1, cpu: '۶ هسته', ram: '۱۶ GB', disk: '۳۲۰ GB NVMe' }
]

const plans = planSpecs.map((p) => ({
  ...p,
  price: formatVpsPrice(calcVpsPrice({ cpu: p.cpuCores, ram: p.ramGb, storage: p.diskGb, ip: p.ip }))
}))
</script>