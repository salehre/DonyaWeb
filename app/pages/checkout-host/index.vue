<script setup>
import { ref, computed } from 'vue'
import {
  Check, ShieldCheck, CreditCard, Wallet, User, AtSign, Phone,
  Building2, Tag, X, Loader2,
  RefreshCcw, Lock, Sparkles, ShoppingCart
} from 'lucide-vue-next'
import { formatHostingPrice } from '~/composables/useHostingPlans'

useHead({
  title: 'تکمیل سفارش | دنیاوب'
})

const route = useRoute()
const router = useRouter()
const { createOrder, payWithWallet, hasEnoughWalletBalance } = useCheckout()
const { addItem: addToCartItem } = useCart()

// --- Plans (از API) ---
const { plans, isLoading: isLoadingPlans, findPlan, defaultPlan } = await useHostingPlans()

const planId = ref(typeof route.query.plan === 'string' ? route.query.plan : '')

// اگه پلن داخل query معتبر نبود، اولین پلن قابل‌سفارش انتخاب می‌شه
watch(defaultPlan, (plan) => {
  if (!findPlan(planId.value) && plan) planId.value = plan.id
}, { immediate: true })

const selectedPlan = computed(() => findPlan(planId.value))

function selectPlan(plan) {
  if (plan.sellable) planId.value = plan.id
}

// --- Billing cycle ---
// ⚠️ API دوره‌ی پرداخت و تخفیف دوره‌ای برنمی‌گردونه؛ تخفیف سالانه فعلاً سمت کلاینت تعریف شده
const YEARLY_DISCOUNT = 0.1
const cycles = [
  { id: 'monthly', label: 'ماهانه', months: 1, discount: 0 },
  {
    id: 'yearly',
    label: 'سالانه',
    months: 12,
    discount: YEARLY_DISCOUNT,
    badge: YEARLY_DISCOUNT > 0 ? `${Math.round(YEARLY_DISCOUNT * 100).toLocaleString('fa-IR')}٪ تخفیف` : null
  }
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
const selectedAddonItems = computed(() => addons.filter((a) => selectedAddons.value.includes(a.id)))

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

// --- Terms ---
const acceptTerms = ref(false)

// --- Pricing ---
// قیمت ماهانه‌ی پلن از API (price / discount / final_price) × تعداد ماه دوره، به‌علاوه‌ی خدمات تکمیلی
const months = computed(() => activeCycle.value.months)
const addonsMonthly = computed(() => selectedAddonItems.value.reduce((sum, a) => sum + a.monthlyPrice, 0))

const subtotal = computed(() => ((selectedPlan.value?.price || 0) + addonsMonthly.value) * months.value)
const discountAmount = computed(() => (selectedPlan.value?.discount || 0) * months.value)
const afterPlanDiscount = computed(() => subtotal.value - discountAmount.value)
const cycleDiscountAmount = computed(() => afterPlanDiscount.value * activeCycle.value.discount)
const totalPrice = computed(() => afterPlanDiscount.value - cycleDiscountAmount.value)
const currencyName = computed(() => selectedPlan.value?.currencyName || 'تومان')

// --- Validation + submit ---
const isSubmitting = ref(false)
const isAddingToCart = ref(false)
const toast = useToast()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^09\d{9}$/

function buildProductItem() {
  return {
    type: 'hosting',
    productId: selectedPlan.value.id,
    title: selectedPlan.value.name,
    identifier: domainOption.value === 'existing' ? domain.value.trim() : 'بدون دامنه (ثبت بعدی)',
    amount: Math.round(totalPrice.value),
    cycleLabel: activeCycle.value.label,
    summary: [
      { label: 'پلن', value: selectedPlan.value.name },
      { label: 'دوره پرداخت', value: activeCycle.value.label },
      { label: 'دامنه', value: domainOption.value === 'existing' ? domain.value.trim() : 'ثبت بعدی از پنل' },
      ...(selectedAddonItems.value.filter((a) => a.id !== 'migration').length
        ? [{ label: 'خدمات تکمیلی', value: selectedAddonItems.value.filter((a) => a.id !== 'migration').map((a) => a.label).join('، ') }]
        : [])
    ]
  }
}

async function addToCart() {
  if (!selectedPlan.value?.sellable) {
    toast.error('این پلن در حال حاضر قابل سفارش نیست')
    return
  }
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
          <p v-if="selectedPlan" class="text-gray-400">یک قدم تا راه‌اندازی «{{ selectedPlan.name }}» فاصله دارید</p>
        </div>

        <div v-if="isLoadingPlans" class="flex items-center justify-center gap-2 text-gray-400 py-12">
          <Loader2 class="w-5 h-5 animate-spin" /> در حال دریافت پلن‌ها...
        </div>

        <div v-else-if="!selectedPlan" class="glass-card rounded-2xl p-8 text-center text-gray-400">
          در حال حاضر پلنی برای سفارش وجود ندارد.
        </div>

        <div v-else class="grid lg:grid-cols-3 gap-8 items-start">
          <!-- Form -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Plan switcher -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">پلن انتخابی</h2>
              <div class="grid sm:grid-cols-3 gap-3">
                <button
                  v-for="p in plans"
                  :key="p.id"
                  type="button"
                  :disabled="!p.sellable"
                  class="text-right rounded-xl border-2 p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="planId === p.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40'"
                  @click="selectPlan(p)"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-sm">{{ p.name }}</span>
                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" :class="planId === p.id ? 'border-purple-500 bg-purple-500' : 'border-white/30'">
                      <Check v-if="planId === p.id" class="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <span class="text-xs text-gray-400">
                    {{ p.hasPrice ? `${formatHostingPrice(p.finalPrice)} ${p.currencyName}/ماه` : 'قیمت ناموجود' }}
                  </span>
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
                        {{ a.free ? 'رایگان' : `${formatHostingPrice(a.monthlyPrice)} ${currencyName}/ماه` }}
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
            <p v-if="selectedPlan.desc" class="text-gray-400 text-sm mb-4">{{ selectedPlan.desc }}</p>

            <ul v-if="selectedPlan.features.length" dir="rtl" class="space-y-2 mb-4 text-right text-gray-300 text-sm">
              <li v-for="(f, i) in selectedPlan.features" :key="i" class="flex items-start gap-2">
                <Check class="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span class="flex flex-wrap gap-x-1">
                  <span v-if="f.key" class="font-medium text-gray-200">{{ f.key }}:</span>
                  <span dir="ltr">{{ f.value }}</span>
                </span>
              </li>
            </ul>

            <ul v-if="selectedAddonItems.length" class="space-y-2 mb-4 text-purple-200 text-sm border-t border-white/10 pt-4">
              <li v-for="a in selectedAddonItems" :key="a.id" class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-purple-400 shrink-0" /> {{ a.label }}
              </li>
            </ul>

            <!-- Price breakdown -->
            <div class="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div class="flex items-center justify-between text-gray-400">
                <span>جمع جزء</span>
                <span>{{ formatHostingPrice(subtotal) }} {{ currencyName }}</span>
              </div>
              <div v-if="discountAmount > 0" class="flex items-center justify-between text-green-400">
                <span>تخفیف ({{ selectedPlan.discountPercent.toLocaleString('fa-IR') }}٪)</span>
                <span>−{{ formatHostingPrice(discountAmount) }} {{ currencyName }}</span>
              </div>
              <div v-if="cycleDiscountAmount > 0" class="flex items-center justify-between text-green-400">
                <span>تخفیف دوره سالانه</span>
                <span>{{ formatHostingPrice(cycleDiscountAmount) }}- {{ currencyName }}</span>
              </div>
            </div>

            <div class="border-t border-white/10 mt-4 pt-4 mb-6">
              <div class="flex items-center justify-between text-lg font-bold">
                <span>مبلغ قابل پرداخت</span>
                <span>{{ selectedPlan.hasPrice ? `${formatHostingPrice(totalPrice)} ${currencyName}` : 'قیمت ناموجود' }}</span>
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
              :disabled="isAddingToCart || !selectedPlan.sellable"
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
