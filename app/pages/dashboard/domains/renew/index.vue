<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowRight, RotateCcw, Globe, Check } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

useHead({
  title: 'تمدید دامنه | دنیاوب'
})

const route = useRoute()
const { getDomainServices } = useDashboard()
const { getRenewalPrice } = useDomainRenewalPrice()
const toast = useToast()

const domains = getDomainServices()

const domainOptions = computed(() =>
  domains.map((d) => ({ label: d.identifier, value: d.id }))
)

const selectedId = ref(
  domains.find((d) => d.identifier === route.query.domain)?.id || domains[0]?.id || ''
)

const periods = [
  { years: 1, label: '۱ سال' },
  { years: 2, label: '۲ سال' },
  { years: 3, label: '۳ سال' }
]
const selectedYears = ref(1)

const selectedDomain = computed(() => domains.find((d) => d.id === selectedId.value) || null)

// پسوند دامنه‌ی انتخاب‌شده (مثلاً "example.com" -> ".com")
const selectedDomainExt = computed(() => {
  const identifier = selectedDomain.value?.identifier || ''
  const idx = identifier.lastIndexOf('.')
  return idx > -1 ? identifier.slice(idx) : ''
})

// قیمت تمدید واقعی که از products/show گرفته می‌شه (همون مقدار ثبت‌شده، با ارز خودش)
const renewalPrice = ref(null) // { amount, currencyName, currencySymbol }
const isLoadingPrice = ref(false)

async function loadRenewalPrice() {
  if (!selectedDomainExt.value) {
    renewalPrice.value = null
    return
  }
  isLoadingPrice.value = true
  try {
    renewalPrice.value = await getRenewalPrice(selectedDomainExt.value)
  } catch (error) {
    console.error('[DomainRenew] خطا در دریافت قیمت تمدید:', error)
    renewalPrice.value = null
  } finally {
    isLoadingPrice.value = false
  }
}

watch(selectedDomainExt, loadRenewalPrice, { immediate: true })

const basePriceLabel = computed(() => {
  if (isLoadingPrice.value) return 'در حال دریافت...'
  if (!renewalPrice.value) return 'تماس بگیرید'
  return `${formatNumber(renewalPrice.value.amount)} ${renewalPrice.value.currencyName}`
})

const totalPriceLabel = computed(() => {
  if (isLoadingPrice.value) return 'در حال دریافت...'
  if (!renewalPrice.value) return 'تماس بگیرید'
  const total = renewalPrice.value.amount * selectedYears.value
  return `${formatNumber(total)} ${renewalPrice.value.currencyName}`
})

function formatNumber(n) {
  return Number(n).toLocaleString('fa-IR')
}

const isSubmitting = ref(false)
const isDone = ref(false)

async function handleRenew() {
  window.location.href = "tel:02191090605";
}

// async function handleRenew() {
//   if (!selectedDomain.value) return
//   isSubmitting.value = true
//   // TODO: اتصال به API واقعی تمدید دامنه / درگاه پرداخت
//   await new Promise((resolve) => setTimeout(resolve, 900))
//   isSubmitting.value = false
//   isDone.value = true
//   toast.success(`دامنه ${selectedDomain.value.identifier} با موفقیت تمدید شد.`)
// }
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <NuxtLink to="/dashboard/domains" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
      <ArrowRight class="w-4 h-4" />
      بازگشت به دامنه‌ها
    </NuxtLink>

    <div v-if="isDone" class="glass-card rounded-3xl p-10 text-center space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
        <Check class="w-7 h-7 text-green-400" />
      </div>
      <h2 class="text-xl font-bold">تمدید با موفقیت ثبت شد</h2>
      <p class="text-gray-400 text-sm">
        دامنه <span dir="ltr">{{ selectedDomain?.identifier }}</span> برای {{ selectedYears }} سال تمدید شد و فاکتور آن در بخش صورت‌حساب‌ها موجود است.
      </p>
      <NuxtLink to="/dashboard/domains" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30">
        بازگشت به دامنه‌ها
      </NuxtLink>
    </div>

    <div v-else class="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
      <h2 class="text-xl font-bold flex items-center gap-2">
        <RotateCcw class="w-5 h-5 text-purple-400" />
        تمدید دامنه
      </h2>

      <div v-if="domains.length">
        <div>
          <label for="domain" class="block text-sm text-gray-300 mb-2">انتخاب دامنه</label>
          <div class="relative">
            <Globe class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
            <div class="pr-12">
              <StartCustomSelect
                id="domain"
                v-model="selectedId"
                :options="domainOptions"
                placeholder="انتخاب دامنه"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2 mt-5">مدت تمدید</label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="p in periods"
              :key="p.years"
              type="button"
              class="py-3 rounded-xl text-sm font-medium border transition-all"
              :class="selectedYears === p.years
                ? 'bg-linear-to-r from-purple-600 to-blue-600 border-transparent shadow-lg shadow-purple-500/30'
                : 'glass border-white/10 text-gray-300 hover:text-white hover:border-purple-500/40'"
              @click="selectedYears = p.years"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="rounded-2xl bg-white/5 p-5 space-y-2 text-sm mt-5">
          <div class="flex justify-between text-gray-400">
            <span>قیمت سالانه</span>
            <span>{{ basePriceLabel }}</span>
          </div>
          <div class="flex justify-between text-gray-400">
            <span>مدت</span>
            <span>{{ selectedYears }} سال</span>
          </div>
          <div class="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
            <span>مبلغ قابل پرداخت</span>
            <span>{{ totalPriceLabel }}</span>
          </div>
        </div>

        <button
          type="button"
          :disabled="isSubmitting"
          class="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
          @click="handleRenew"
        >
          <RotateCcw class="w-4 h-4" />
          تماس بگیرید
          <!-- {{ isSubmitting ? 'در حال پردازش...' : 'تمدید و پرداخت' }} -->
        </button>
      </div>

      <p v-else class="text-gray-400 text-sm text-center py-6">دامنه‌ای برای تمدید در حساب شما یافت نشد.</p>
    </div>
  </div>
</template>