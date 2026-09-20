<script setup>
import { ref, computed } from 'vue'
import {
  Check, ShieldCheck, CreditCard, Wallet, User, AtSign, Phone,
  Building2, Tag, X, Loader2,
  RefreshCcw, Lock, Sparkles, ShoppingCart
} from 'lucide-vue-next'

useHead({
  title: 'تکمیل سفارش | دنیاوب'
})

const route = useRoute()
const router = useRouter()
const { createOrder, payWithWallet, hasEnoughWalletBalance } = useCheckout()
const { addItem: addToCartItem } = useCart()

// --- Plans ---
const plans = {
  basic: {
    name: 'هاست پایه',
    monthlyPrice: '290000',
    desc: 'مناسب برای سایت‌های شخصی',
    features: ['۱۰ GB فضای NVMe', 'پهنای باند نامحدود', '۲ دیتابیس', 'SSL رایگان', '۲ ایمیل اختصاصی']
  },
  pro: {
    name: 'هاست حرفه‌ای',
    monthlyPrice: '590000',
    desc: 'مناسب برای فروشگاه‌های آنلاین',
    features: ['۵۰ GB فضای NVMe', 'پهنای باند نامحدود', '۵ دیتابیس', 'بک‌آپ روزانه', 'پشتیبانی اولویت‌دار', '۱۰ ایمیل اختصاصی']
  },
  business: {
    name: 'هاست سازمانی',
    monthlyPrice: '1390000',
    desc: 'مناسب برای سازمان‌های بزرگ',
    features: ['۲۰۰ GB فضای NVMe', 'منابع اختصاصی', '۱۰ دیتابیس', 'LiteSpeed Enterprise', 'پشتیبانی تلفنی', '۵۰ ایمیل اختصاصی']
  }
}

const initialPlan = route.query.plan && plans[route.query.plan] ? route.query.plan : 'pro'
const planId = ref(initialPlan)
const selectedPlan = computed(() => plans[planId.value])

// --- Billing cycle ---
const cycles = [
  { id: 'monthly', label: 'ماهانه', months: 1, discount: 0 },
  { id: 'yearly', label: 'سالانه', months: 12, discount: 0.1, badge: '۱۰٪ تخفیف' }
]
const selectedCycle = ref('yearly')
const activeCycle = computed(() => cycles.find((c) => c.id === selectedCycle.value))

// --- Add-ons ---
const addons = [
  { id: 'ssl', label: 'گواهی SSL Premium (EV)', desc: 'اعتبارسنجی سازمانی و نمایش نام برند در نوار آدرس مرورگر', monthlyPrice: 15000 },
  { id: 'backup', label: 'بک‌آپ لحظه‌ای هر ۶ ساعت', desc: 'به‌جای بک‌آپ روزانه، هر ۶ ساعت یک نسخه پشتیبان تهیه می‌شود', monthlyPrice: 20000 },
  { id: 'migration', label: 'انتقال سایت', desc: 'انتقال کامل سایت از هاست فعلی توسط تیم فنی، بدون قطعی', monthlyPrice: 0, free: true }
]
const selectedAddons = ref(['migration'])
function toggleAddon(id) {
  const i = selectedAddons.value.indexOf(id)
  if (i === -1) selectedAddons.value.push(id)
  else selectedAddons.value.splice(i, 1)
}

// --- Domain ---
const domainOption = ref('existing') // 'existing' | 'later'
const domain = ref(typeof route.query.domain === 'string' ? route.query.domain : '')

// --- Billing type ---
const billingType = ref('individual') // 'individual' | 'company'
const companyName = ref('')
const nationalId = ref('')

// --- Customer info ---
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
  if (code === VALID_COUPON) {
    couponApplied.value = true
  } else {
    couponError.value = 'کد تخفیف نامعتبر است'
  }
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
  // return 'تماس بگیرید'
  return Math.round(n).toLocaleString('fa-IR')
}

const addonsMonthly = computed(() =>
  addons
    .filter((a) => selectedAddons.value.includes(a.id))
    .reduce((sum, a) => sum + a.monthlyPrice, 0)
)

const baseMonthly = computed(() => selectedPlan.value.monthlyPrice + addonsMonthly.value)
const subtotal = computed(() => baseMonthly.value * activeCycle.value.months)
const cycleDiscountAmount = computed(() => subtotal.value * activeCycle.value.discount)
const afterCycleDiscount = computed(() => subtotal.value - cycleDiscountAmount.value)
const couponDiscountAmount = computed(() => (couponApplied.value ? afterCycleDiscount.value * 0.1 : 0))
const totalPrice = computed(() => afterCycleDiscount.value - couponDiscountAmount.value)

// --- Validation + submit ---
const isSubmitting = ref(false)
const isAddingToCart = ref(false)
const toast = useToast()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^09\d{9}$/

function buildProductItem() {
  return {
    type: 'hosting',
    title: selectedPlan.value.name,
    identifier: domainOption.value === 'existing' ? domain.value.trim() : 'بدون دامنه (ثبت بعدی)',
    amount: Math.round(totalPrice.value),
    cycleLabel: activeCycle.value.label,
    summary: [
      { label: 'پلن', value: selectedPlan.value.name },
      { label: 'دامنه', value: domainOption.value === 'existing' ? domain.value.trim() : 'ثبت بعدی از پنل' },
      ...(selectedAddons.value.filter((id) => id !== 'migration').length
        ? [{ label: 'خدمات تکمیلی', value: addons.filter((a) => selectedAddons.value.includes(a.id) && a.id !== 'migration').map((a) => a.label).join('، ') }]
        : [])
    ]
  }
}

async function addToCart() {
  if (domainOption.value === 'existing' && !domain.value.trim()) {
    toast.error('دامنه خود را وارد کنید یا گزینه «بعداً ثبت می‌کنم» را انتخاب کنید')
    return
  }
  isAddingToCart.value = true
  await new Promise((resolve) => setTimeout(resolve, 400))
  addToCartItem(buildProductItem())
  isAddingToCart.value = false
  toast.success(`«${selectedPlan.value.name}» به سبد خرید اضافه شد`)
  router.push('/cart')
}
 
async function submitOrder() {
  window.location.href = "tel:02191090605";
}
// async function submitOrder() {

//   if (!fullName.value.trim() || !email.value.trim() || !phone.value.trim()) {
//     toast.error('لطفاً اطلاعات مشتری را کامل کنید')
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
//   if (domainOption.value === 'existing' && !domain.value.trim()) {
//     toast.error('دامنه خود را وارد کنید یا گزینه «بعداً ثبت می‌کنم» را انتخاب کنید')
//     return
//   }
//   if (!acceptTerms.value) {
//     toast.error('برای ادامه باید قوانین و مقررات را بپذیرید')
//     return
//   }

//   isSubmitting.value = true
//   try {
//     // TODO: اتصال به API واقعی ثبت سفارش هاست
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
//     toast.error('ثبت سفارش با خطا مواجه شد، دوباره تلاش کنید')
//     isSubmitting.value = false
//   }
// }
</script>

<template>
  <div>
    <section class="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-bold mb-3">تکمیل <span class="gradient-text">سفارش</span></h1>
          <p class="text-gray-400">یک قدم تا راه‌اندازی «{{ selectedPlan.name }}» فاصله دارید</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8 items-start">
          <!-- Form -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Plan switcher -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">پلن انتخابی</h2>
              <div class="grid sm:grid-cols-3 gap-3">
                <button
                  v-for="(p, id) in plans"
                  :key="id"
                  type="button"
                  class="text-right rounded-xl border-2 p-4 transition-all"
                  :class="planId === id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40'"
                  @click="planId = id"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-sm">{{ p.name }}</span>
                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" :class="planId === id ? 'border-purple-500 bg-purple-500' : 'border-white/30'">
                      <Check v-if="planId === id" class="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <span class="text-xs text-gray-400">{{ formatPrice(p.monthlyPrice) }} تومان/ماه</span>
                </button>
              </div>
            </div>

            <!-- Billing cycle -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">دوره پرداخت</h2>
              <div class="grid sm:grid-cols-2 gap-4">
                <button
                  v-for="c in cycles"
                  :key="c.id"
                  type="button"
                  class="relative text-right rounded-xl border-2 p-4 transition-all"
                  :class="selectedCycle === c.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40'"
                  @click="selectedCycle = c.id"
                >
                  <span v-if="c.badge" class="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-xs font-bold">
                    {{ c.badge }}
                  </span>
                  <div class="flex items-center justify-between">
                    <span class="font-medium">{{ c.label }}</span>
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="selectedCycle === c.id ? 'border-purple-500 bg-purple-500' : 'border-white/30'">
                      <Check v-if="selectedCycle === c.id" class="w-3 h-3 text-white" />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Add-ons -->
          <fieldset disabled class="glass-card rounded-2xl p-6 opacity-50">
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4 flex items-center gap-2">
                <Sparkles class="w-5 h-5 text-purple-400" /> خدمات تکمیلی
              </h2>
              <div class="space-y-3">
                <label
                  v-for="a in addons"
                  :key="a.id"
                  class="flex items-start gap-3 rounded-xl border-2 p-4 cursor-not-allowed transition-all"
                  :class="selectedAddons.includes(a.id) ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40'"
                >
                  <input
                    type="checkbox"
                    class="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                    :checked="selectedAddons.includes(a.id)"
                    @change="toggleAddon(a.id)"
                  >
                  <div class="flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-medium text-sm">{{ a.label }}</span>
                      <span class="text-xs shrink-0" :class="a.free ? 'text-green-400' : 'text-gray-400'">
                        {{ a.free ? 'رایگان' : `${formatPrice(a.monthlyPrice)} تومان/ماه` }}
                      </span>
                    </div>
                    <p class="text-gray-400 text-xs mt-1 leading-relaxed">{{ a.desc }}</p>
                  </div>
                </label>
              </div>
            </div>
          </fieldset>

            <!-- Domain -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">دامنه سایت</h2>
              <div class="flex gap-3 mb-4">
                <button
                  type="button"
                  class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  :class="domainOption === 'existing' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'border border-white/10 text-gray-400 hover:border-white/30'"
                  @click="domainOption = 'existing'"
                >
                  دامنه دارم
                </button>
                <button
                  type="button"
                  class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  :class="domainOption === 'later' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'border border-white/10 text-gray-400 hover:border-white/30'"
                  @click="domainOption = 'later'"
                >
                  بعداً ثبت می‌کنم
                </button>
              </div>
              <input
                v-if="domainOption === 'existing'"
                v-model="domain"
                type="text"
                dir="ltr"
                placeholder="example.com"
                class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
              >
              <p v-else class="text-gray-400 text-sm">
                مشکلی نیست؛ می‌توانید دامنه را هر زمان از داخل پنل کاربری متصل کنید.
              </p>
            </div>

            <!-- Customer info -->
            <!-- <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">اطلاعات مشتری</h2>

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
            </div> -->

            <!-- Payment method -->
            <!-- <div class="glass-card rounded-2xl p-6">
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
            </div> -->

            <!-- Terms -->
            <label class="flex items-start gap-2 text-sm text-gray-400 cursor-pointer select-none px-1">
              <input
                v-model="acceptTerms"
                type="checkbox"
                class="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
              >
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
              <span class="text-gray-300 font-medium">{{ selectedPlan.name }}</span>
              <span class="text-sm text-gray-400">{{ activeCycle.label }}</span>
            </div>
            <p class="text-gray-400 text-sm mb-4">{{ selectedPlan.desc }}</p>

            <ul class="space-y-2 mb-4 text-gray-300 text-sm">
              <li v-for="f in selectedPlan.features" :key="f" class="flex items-center gap-2">
                <Check class="w-4 h-4 text-green-400 shrink-0" /> {{ f }}
              </li>
            </ul>

            <ul v-if="selectedAddons.length" class="space-y-2 mb-4 text-purple-200 text-sm border-t border-white/10 pt-4">
              <li v-for="a in addons.filter(x => selectedAddons.includes(x.id))" :key="a.id" class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-purple-400 shrink-0" /> {{ a.label }}
              </li>
            </ul>

            <!-- Price breakdown -->
            <div class="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div class="flex items-center justify-between text-gray-400">
                <span>جمع جزء</span>
                <span>{{ formatPrice(subtotal) }} تومان</span>
              </div>
              <div v-if="cycleDiscountAmount > 0" class="flex items-center justify-between text-green-400">
                <span>تخفیف دوره سالانه</span>
                <span>−{{ formatPrice(cycleDiscountAmount) }} تومان</span>
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

            <!-- <button
              type="button"
              :disabled="isSubmitting"
              class="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              @click="submitOrder"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              تماس بگیرید 
            </button> -->

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
              <span class="flex items-center gap-1.5"><RefreshCcw class="w-4 h-4" /> بازگشت وجه تا ۷ روز</span>
            </div>
          </div>
        </div>
    </section>
  </div>
</template>