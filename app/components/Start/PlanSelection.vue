<script setup>
import { CheckCircle2, Check, Globe, Loader2 } from 'lucide-vue-next'
import { formatHostingPrice, HOSTING_PRICE_PERIOD_LABEL } from '~/composables/useHostingPlans'

defineProps({
  domain: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['change'])

const planModel = defineModel({ type: String, default: '' })

const { plans, isLoading } = await useHostingPlans()

function choose(plan) {
  if (!plan.sellable) return
  planModel.value = plan.id
  emit('change', plan.id)
}
</script>

<template>
  <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
    <div class="text-center mb-4">
      <h2 class="text-3xl font-bold mb-3">یک پلن <span class="gradient-text">انتخاب کنید</span></h2>
      <p class="text-gray-400">هر زمان می‌توانید پلن خود را ارتقا دهید</p>
    </div>

    <div v-if="domain" class="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
      <Globe class="w-4 h-4 text-purple-400" />
      دامنه انتخابی: <span class="text-purple-300 font-medium" dir="ltr">{{ domain }}</span>
    </div>
    <div v-else class="mb-10" />

    <div v-if="isLoading" class="flex items-center justify-center gap-2 text-gray-400 py-12">
      <Loader2 class="w-5 h-5 animate-spin" /> در حال دریافت پلن‌ها...
    </div>

    <p v-else-if="!plans.length" class="text-center text-gray-400 py-12">
      در حال حاضر پلنی برای نمایش وجود ندارد.
    </p>

    <div v-else class="grid md:grid-cols-3 gap-8 items-start">
      <button
        v-for="plan in plans"
        :key="plan.id"
        type="button"
        :disabled="!plan.sellable"
        class="text-right glass rounded-3xl p-8 border-2 transition-all duration-300 relative disabled:opacity-50 disabled:cursor-not-allowed"
        :class="planModel === plan.id
          ? 'border-purple-500 shadow-2xl shadow-purple-500/20 -translate-y-2'
          : 'border-white/10 hover:border-purple-500/40 hover:-translate-y-1'"
        @click="choose(plan)"
      >
        <div
          v-if="plan.discountPercent > 0"
          class="absolute -top-4 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-sm font-bold whitespace-nowrap shadow-lg"
        >
          {{ plan.discountPercent.toLocaleString('fa-IR') }}٪ تخفیف
        </div>

        <div
          class="absolute top-6 left-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
          :class="planModel === plan.id ? 'border-purple-500 bg-purple-500' : 'border-white/30'"
        >
          <Check v-if="planModel === plan.id" class="w-4 h-4 text-white" />
        </div>

        <h3 class="text-xl font-bold mb-2 pl-8" :class="planModel === plan.id ? 'text-purple-300' : ''">{{ plan.name }}</h3>

        <template v-if="plan.hasPrice">
          <div v-if="plan.discount > 0" class="text-sm text-gray-500 line-through">
            {{ formatHostingPrice(plan.price) }} {{ plan.currencyName }}
          </div>
          <div class="text-3xl font-bold mb-1">
            {{ formatHostingPrice(plan.finalPrice) }}
            <span class="text-sm font-normal text-gray-400">{{ plan.currencyName }}/{{ HOSTING_PRICE_PERIOD_LABEL }}</span>
          </div>
        </template>
        <div v-else class="text-2xl font-bold mb-1 text-gray-400">قیمت ناموجود</div>

        <p v-if="plan.desc" class="text-gray-400 text-sm mb-6">{{ plan.desc }}</p>
        <div v-else class="mb-6" />

        <ul v-if="plan.features.length" dir="rtl" class="space-y-3 text-right text-gray-300 text-sm">
          <li v-for="(f, i) in plan.features" :key="i" class="flex items-start gap-2">
            <CheckCircle2 class="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <span class="flex flex-wrap gap-x-1">
              <span v-if="f.key" class="font-medium text-gray-200">{{ f.key }}:</span>
              <span dir="ltr">{{ f.value }}</span>
            </span>
          </li>
        </ul>
      </button>
    </div>
  </section>
</template>
