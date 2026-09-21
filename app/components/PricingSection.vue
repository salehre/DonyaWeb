<script setup>
import { Check } from 'lucide-vue-next'

const plans = [
  {
    id: 'basic',
    name: 'هاست پایه',
    price: '۴۴۹,۰۰۰',
    desc: 'مناسب برای سایت‌های شخصی',
    features: ['۵ GB فضای NVMe', 'پهنای باند نامحدود', 'پهنای باند نامحدود', '۲ دیتابیس', 'SSL رایگان', '۲ ایمیل اختصاصی'],
    highlighted: false
  },
  {
    id: 'pro',
    name: 'هاست حرفه‌ای',
    price: '۵۸۹,۰۰۰',
    desc: 'مناسب برای فروشگاه‌های آنلاین',
    features: ['۱۰ GB فضای NVMe', 'پهنای باند نامحدود', '۵ دیتابیس', 'بک‌آپ روزانه', 'پشتیبانی اولویت‌دار', '۱۰ ایمیل اختصاصی'],
    highlighted: true,
    badge: 'پیشنهاد ویژه'
  },
  {
    id: 'business',
    name: 'هاست سازمانی',
    price: '۱,۰۹۹,۰۰۰',
    desc: 'مناسب برای سازمان‌های بزرگ',
    features: ['۳۰ GB فضای NVMe', 'منابع اختصاصی', '۱۰ دیتابیس', 'LiteSpeed Enterprise', 'پشتیبانی تلفنی', '۵۰ ایمیل اختصاصی'],
    highlighted: false
  }
]
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold mb-4">پلن‌های <span class="gradient-text">پرفروش</span></h2>
      <p class="text-gray-400">مناسب برای انواع نیازها از وبلاگ تا سازمانی</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="glass rounded-3xl p-8 border transition-all"
        :class="plan.highlighted
          ? 'border-purple-500/50 relative transform scale-105 shadow-2xl shadow-purple-500/20'
          : 'border-white/10 hover:border-purple-500/50 hover:-translate-y-2'"
      >
        <div
          v-if="plan.badge"
          class="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-sm font-bold"
        >
          {{ plan.badge }}
        </div>

        <h3 class="text-xl font-bold mb-2" :class="plan.highlighted ? 'text-purple-300' : ''">{{ plan.name }}</h3>
        <div class="font-bold mb-1" :class="plan.highlighted ? 'text-4xl' : 'text-3xl'">
          {{ plan.price }} <span class="text-sm font-normal text-gray-400">تومان/ماهانه</span>
        </div>
        <p class="text-gray-400 text-sm mb-6">{{ plan.desc }}</p>
        <ul class="space-y-3 mb-8 text-gray-300 text-sm">
          <li v-for="f in plan.features" :key="f" class="flex items-center gap-2">
            <Check class="w-4 h-4 text-green-400" /> {{ f }}
          </li>
        </ul>
        <NuxtLink
          :to="`/checkout-host?plan=${plan.id}`"
          class="block text-center w-full py-3 rounded-xl transition-all"
          :class="plan.highlighted
            ? 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
            : 'border border-white/20 hover:bg-white/10'"
        >
          سفارش
        </NuxtLink>
      </div>
    </div>
  </section>
</template>