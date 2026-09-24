<script setup>
import { Check, Loader2 } from 'lucide-vue-next'
import { formatHostingPrice, HOSTING_PRICE_PERIOD_LABEL } from '~/composables/useHostingPlans'

const { plans, isLoading } = await useHostingPlans()
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold mb-4">پلن‌های <span class="gradient-text">پرفروش</span></h2>
      <p class="text-gray-400">مناسب برای انواع نیازها از وبلاگ تا سازمانی</p>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center gap-2 text-gray-400 py-12">
      <Loader2 class="w-5 h-5 animate-spin" /> در حال دریافت پلن‌ها...
    </div>

    <p v-else-if="!plans.length" class="text-center text-gray-400 py-12">
      در حال حاضر پلنی برای نمایش وجود ندارد.
    </p>

    <div v-else class="grid md:grid-cols-3 gap-8">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="glass rounded-3xl p-8 border transition-all flex flex-col"
        :class="plan.discount > 0
          ? 'border-purple-500/50 relative transform scale-105 shadow-2xl shadow-purple-500/20'
          : 'border-white/10 hover:border-purple-500/50 hover:-translate-y-2'"
      >
        <div
          v-if="plan.discountPercent > 0"
          class="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-sm font-bold whitespace-nowrap"
        >
          {{ plan.discountPercent.toLocaleString('fa-IR') }}٪ تخفیف
        </div>

        <h3 class="text-xl font-bold mb-2" :class="plan.discount > 0 ? 'text-purple-300' : ''">{{ plan.name }}</h3>

        <template v-if="plan.hasPrice">
          <div v-if="plan.discount > 0" class="text-sm text-gray-500 line-through">
            {{ formatHostingPrice(plan.price) }} {{ plan.currencyName }}
          </div>
          <div class="font-bold mb-1" :class="plan.discount > 0 ? 'text-4xl' : 'text-3xl'">
            {{ formatHostingPrice(plan.finalPrice) }}
            <span class="text-sm font-normal text-gray-400">{{ plan.currencyName }}/{{ HOSTING_PRICE_PERIOD_LABEL }}</span>
          </div>
        </template>
        <div v-else class="text-2xl font-bold mb-1 text-gray-400">قیمت ناموجود</div>

        <p v-if="plan.desc" class="text-gray-400 text-sm mb-6">{{ plan.desc }}</p>
        <div v-else class="mb-6" />

        <ul v-if="plan.features.length" dir="rtl" class="space-y-3 mb-8 text-right text-gray-300 text-sm">
          <li v-for="(f, i) in plan.features" :key="i" class="flex items-start gap-2">
            <Check class="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <span class="flex flex-wrap gap-x-1">
              <span v-if="f.key" class="font-medium text-gray-200">{{ f.key }}:</span>
              <span dir="ltr">{{ f.value }}</span>
            </span>
          </li>
        </ul>

        <NuxtLink
          v-if="plan.sellable"
          :to="`/checkout-host?plan=${plan.id}`"
          class="mt-auto block text-center w-full py-3 rounded-xl transition-all"
          :class="plan.discount > 0
            ? 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
            : 'border border-white/20 hover:bg-white/10'"
        >
          سفارش
        </NuxtLink>
        <span
          v-else
          class="mt-auto block text-center w-full py-3 rounded-xl border border-white/10 text-gray-500 cursor-not-allowed"
        >
          فعلاً قابل سفارش نیست
        </span>
      </div>
    </div>
  </section>
</template>
