<script setup>
import { ChevronLeft, Globe } from 'lucide-vue-next'
import { formatHostingPrice, HOSTING_PRICE_PERIOD_LABEL } from '~/composables/useHostingPlans'

const props = defineProps({
  domain: {
    type: String,
    default: ''
  },
  planId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  planPrice: {
    type: Number,
    default: 0
  },
  currencyName: {
    type: String,
    default: 'تومان'
  },
  sellable: {
    type: Boolean,
    default: true
  }
})

const priceLabel = computed(() =>
  props.planPrice > 0
    ? `${formatHostingPrice(props.planPrice)} ${props.currencyName}/${HOSTING_PRICE_PERIOD_LABEL}`
    : 'قیمت ناموجود'
)

const checkoutHref = computed(() => {
  const query = new URLSearchParams()
  query.set('plan', props.planId)
  if (props.domain) query.set('domain', props.domain)
  return `/checkout-host?${query.toString()}`
})
</script>

<template>
  <section class="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-50 pointer-events-none">
    <div class="max-w-4xl mx-auto pointer-events-auto">
      <div class="glass-strong rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div class="flex items-center gap-4 w-full sm:w-auto">
          <div>
            <span class="text-gray-400 text-sm block mb-1">پلن انتخابی شما:</span>
            <div class="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              {{ planName }}
              <span class="text-sm font-normal text-gray-400">— {{ priceLabel }}</span>
            </div>
            <div v-if="domain" class="flex items-center gap-1.5 text-xs text-purple-300 mt-1">
              <Globe class="w-3.5 h-3.5" />
              <span dir="ltr">{{ domain }}</span>
            </div>
          </div>
        </div>

        <NuxtLink
          v-if="sellable"
          :to="checkoutHref"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all font-bold text-white shadow-lg shadow-purple-500/30 group shrink-0"
        >
          ادامه و ساخت حساب
          <ChevronLeft class="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        </NuxtLink>
        <span
          v-else
          class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-white/10 text-gray-500 cursor-not-allowed shrink-0"
        >
          فعلاً قابل سفارش نیست
        </span>
      </div>
    </div>
  </section>
</template>
