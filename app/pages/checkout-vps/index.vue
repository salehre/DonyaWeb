<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Check, ShieldCheck, CreditCard, Wallet, User, AtSign, Phone,
  Building2, Tag, X, Loader2,
  RefreshCcw, Lock, Cpu, HardDrive, Wifi, Layers, ShoppingCart, CheckCircle2, Send
} from 'lucide-vue-next'
import { VPS_LIMITS, calcVpsPrice, formatVpsStorage, VPS_PRICE_CPU, VPS_PRICE_RAM, VPS_PRICE_DISK, VPS_PRICE_IP } from '~/composables/useVpsPricing'

useHead({
  title: 'سفارش VPS | دنیاوب'
})

const route = useRoute()
const router = useRouter()
const { createOrder, payWithWallet, hasEnoughWalletBalance } = useCheckout()
const { addItem: addToCartItem } = useCart()
const config = useRuntimeConfig()
const apiHeaders = useApiHeaders()
// همون کوکی‌ای که useApiHeaders ازش Authorization می‌سازه؛ اینجا برای چک لاگین‌بودن قبل از ارسال استفاده می‌شه
const authTokenCookie = useCookie('donyaweb_auth_token')

// --- VPS plans (فقط مشخصات پایه؛ قیمت با calcVpsPrice از روی نرخ‌های واحد محاسبه می‌شه) ---
const plans = {
  vps1: { name: 'Orbit', cpu: 1, ram: 2, storage: 40 },
  vps2: { name: 'Nova', cpu: 2, ram: 4, storage: 80 },
  vps3: { name: 'Nebula', cpu: 4, ram: 8, storage: 160 },
  vps4: { name: 'Galaxy', cpu: 6, ram: 16, storage: 320 }
}

const isCustom = route.query.custom === '1'
const initialPlan = route.query.plan && plans[route.query.plan] ? route.query.plan : 'vps2'
const planId = ref(initialPlan)
const selectedPlan = computed(() => isCustom ? { ...plans.vps1, name: 'سفارشی' } : plans[planId.value])

// دقیقاً مطابق vps-configurator.html
const limits = VPS_LIMITS

const configuration = ref({
  cpu: isCustom ? limits.cpu.min : selectedPlan.value.cpu,
  ram: isCustom ? limits.ram.min : selectedPlan.value.ram,
  storage: isCustom ? limits.storage.min : selectedPlan.value.storage,
  ip: isCustom ? limits.ip.min : (selectedPlan.value.ip ?? 1)
})

function formatStorage(value) {
  return formatVpsStorage(value)
}

// --- ارسال درخواست VPS به فرم شماره ۳ (پنل دنیاوب) ---
// آیدی هر form_detail دقیقاً مطابق آخرین پاسخ /forms/show برای فرم «vps»:
// Storage=5, RAM=6, CPU=7, IPv4=8, سیستم‌عامل=9, خدمات تکمیلی=10
const VPS_FORM_ID = 3
const VPS_FORM_FIELDS = { storage: 5, ram: 6, cpu: 7, ip: 8, os: 9, addons: 10 }

// جلوی مقدار انتخاب‌شده‌ی هر فیلد، قیمت همون مقدار رو هم می‌نویسه؛ مثلاً «۸۰ GB (+۳۲۰,۰۰۰ تومان/ماه)»
function priceSuffix(price) {
  return price > 0 ? `(${formatPrice(price)} تومان)` : '(رایگان)'
}

const isVpsRequestSubmitting = ref(false)
const isVpsRequestDialogOpen = ref(false)
const vpsRequestSuccess = ref(false)
const vpsRequestErrorMessage = ref('')
let vpsRequestStartTime = 0

onMounted(() => {
  vpsRequestStartTime = Date.now()
})

async function submitVpsRequest() {
  // اسم/آیدی ارسال‌کننده توی پنل ادمین از روی هدر Authorization (دقیقاً مثل tickets/create) ست می‌شه؛
  // پس بدون لاگین، توکنی برای شناسایی کاربر وجود نداره و نباید درخواست ارسال بشه
  if (!authTokenCookie.value) {
    toast.error('برای ثبت درخواست VPS ابتدا وارد حساب کاربری خود شوید')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  isVpsRequestSubmitting.value = true
  vpsRequestErrorMessage.value = ''
  const duration = vpsRequestStartTime ? Math.round((Date.now() - vpsRequestStartTime) / 1000) : 0

  const selectedAddonsList = addons.filter((a) => selectedAddons.value.includes(a.id))

  const payload = {
    formId: VPS_FORM_ID,
    status: 1,
    uniqueForm: true,
    duration,
    formResults: {
      [VPS_FORM_FIELDS.storage]: `${formatStorage(configuration.value.storage)} ${priceSuffix(configuration.value.storage * VPS_PRICE_DISK)}`,
      [VPS_FORM_FIELDS.ram]: `${configuration.value.ram} GB ${priceSuffix(configuration.value.ram * VPS_PRICE_RAM)}`,
      [VPS_FORM_FIELDS.cpu]: `${configuration.value.cpu} Core ${priceSuffix(configuration.value.cpu * VPS_PRICE_CPU)}`,
      [VPS_FORM_FIELDS.ip]: `${configuration.value.ip} عدد ${priceSuffix(Math.max(0, configuration.value.ip - 1) * VPS_PRICE_IP)}`,
      [VPS_FORM_FIELDS.os]: `${activeOs.value.label} ${priceSuffix(activeOs.value.extraMonthly)}`,
      // فیلد «خدمات تکمیلی» توی فرم از نوع چک‌باکس تکیه (kind=5) و فقط '1'/'0' قبول می‌کنه؛
      // فرستادن رشته‌ی چندتایی (اسم+قیمت هر add-on) باعث خطای 403 می‌شد
      [VPS_FORM_FIELDS.addons]: selectedAddonsList.length ? '1' : '0'
    }
  }

  try {
    // نکته‌ی کلیدی: forms/createResults همیشه به‌صورت مهمان ثبت می‌شه و هیچ اسم/آیدی‌ای
    // به پنل نمی‌فرسته. برای اتصال به کاربر لاگین‌شده (از روی Authorization) باید از
    // forms/createResultsWithAuth استفاده کرد — دقیقاً همون منطقی که توی کامپوننت فرم‌ساز
    // پنل شما هست: submitUrl = forced_login === 1 ? 'forms/createResultsWithAuth' : 'forms/createResults'
    const response = await $fetch(`${config.public.apiBase}/forms/createResultsWithAuth`, {
      method: 'POST',
      headers: apiHeaders.value,
      body: payload
    })

    // برای دیباگ سمت بک‌اند (اگه اسم/آیدی ارسال‌کننده توی پنل خالی موند، این پاسخ رو با تیم بک‌اند چک کنید)
    console.log('[VPS request] پاسخ forms/createResults:', response)

    if (Number(response?.code) !== 2000) {
      throw new Error(response?.message || response?.msg || 'ثبت درخواست ناموفق بود')
    }

    vpsRequestSuccess.value = true
    isVpsRequestDialogOpen.value = true
  } catch (error) {
    console.error('[VPS] خطا در ثبت درخواست:', error)
    vpsRequestSuccess.value = false
    vpsRequestErrorMessage.value = 'ثبت درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
    isVpsRequestDialogOpen.value = true
  } finally {
    isVpsRequestSubmitting.value = false
  }
}

function closeVpsRequestDialog() {
  isVpsRequestDialogOpen.value = false
}

// --- Operating system ---
const osOptions = [
  { id: 'ubuntu', label: 'Ubuntu 24.04', extraMonthly: 0 },
  { id: 'debian', label: 'Debian 12', extraMonthly: 0 },
  { id: 'almalinux', label: 'AlmaLinux 9', extraMonthly: 0 },
  { id: 'windows', label: 'Windows Server 2022', extraMonthly: 350000 }
]
const selectedOs = ref('ubuntu')
const activeOs = computed(() => osOptions.find((o) => o.id === selectedOs.value))

// --- Billing cycle ---
const cycles = [
  { id: 'monthly', label: 'ماهانه', months: 1, discount: 0 },
  { id: 'quarterly', label: 'سه‌ماهه', months: 3, discount: 0.05, badge: '۵٪ تخفیف' },
  { id: 'yearly', label: 'سالانه', months: 12, discount: 0.2, badge: '۲۰٪ تخفیف' }
]
const selectedCycle = ref('monthly')
const activeCycle = computed(() => cycles.find((c) => c.id === selectedCycle.value))

// --- Add-ons ---
const addons = [
  { id: 'managed', label: 'پشتیبانی مدیریت‌شده (Managed)', desc: 'پیکربندی، مانیتورینگ و رفع مشکلات سرور توسط تیم فنی دنیاوب', monthlyPrice: 390000 },
  { id: 'backup', label: 'بک‌آپ افزایشی روزانه', desc: 'تهیه نسخه پشتیبان روزانه با نگهداری ۱۴ روزه', monthlyPrice: 290000 },
]
const selectedAddons = ref([])
function toggleAddon(id) {
  const i = selectedAddons.value.indexOf(id)
  if (i === -1) selectedAddons.value.push(id)
  else selectedAddons.value.splice(i, 1)
}

// --- Billing type ---
const billingType = ref('individual')
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
  // return "تماس بگیرید"
  return Math.round(n).toLocaleString('fa-IR')
}

const addonsMonthly = computed(() =>
  addons.filter((a) => selectedAddons.value.includes(a.id)).reduce((s, a) => s + a.monthlyPrice, 0)
)
// قیمت زنده و دقیقاً مثل vps-configurator.html: بر اساس منابع انتخاب‌شده (cpu/ram/storage/ip) محاسبه می‌شه
const configPrice = computed(() => calcVpsPrice(configuration.value))
const baseMonthly = computed(() => configPrice.value + activeOs.value.extraMonthly + addonsMonthly.value)
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
    type: 'vps',
    title: `${selectedPlan.value.name} (${activeOs.value.label})`,
    identifier: 'در حال تخصیص IP',
    amount: Math.round(totalPrice.value),
    cycleLabel: activeCycle.value.label,
    summary: [
      { label: 'پلن', value: selectedPlan.value.name },
      { label: 'vCPU', value: `${configuration.value.cpu} Core` },
      { label: 'RAM', value: `${configuration.value.ram} GB` },
      { label: 'Storage', value: formatStorage(configuration.value.storage) },
      { label: 'IPv4', value: `${configuration.value.ip} عدد` },
      { label: 'سیستم‌عامل', value: activeOs.value.label },
      ...(selectedAddons.value.length
        ? [{ label: 'خدمات تکمیلی', value: addons.filter((a) => selectedAddons.value.includes(a.id)).map((a) => a.label).join('، ') }]
        : [])
    ]
  }
}

async function addToCart() {
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
//   if (!acceptTerms.value) {
//     toast.error('برای ادامه باید قوانین و مقررات را بپذیرید')
//     return
//   }

//   isSubmitting.value = true
//   try {
//     // TODO: اتصال به API واقعی ثبت سفارش VPS (بعداً به‌جای createOrder محلی، یک سفارش روی سرور ساخته می‌شود)
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
          <h1 class="text-3xl md:text-4xl font-bold mb-3">سفارش <span class="gradient-text">سرور VPS</span></h1>
          <p class="text-gray-400">پلن، سیستم‌عامل و تنظیمات سرورتان را نهایی کنید</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8 items-start">
          <!-- Form -->
          <div class="lg:col-span-2 space-y-6">
            <!-- VPS configuration -->
            <div class="glass-card rounded-2xl p-6">
              <div class="flex items-center justify-between gap-3 mb-4">
                <h2 class="font-bold">{{ isCustom ? 'پیکربندی سفارشی' : 'مشخصات پلن' }}</h2>
                <span class="text-blue-300 font-bold">{{ selectedPlan.name }}</span>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="flex items-center justify-between gap-2 mb-3 text-sm">
                    <span class="text-gray-300">vCPU</span>
                    <span class="rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-bold text-white">{{ configuration.cpu }} Core</span>
                  </div>
                  <input v-model.number="configuration.cpu" type="range" :min="limits.cpu.min" :max="limits.cpu.max" :step="limits.cpu.step" class="w-full accent-blue-500">
                  <div class="mt-2 flex justify-between text-xs text-gray-500"><span>۱ Core</span><span>۶۴ Core</span></div>
                </div>

                <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="flex items-center justify-between gap-2 mb-3 text-sm">
                    <span class="text-gray-300">RAM</span>
                    <span class="rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-bold text-white">{{ configuration.ram }} GB</span>
                  </div>
                  <input v-model.number="configuration.ram" type="range" :min="limits.ram.min" :max="limits.ram.max" :step="limits.ram.step" class="w-full accent-blue-500">
                  <div class="mt-2 flex justify-between text-xs text-gray-500"><span>۲ GB</span><span>۱۲۸ GB</span></div>
                </div>

                <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="flex items-center justify-between gap-2 mb-3 text-sm">
                    <span class="text-gray-300">Storage</span>
                    <span class="rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-bold text-white">{{ formatStorage(configuration.storage) }}</span>
                  </div>
                  <input v-model.number="configuration.storage" type="range" :min="limits.storage.min" :max="limits.storage.max" :step="limits.storage.step" class="w-full accent-blue-500">
                  <div class="mt-2 flex justify-between text-xs text-gray-500"><span>۲۰ GB</span><span>۲ TB</span></div>
                </div>

                <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="flex items-center justify-between gap-2 mb-3 text-sm">
                    <span class="text-gray-300">IPv4 <span class="text-[10px] text-green-400">(اولین IP رایگان)</span></span>
                    <span class="rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-bold text-white">{{ configuration.ip }} IP</span>
                  </div>
                  <input v-model.number="configuration.ip" type="range" :min="limits.ip.min" :max="limits.ip.max" :step="limits.ip.step" class="w-full accent-blue-500">
                  <div class="mt-2 flex justify-between text-xs text-gray-500"><span>۱ IP</span><span>۶ IP</span></div>
                </div>
              </div>
            </div>

            <!-- OS -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">سیستم‌عامل</h2>
              <div class="grid sm:grid-cols-2 gap-3">
                <button
                  v-for="o in osOptions"
                  :key="o.id"
                  type="button"
                  class="flex items-center justify-between rounded-xl border-2 p-4 transition-all"
                  :class="selectedOs === o.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/40'"
                  @click="selectedOs = o.id"
                >
                  <span class="font-medium text-sm">{{ o.label }}</span>
                  <span v-if="o.extraMonthly" class="text-xs text-gray-400">+{{ formatPrice(o.extraMonthly) }} تومان/ماه</span>
                  <span v-else class="text-xs text-green-400">رایگان</span>
                </button>
              </div>
            </div>

            <!-- Billing cycle -->
            <!-- <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">دوره پرداخت</h2>
              <div class="grid sm:grid-cols-3 gap-4">
                <button
                  v-for="c in cycles"
                  :key="c.id"
                  type="button"
                  class="relative text-right rounded-xl border-2 p-4 transition-all"
                  :class="selectedCycle === c.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/40'"
                  @click="selectedCycle = c.id"
                >
                  <span v-if="c.badge" class="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-xs font-bold">
                    {{ c.badge }}
                  </span>
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm">{{ c.label }}</span>
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="selectedCycle === c.id ? 'border-blue-500 bg-blue-500' : 'border-white/30'">
                      <Check v-if="selectedCycle === c.id" class="w-3 h-3 text-white" />
                    </div>
                  </div>
                </button>
              </div>
            </div> -->

            <!-- Add-ons -->
            <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">خدمات تکمیلی</h2>
              <div class="space-y-3">
                <label
                  v-for="a in addons"
                  :key="a.id"
                  class="flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all"
                  :class="selectedAddons.includes(a.id) ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/40'"
                >
                  <input
                    type="checkbox"
                    class="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                    :checked="selectedAddons.includes(a.id)"
                    @change="toggleAddon(a.id)"
                  >
                  <div class="flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-medium text-sm">{{ a.label }}</span>
                      <span class="text-xs text-gray-400 shrink-0">{{ formatPrice(a.monthlyPrice) }} تومان/ماه</span>
                    </div>
                    <p class="text-gray-400 text-xs mt-1 leading-relaxed">{{ a.desc }}</p>
                  </div>
                </label>
              </div>
              </div>


            <!-- Payment method -->
            <!-- <div class="glass-card rounded-2xl p-6">
              <h2 class="font-bold mb-4">روش پرداخت</h2>
              <div class="grid sm:grid-cols-2 gap-4">
                <button
                  v-for="m in paymentMethods"
                  :key="m.id"
                  type="button"
                  class="flex items-center gap-3 rounded-xl border-2 p-4 transition-all"
                  :class="selectedPayment === m.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/40'"
                  @click="selectedPayment = m.id"
                >
                  <component :is="m.icon" class="w-5 h-5" :class="selectedPayment === m.id ? 'text-blue-300' : 'text-gray-400'" />
                  <span class="font-medium">{{ m.label }}</span>
                </button>
              </div>
            </div> -->

            <!-- Terms -->
            <label class="flex items-start gap-2 text-sm text-gray-400 cursor-pointer select-none px-1">
              <input
                v-model="acceptTerms"
                type="checkbox"
                class="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
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
              <!-- <span class="text-sm text-gray-400">{{ activeCycle.label }}</span> -->
            </div>
            <p class="text-gray-400 text-sm mb-4">{{ activeOs.label }}</p>

            <ul class="space-y-2 mb-4 text-gray-300 text-sm">
              <li class="flex items-center gap-2"><Cpu class="w-4 h-4 text-blue-400 shrink-0" /> {{ configuration.cpu }} Core</li>
              <li class="flex items-center gap-2"><Layers class="w-4 h-4 text-blue-400 shrink-0" /> {{ configuration.ram }} GB RAM</li>
              <li class="flex items-center gap-2"><HardDrive class="w-4 h-4 text-blue-400 shrink-0" /> {{ formatStorage(configuration.storage) }}</li>
              <li class="flex items-center gap-2"><Wifi class="w-4 h-4 text-blue-400 shrink-0" /> {{ configuration.ip }} IPv4</li>
            </ul>

            <ul v-if="selectedAddons.length" class="space-y-2 mb-4 text-blue-200 text-sm border-t border-white/10 pt-4">
              <li v-for="a in addons.filter(x => selectedAddons.includes(x.id))" :key="a.id" class="flex items-center gap-2">
                <Check class="w-4 h-4 text-blue-400 shrink-0" /> {{ a.label }}
              </li>
            </ul>

            <!-- Price breakdown -->
            <div class="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div class="flex items-center justify-between text-gray-400">
                <span>جمع جزء</span>
                <span>{{ formatPrice(subtotal) }} تومان</span>
              </div>
              <!-- <div v-if="cycleDiscountAmount > 0" class="flex items-center justify-between text-green-400">
                <span>تخفیف دوره {{ activeCycle.label }}</span>
                <span>−{{ formatPrice(cycleDiscountAmount) }} تومان</span>
              </div> -->
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

            <button
              type="button"
              :disabled="isVpsRequestSubmitting"
              class="w-full mt-3 py-3 rounded-xl border-2 border-blue-500/50 hover:bg-blue-500/10 transition-all font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              @click="submitVpsRequest"
            >
              <Loader2 v-if="isVpsRequestSubmitting" class="w-4 h-4 animate-spin" />
              <Send v-else class="w-4 h-4" />
              {{ isVpsRequestSubmitting ? 'در حال ارسال...' : 'درخواست VPS' }}
            </button>

            <div class="flex items-center justify-center gap-4 text-xs text-gray-500 mt-4">
              <span class="flex items-center gap-1.5"><ShieldCheck class="w-4 h-4" /> پرداخت امن</span>
              <span class="flex items-center gap-1.5"><Lock class="w-4 h-4" /> رمزنگاری SSL</span>
              <span class="flex items-center gap-1.5"><RefreshCcw class="w-4 h-4" /> بازگشت وجه تا ۷ روز</span>
            </div>
          </div>
        </div>
    </section>

    <!-- VPS request result dialog -->
    <Teleport to="body">
      <div
        v-if="isVpsRequestDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        @click.self="closeVpsRequestDialog"
      >
        <div class="glass-card w-full max-w-sm rounded-2xl p-6 text-center relative">
          <button
            type="button"
            class="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
            @click="closeVpsRequestDialog"
          >
            <X class="w-5 h-5" />
          </button>

          <div
            class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            :class="vpsRequestSuccess ? 'bg-green-500/20' : 'bg-red-500/20'"
          >
            <CheckCircle2 v-if="vpsRequestSuccess" class="w-7 h-7 text-green-400" />
            <X v-else class="w-7 h-7 text-red-400" />
          </div>

          <h3 class="text-lg font-bold mb-2">
            {{ vpsRequestSuccess ? 'درخواست شما با موفقیت ثبت شد' : 'ثبت درخواست ناموفق بود' }}
          </h3>
          <p class="text-gray-400 text-sm mb-6">
            {{ vpsRequestSuccess ? 'همکاران ما به‌زودی با شما تماس خواهند گرفت.' : vpsRequestErrorMessage }}
          </p>

          <button
            type="button"
            class="w-full py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all font-bold"
            @click="closeVpsRequestDialog"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>