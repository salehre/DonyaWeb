<script setup>
import { ref, computed } from 'vue'
import {
  Check, ShieldCheck, CreditCard, Wallet, User, AtSign, Phone,
  Building2, Tag, X, Loader2,
  RefreshCcw, Lock, Globe, ShieldOff, RotateCcw, ShoppingCart
} from 'lucide-vue-next'

useHead({
  title: 'ثبت دامنه | دنیاوب'
})

const route = useRoute()
const router = useRouter()
const { createOrder, payWithWallet, hasEnoughWalletBalance } = useCheckout()
const { addItem: addToCartItem } = useCart()
const config = useRuntimeConfig()
const apiHeaders = useApiHeaders()
const DOMAIN_CATEGORY_ID = '1'
const DOMAIN_PRICE_MULTIPLIER = 235000

// --- TLD price table (annual price) ---
// قبلاً اینجا یه تابع async معمولی با await ساده صدا زده می‌شد که باعث می‌شد
// توی Nuxt، درخواست هم توی SSR و هم دوباره موقع hydrate شدن توی مرورگر
// اجرا بشه (هر محصول دو بار fetch می‌شد). useAsyncData نتیجه رو توی payload
// سرور ذخیره می‌کنه و سمت کلاینت دیگه دوباره fetch نمی‌کنه.
const { data: tlds, status: tldsStatus } = await useAsyncData('checkout-domain-tld-prices', async () => {
  try {
    const response = await $fetch(`${config.public.apiBase}/products/indexLite`, {
      method: 'POST',
      headers: apiHeaders.value,
      body: {
        allowSale: 0,
        amount: 1000,
        direction: 'asc',
        filters: [],
        order: 'order',
        page: 1,
        category: DOMAIN_CATEGORY_ID,
        typeCode: 0,
        withAttrib: false
      }
    })

    if (Number(response?.code) !== 2000) return {}

    const prices = {}
    for (const product of response.Products || []) {
      const ext = String(product.title_fa || '').trim().toLowerCase()
      if (!ext || ext in prices) continue

      const lastPrice = product.product_last_prices
      const rawPrice = product.active_price ?? lastPrice?.price ?? product.final_price ?? product.price
      prices[ext] = rawPrice === null || rawPrice === undefined
        ? null
        : Number(rawPrice) * DOMAIN_PRICE_MULTIPLIER
    }
    return prices
  } catch (error) {
    console.error('[Domain checkout] خطا در دریافت قیمت دامنه‌ها:', error)
    return {}
  }
}, { default: () => ({}) })

const isLoadingPrice = computed(() => tldsStatus.value === 'pending')

const tldOptions = computed(() => Object.entries(tlds.value).map(([value, price]) => ({
  value,
  label: value
})))

function splitDomain(full) {
  const normalizedFull = full.toLowerCase()
  const match = Object.keys(tlds.value)
    .sort((a, b) => b.length - a.length)
    .find((ext) => normalizedFull.endsWith(ext))
  if (match) return { name: full.slice(0, full.length - match.length), tld: match }
  return { name: full, tld: '.com' }
}

const queryDomain = typeof route.query.domain === 'string' ? route.query.domain : ''
const initial = splitDomain(queryDomain || 'my-domain.com')

const domainName = ref(initial.name)
const selectedTld = ref(initial.tld)
const annualPrice = computed(() => tlds.value[selectedTld.value])
const fullDomain = computed(() => `${domainName.value}${selectedTld.value}`)

// --- Registration period ---
const periods = [
  { years: 1, discount: 0, label: '۱ ساله' },
  { years: 2, discount: 0.05, label: '۲ ساله', badge: '۵٪ تخفیف' },
  { years: 3, discount: 0.12, label: '۳ ساله', badge: '۱۲٪ تخفیف' }
]
const selectedYears = ref(1)
const activePeriod = computed(() => periods.find((p) => p.years === selectedYears.value))

// --- Add-ons ---
const addons = [
  { id: 'privacy', label: 'حریم خصوصی WHOIS', desc: 'پنهان‌سازی اطلاعات هویتی مالک دامنه از دید عموم', yearlyPrice: 15000 },
  { id: 'lock', label: 'قفل انتقال دامنه', desc: 'جلوگیری از انتقال یا تغییرات غیرمجاز دامنه', yearlyPrice: 0, free: true },
  { id: 'dns', label: 'مدیریت DNS پیشرفته', desc: 'دسترسی کامل به رکوردهای DNS و مدیریت زیردامنه‌ها', yearlyPrice: 0, free: true }
]
const selectedAddons = ref(['lock', 'dns'])
function toggleAddon(id) {
  const i = selectedAddons.value.indexOf(id)
  if (i === -1) selectedAddons.value.push(id)
  else selectedAddons.value.splice(i, 1)
}

const autoRenew = ref(true)

// --- Billing type ---
const billingType = ref('individual')
const companyName = ref('')
const nationalId = ref('')

// --- Registrant info ---
const fullName = ref('')
const email = ref('')
const phone = ref('')

// --- Payment method ---
const paymentMethods = [
  { id: 'gateway', icon: CreditCard, label: 'درگاه بانکی' },
  { id: 'wallet', icon: Wallet, label: 'کیف پول داخلی' }
]
const selectedPayment = ref('gateway')

// --- Coupon ---
const couponInput = ref('')
const couponApplied = ref(false)
const couponError = ref('')
const VALID_COUPON = 'DONYAWEB10'

function applyCoupon() {
  couponError.value = ''
  const code = couponInput.value.trim().toUpperCase()
  if (!code) return
  if (code === VALID_COUPON) couponApplied.value = true
  else couponError.value = 'کد تخفیف نامعتبر است'
}
function removeCoupon() {
  couponApplied.value = false
  couponInput.value = ''
  couponError.value = ''
}

// --- Terms ---
const acceptTerms = ref(false)

// --- Pricing ---
function formatPrice(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '--'
  return Math.round(Number(n)).toLocaleString('fa-IR')
}

const addonsYearly = computed(() =>
  addons.filter((a) => selectedAddons.value.includes(a.id)).reduce((s, a) => s + a.yearlyPrice, 0)
)
const baseYearly = computed(() => (annualPrice.value || 0) + addonsYearly.value)
const subtotal = computed(() => baseYearly.value * selectedYears.value)
const periodDiscountAmount = computed(() => subtotal.value * activePeriod.value.discount)
const afterPeriodDiscount = computed(() => subtotal.value - periodDiscountAmount.value)
const couponDiscountAmount = computed(() => (couponApplied.value ? afterPeriodDiscount.value * 0.1 : 0))
const totalPrice = computed(() => afterPeriodDiscount.value - couponDiscountAmount.value)

// --- Validation + submit ---
const isSubmitting = ref(false)
const isAddingToCart = ref(false)
const toast = useToast()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^09\d{9}$/
const domainRegex = /^[a-zA-Z0-9-]{2,63}$/

function buildProductItem() {
  return {
    type: 'domain',
    title: fullDomain.value,
    identifier: fullDomain.value,
    amount: Math.round(totalPrice.value),
    cycleLabel: activePeriod.value.label,
    summary: [
      { label: 'دامنه', value: fullDomain.value },
      { label: 'مدت ثبت', value: activePeriod.value.label },
      { label: 'تمدید خودکار', value: autoRenew.value ? 'فعال' : 'غیرفعال' }
    ]
  }
}

async function addToCart() {
  if (!domainName.value.trim() || !domainRegex.test(domainName.value.trim())) {
    toast.error('نام دامنه معتبر نیست (فقط حروف انگلیسی، عدد و خط تیره)')
    return
  }
  isAddingToCart.value = true
  await new Promise((resolve) => setTimeout(resolve, 400))
  addToCartItem(buildProductItem())
  isAddingToCart.value = false
  toast.success(`«${fullDomain.value}» به سبد خرید اضافه شد`)
  router.push('/cart')
}

async function submitOrder() {
  window.location.href = "tel:02191090605";
}

// async function submitOrder() {

//   if (!domainName.value.trim() || !domainRegex.test(domainName.value.trim())) {
//     toast.error('نام دامنه معتبر نیست (فقط حروف انگلیسی، عدد و خط تیره)')
//     return
//   }
//   if (!fullName.value.trim() || !email.value.trim() || !phone.value.trim()) {
//     toast.error('لطفاً اطلاعات مالک دامنه را کامل کنید')
//     return
//   }
//   if (!emailRegex.test(email.value.trim())) {
//     toast.error('ایمیل وارد شده معتبر نیست')
//     return
//   }
//   if (!phoneRegex.test(phone.value.trim())) {
//     toast.error('شماره موبایل باید به‌صورت ۰۹xxxxxxxxx وارد شود')
//     return
//   }
//   if (billingType.value === 'company' && (!companyName.value.trim() || !nationalId.value.trim())) {
//     toast.error('لطفاً نام شرکت و شناسه ملی را وارد کنید')
//     return
//   }
//   if (!acceptTerms.value) {
//     toast.error('برای ادامه باید قوانین و مقررات را بپذیرید')
//     return
//   }

//   isSubmitting.value = true
//   try {
//     // TODO: اتصال به API واقعی ثبت دامنه (WHOIS/Registrar)
//     const order = createOrder({
//       ...buildProductItem(),
//       customer: {
//         fullName: fullName.value.trim(),
//         email: email.value.trim(),
//         phone: phone.value.trim(),
//         billingType: billingType.value,
//         companyName: companyName.value.trim(),
//         nationalId: nationalId.value.trim()
//       },
//       paymentMethod: selectedPayment.value
//     })

//     if (selectedPayment.value === 'wallet') {
//       if (!hasEnoughWalletBalance(order.amount)) {
//         toast.error('موجودی کیف پول کافی نیست. روش «درگاه بانکی» را انتخاب کنید یا ابتدا کیف پول را شارژ کنید.')
//         isSubmitting.value = false
//         return
//       }
//       // TODO: اتصال به API واقعی کسر از کیف پول
//       await new Promise((resolve) => setTimeout(resolve, 900))
//       payWithWallet(order)
//       router.push({ path: '/payment/result', query: { order: order.id, status: 'success' } })
//       return
//     }

//     // TODO: اتصال به درگاه پرداخت واقعی — در حال حاضر به شبیه‌ساز داخلی هدایت می‌شود
//     router.push(`/payment/gateway/${order.id}`)
//   } catch (err) {
//     toast.error('ثبت دامنه با خطا مواجه شد، دوباره تلاش کنید')
//     isSubmitting.value = false
//   }
// }
</script>

<template>
  <div>
    <section class="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-bold mb-3">ثبت <span class="gradient-text">دامنه</span></h1>
          <p class="text-gray-400">دامنه، مدت ثبت و اطلاعات مالک را نهایی کنید</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8 items-start">
          <!-- Form -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Domain -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4 flex items-center gap-2">
                <Globe class="w-5 h-5 text-purple-400" /> نام دامنه
              </h2>
              <div class="flex flex-col sm:flex-row gap-3">
                <div class="sm:w-48">
                  <StartCustomSelect
                    v-model="selectedTld"
                    :options="tldOptions"
                    dir="ltr"
                    placeholder="انتخاب پسوند"
                  />
                </div>
                
                <input
                  v-model="domainName"
                  type="text"
                  dir="ltr"
                  placeholder="my-domain"
                  class="flex-1 px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                >
              </div>
              <p class="text-sm text-gray-400 mt-3">
                دامنه انتخابی: <span class="text-purple-300 font-medium" dir="ltr">{{ fullDomain }}</span>
                — {{ formatPrice(annualPrice) }} تومان/سال
              </p>
            </div>

            <!-- Registration period -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">مدت ثبت</h2>
              <div class="grid sm:grid-cols-3 gap-4">
                <button
                  v-for="p in periods"
                  :key="p.years"
                  type="button"
                  class="relative text-right rounded-xl border-2 p-4 transition-all"
                  :class="selectedYears === p.years ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40'"
                  @click="selectedYears = p.years"
                >
                  <span v-if="p.badge" class="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-xs font-bold">
                    {{ p.badge }}
                  </span>
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm">{{ p.label }}</span>
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="selectedYears === p.years ? 'border-purple-500 bg-purple-500' : 'border-white/30'">
                      <Check v-if="selectedYears === p.years" class="w-3 h-3 text-white" />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Add-ons -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">تنظیمات دامنه</h2>
              <div class="space-y-3">
                <label
                  v-for="a in addons"
                  :key="a.id"
                  class="flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all"
                  :class="selectedAddons.includes(a.id) ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40'"
                >
                  <span class="relative inline-flex w-5 h-5 shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      class="peer sr-only"
                      :checked="selectedAddons.includes(a.id)"
                      @change="toggleAddon(a.id)"
                    >
                    <span class="absolute inset-0 rounded-lg border border-white/20 bg-white/10 transition-all duration-200 peer-checked:border-transparent peer-checked:bg-linear-to-br peer-checked:from-purple-600 peer-checked:to-blue-600 peer-checked:shadow-lg peer-checked:shadow-purple-500/30 peer-focus-visible:ring-4 peer-focus-visible:ring-purple-500/30" />
                    <Check class="absolute inset-0 m-auto w-4 h-4 text-white pointer-events-none scale-50 opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100" />
                  </span>
                  <div class="flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-medium text-sm">{{ a.label }}</span>
                      <span class="text-xs shrink-0" :class="a.free ? 'text-green-400' : 'text-gray-400'">
                        {{ a.free ? 'رایگان' : `${formatPrice(a.yearlyPrice)} تومان/سال` }}
                      </span>
                    </div>
                    <p class="text-gray-400 text-xs mt-1 leading-relaxed">{{ a.desc }}</p>
                  </div>
                </label>

                <label class="flex items-center justify-between gap-3 rounded-xl border-2 border-white/10 p-4 cursor-pointer">
                  <span class="flex items-center gap-2 text-sm font-medium">
                    <RotateCcw class="w-4 h-4 text-gray-400" /> تمدید خودکار پیش از انقضا
                  </span>
                  <span class="relative inline-flex w-6 h-6 shrink-0">
                    <input v-model="autoRenew" type="checkbox" class="peer sr-only">
                    <span class="absolute inset-0 rounded-lg border border-white/20 bg-white/10 transition-all duration-200 peer-checked:border-transparent peer-checked:bg-linear-to-br peer-checked:from-purple-600 peer-checked:to-blue-600 peer-checked:shadow-lg peer-checked:shadow-purple-500/30 peer-focus-visible:ring-4 peer-focus-visible:ring-purple-500/30" />
                    <Check class="absolute inset-0 m-auto w-4 h-4 text-white pointer-events-none scale-50 opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100" />
                  </span>
                </label>
              </div>
            </div>

            <!-- Registrant info -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">اطلاعات مالک دامنه</h2>

              <div class="flex gap-3 mb-5">
                <button
                  type="button"
                  class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  :class="billingType === 'individual' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'border border-white/10 text-gray-400 hover:border-white/30'"
                  @click="billingType = 'individual'"
                >
                  حقیقی
                </button>
                <button
                  type="button"
                  class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  :class="billingType === 'company' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'border border-white/10 text-gray-400 hover:border-white/30'"
                  @click="billingType = 'company'"
                >
                  حقوقی (سازمانی)
                </button>
              </div>

              <div class="space-y-4">
                <div>
                  <label for="fullName" class="block text-sm text-gray-300 mb-2">نام و نام خانوادگی</label>
                  <div class="relative">
                    <User class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                    <input
                      id="fullName"
                      v-model="fullName"
                      type="text"
                      placeholder="نام شما"
                      class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                    >
                  </div>
                </div>

                <div v-if="billingType === 'company'" class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label for="companyName" class="block text-sm text-gray-300 mb-2">نام شرکت</label>
                    <div class="relative">
                      <Building2 class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                      <input
                        id="companyName"
                        v-model="companyName"
                        type="text"
                        placeholder="نام شرکت"
                        class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                      >
                    </div>
                  </div>
                  <div>
                    <label for="nationalId" class="block text-sm text-gray-300 mb-2">شناسه ملی</label>
                    <input
                      id="nationalId"
                      v-model="nationalId"
                      type="text"
                      placeholder="۱۴ رقم"
                      class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                    >
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label for="checkout-email" class="block text-sm text-gray-300 mb-2">ایمیل</label>
                    <div class="relative">
                      <AtSign class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                      <input
                        id="checkout-email"
                        v-model="email"
                        type="email"
                        placeholder="example@email.com"
                        class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                      >
                    </div>
                  </div>
                  <div>
                    <label for="checkout-phone" class="block text-sm text-gray-300 mb-2">شماره موبایل</label>
                    <div class="relative">
                      <Phone class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                      <input
                        id="checkout-phone"
                        v-model="phone"
                        type="tel"
                        dir="ltr"
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none text-right"
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment method -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">روش پرداخت</h2>
              <div class="grid sm:grid-cols-2 gap-4">
                <button
                  v-for="m in paymentMethods"
                  :key="m.id"
                  type="button"
                  class="flex items-center gap-3 rounded-xl border-2 p-4 transition-all"
                  :class="selectedPayment === m.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40'"
                  @click="selectedPayment = m.id"
                >
                  <component :is="m.icon" class="w-5 h-5" :class="selectedPayment === m.id ? 'text-purple-300' : 'text-gray-400'" />
                  <span class="font-medium">{{ m.label }}</span>
                </button>
              </div>
            </div>

            <!-- Terms -->
            <label class="flex items-start gap-2 text-sm text-gray-400 cursor-pointer select-none px-1">
              <span class="relative inline-flex w-6 h-6 shrink-0 mt-0.5">
                <input v-model="acceptTerms" type="checkbox" class="peer sr-only">
                <span class="absolute inset-0 rounded-lg border border-white/20 bg-white/10 transition-all duration-200 peer-checked:border-transparent peer-checked:bg-linear-to-br peer-checked:from-purple-600 peer-checked:to-blue-600 peer-checked:shadow-lg peer-checked:shadow-purple-500/30 peer-focus-visible:ring-4 peer-focus-visible:ring-purple-500/30" />
                <Check class="absolute inset-0 m-auto w-4 h-4 text-white pointer-events-none scale-50 opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100" />
              </span>
              <span>
                <NuxtLink to="/terms" class="text-purple-300 hover:text-purple-200 transition-colors">قوانین و مقررات</NuxtLink>
                استفاده از خدمات دنیاوب را مطالعه کرده‌ام و می‌پذیرم
              </span>
            </label>
          </div>

          <!-- Order summary -->
          <div class="glass-card rounded-2xl p-6 lg:sticky lg:top-28">
            <h2 class="font-bold mb-4">خلاصه سفارش</h2>

            <div class="flex items-center justify-between mb-1">
              <span class="text-gray-300 font-medium" dir="ltr">{{ fullDomain }}</span>
              <span class="text-sm text-gray-400">{{ activePeriod.label }}</span>
            </div>
            <p class="text-gray-400 text-sm mb-4">ثبت دامنه جدید</p>

            <ul class="space-y-2 mb-4 text-gray-300 text-sm">
              <li v-for="a in addons.filter(x => selectedAddons.includes(x.id))" :key="a.id" class="flex items-center gap-2">
                <Check class="w-4 h-4 text-green-400 shrink-0" /> {{ a.label }}
              </li>
              <li v-if="autoRenew" class="flex items-center gap-2">
                <Check class="w-4 h-4 text-green-400 shrink-0" /> تمدید خودکار فعال
              </li>
              <li v-else class="flex items-center gap-2 text-gray-500">
                <ShieldOff class="w-4 h-4 shrink-0" /> تمدید خودکار غیرفعال
              </li>
            </ul>

            <!-- Coupon -->
            <!-- <div class="border-t border-white/10 pt-4 mb-4">
              <div v-if="!couponApplied" class="flex gap-2">
                <div class="relative flex-1">
                  <Tag class="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    v-model="couponInput"
                    type="text"
                    placeholder="کد تخفیف"
                    class="w-full pr-9 pl-3 py-2.5 rounded-lg input-glass text-white placeholder-gray-500 outline-none text-sm"
                    @keyup.enter="applyCoupon"
                  >
                </div>
                <button
                  type="button"
                  class="px-4 rounded-lg border border-white/20 hover:bg-white/10 transition-all text-sm shrink-0"
                  @click="applyCoupon"
                >
                  اعمال
                </button>
              </div>
              <div v-else class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
                <span class="flex items-center gap-1.5"><Check class="w-4 h-4" /> کد {{ couponInput || VALID_COUPON }} اعمال شد</span>
                <button type="button" @click="removeCoupon"><X class="w-4 h-4" /></button>
              </div>
              <p v-if="couponError" class="text-red-400 text-xs mt-2">{{ couponError }}</p>
            </div> -->

            <!-- Price breakdown -->
            <div class="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div class="flex items-center justify-between text-gray-400">
                <span>جمع جزء</span>
                <span>{{ formatPrice(subtotal) }} تومان</span>
              </div>
              <div v-if="periodDiscountAmount > 0" class="flex items-center justify-between text-green-400">
                <span>تخفیف ثبت {{ activePeriod.label }}</span>
                <span>−{{ formatPrice(periodDiscountAmount) }} تومان</span>
              </div>
              <div v-if="couponDiscountAmount > 0" class="flex items-center justify-between text-green-400">
                <span>تخفیف کد تخفیف</span>
                <span>−{{ formatPrice(couponDiscountAmount) }} تومان</span>
              </div>
            </div>

            <div class="border-t border-white/10 mt-4 pt-4 mb-6">
              <div class="flex items-center justify-between text-lg font-bold">
                <span>مبلغ قابل پرداخت</span>
                <span>{{ formatPrice(totalPrice) }} تومان</span>
              </div>
            </div>

            <button
              type="button"
              :disabled="isAddingToCart"
              class="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              @click="addToCart"
            >
              <Loader2 v-if="isAddingToCart" class="w-4 h-4 animate-spin" />
              <ShoppingCart v-else class="w-4 h-4" />
              {{ isAddingToCart ? 'در حال افزودن...' : 'افزودن به سبد خرید' }}
            </button>

            <div class="flex items-center justify-center gap-4 text-xs text-gray-500 mt-4">
              <span class="flex items-center gap-1.5"><ShieldCheck class="w-4 h-4" /> پرداخت امن</span>
              <span class="flex items-center gap-1.5"><Lock class="w-4 h-4" /> رمزنگاری SSL</span>
              <span class="flex items-center gap-1.5"><RefreshCcw class="w-4 h-4" /> پشتیبانی ۲۴/۷</span>
            </div>
          </div>
        </div>
    </section>
  </div>
</template>