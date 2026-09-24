<script setup>
import { ref, computed } from 'vue'
import {
  ShoppingCart, Trash2, Globe, Server, Cpu, ArrowLeft, User, AtSign, Phone,
  Building2, CreditCard, Wallet, Check, X, Tag, Loader2, ShieldCheck
} from 'lucide-vue-next'

useHead({
  title: 'سبد خرید | دنیاوب'
})

const router = useRouter()
const { cartItems, removeItem, totalAmount, clearCart } = useCart()
const { createOrder, payWithWallet, hasEnoughWalletBalance } = useCheckout()
const toast = useToast()

const typeIcon = { hosting: Server, vps: Cpu, domain: Globe }
const typeLabel = { hosting: 'هاست ابری', vps: 'VPS ابری', domain: 'دامنه' }

function formatPrice(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '۰'
  return Math.round(Number(n)).toLocaleString('fa-IR')
}

function handleRemove(cartId, title) {
  removeItem(cartId)
  toast.success(`«${title}» از سبد خرید حذف شد`)
}

// --- کد تخفیف سبد ---
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

const couponDiscount = computed(() => (couponApplied.value ? totalAmount.value * 0.1 : 0))
const finalTotal = computed(() => totalAmount.value - couponDiscount.value)

// --- اطلاعات مشتری ---
const billingType = ref('individual')
const companyName = ref('')
const nationalId = ref('')
const fullName = ref('')
const email = ref('')
const phone = ref('')
const acceptTerms = ref(false)

const paymentMethods = [
  { id: 'gateway', icon: CreditCard, label: 'درگاه بانکی' },
  { id: 'wallet', icon: Wallet, label: 'کیف پول داخلی' }
]
const selectedPayment = ref('gateway')

const isSubmitting = ref(false)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^09\d{9}$/

async function handleCheckout() {
  window.location.href = "tel:02191090605";
}

// async function handleCheckout() {
//   if (!cartItems.length) {
//     toast.error('سبد خرید شما خالی است')
//     return
//   }
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
//     // TODO: اتصال به API واقعی ثبت سفارش چندآیتمی
//     const items = cartItems.map((i) => ({
//       type: i.type,
//       title: i.title,
//       identifier: i.identifier,
//       amount: i.amount,
//       cycleLabel: i.cycleLabel
//     }))

//     const order = createOrder({
//       type: 'cart',
//       title: items.length > 1 ? `سبد خرید (${items.length} مورد)` : items[0].title,
//       identifier: items.length > 1 ? `${items.length} سرویس` : items[0].identifier,
//       amount: Math.round(finalTotal.value),
//       items,
//       summary: items.map((i) => ({ label: i.title, value: `${formatPrice(i.amount)} تومان` })),
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
//       await new Promise((resolve) => setTimeout(resolve, 900))
//       payWithWallet(order)
//       clearCart()
//       router.push({ path: '/payment/result', query: { order: order.id, status: 'success' } })
//       return
//     }

//     clearCart()
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
      <div class="mb-10">
        <h1 class="text-3xl sm:text-4xl font-bold flex items-center gap-3">
          <ShoppingCart class="w-8 h-8 text-purple-400" />
          سبد خرید
        </h1>
        <p class="text-gray-400 mt-2">
          می‌توانید چند دامنه، هاست و VPS را با هم به سبد اضافه کنید و در یک مرحله تسویه کنید.
        </p>
      </div>

      <!-- سبد خالی -->
      <div v-if="!cartItems.length" class="glass-card rounded-3xl p-12 text-center">
        <ShoppingCart class="w-14 h-14 text-gray-600 mx-auto mb-4" />
        <h2 class="text-xl font-bold mb-2">سبد خرید شما خالی است</h2>
        <p class="text-gray-400 mb-8">از یکی از صفحات زیر محصول موردنظرتان را انتخاب و به سبد اضافه کنید.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <NuxtLink to="/vps" class="px-6 py-3 rounded-xl glass border border-white/10 hover:border-purple-500/40 transition-all font-medium">VPS ابری</NuxtLink>
          <NuxtLink to="/cloudhosting" class="px-6 py-3 rounded-xl glass border border-white/10 hover:border-purple-500/40 transition-all font-medium">هاست ابری</NuxtLink>
          <NuxtLink to="/domain" class="px-6 py-3 rounded-xl glass border border-white/10 hover:border-purple-500/40 transition-all font-medium">ثبت دامنه</NuxtLink>
        </div>
      </div>

      <div v-else class="grid lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <!-- آیتم‌های سبد -->
          <div class="space-y-4">
            <div
              v-for="item in cartItems"
              :key="item.cartId"
              class="glass-card rounded-2xl p-5 flex items-start gap-4"
            >
              <div class="w-11 h-11 rounded-xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
                <component :is="typeIcon[item.type]" class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-bold">{{ item.title }}</p>
                    <p class="text-gray-500 text-xs mt-0.5" dir="ltr">{{ item.identifier }}</p>
                  </div>
                  <button
                    type="button"
                    class="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                    @click="handleRemove(item.cartId, item.title)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="flex flex-wrap items-center gap-2 mt-3">
                  <span class="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-400">{{ typeLabel[item.type] }}</span>
                  <span v-if="item.cycleLabel" class="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-400">{{ item.cycleLabel }}</span>
                </div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span class="text-xs text-gray-500">مبلغ</span>
                  <span class="font-bold" dir="ltr">{{ formatPrice(item.amount) }} تومان</span>
                </div>
              </div>
            </div>
          </div>

          <!-- اطلاعات مشتری -->
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
                <label for="cart-fullName" class="block text-sm text-gray-300 mb-2">نام و نام خانوادگی</label>
                <div class="relative">
                  <User class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                  <input
                    id="cart-fullName"
                    v-model="fullName"
                    type="text"
                    placeholder="نام شما"
                    class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                  >
                </div>
              </div>

              <div v-if="billingType === 'company'" class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label for="cart-companyName" class="block text-sm text-gray-300 mb-2">نام شرکت</label>
                  <div class="relative">
                    <Building2 class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                    <input
                      id="cart-companyName"
                      v-model="companyName"
                      type="text"
                      placeholder="نام شرکت"
                      class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                    >
                  </div>
                </div>
                <div>
                  <label for="cart-nationalId" class="block text-sm text-gray-300 mb-2">شناسه ملی</label>
                  <input
                    id="cart-nationalId"
                    v-model="nationalId"
                    type="text"
                    placeholder="۱۴ رقم"
                    class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                  >
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label for="cart-email" class="block text-sm text-gray-300 mb-2">ایمیل</label>
                  <div class="relative">
                    <AtSign class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                    <input
                      id="cart-email"
                      v-model="email"
                      type="email"
                      placeholder="example@email.com"
                      class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                    >
                  </div>
                </div>
                <div>
                  <label for="cart-phone" class="block text-sm text-gray-300 mb-2">شماره موبایل</label>
                  <div class="relative">
                    <Phone class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                    <input
                      id="cart-phone"
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

          <!-- روش پرداخت -->
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

        <!-- خلاصه سفارش -->
        <div class="lg:sticky lg:top-28 h-fit space-y-4">
          <div class="glass-card rounded-2xl p-6">
            <h2 class="font-bold mb-4">خلاصه سفارش</h2>

            <div v-if="!couponApplied" class="flex gap-2 mb-5">
              <div class="relative flex-1">
                <Tag class="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                <input
                  v-model="couponInput"
                  type="text"
                  placeholder="کد تخفیف"
                  class="w-full pr-10 pl-3 py-2.5 rounded-lg input-glass text-white placeholder-gray-500 outline-none text-sm"
                  @keyup.enter="applyCoupon"
                >
              </div>
              <button
                type="button"
                class="px-4 py-2.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all text-sm shrink-0"
                @click="applyCoupon"
              >
                اعمال
              </button>
            </div>
            <div v-else class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm mb-5">
              <span class="flex items-center gap-1.5"><Check class="w-4 h-4" /> کد {{ VALID_COUPON }} اعمال شد</span>
              <button type="button" @click="removeCoupon"><X class="w-4 h-4" /></button>
            </div>
            <p v-if="couponError" class="text-red-400 text-xs -mt-3 mb-4">{{ couponError }}</p>

            <div class="space-y-2.5 text-sm mb-4">
              <div class="flex items-center justify-between text-gray-400">
                <span>تعداد آیتم‌ها</span>
                <span>{{ cartItems.length }}</span>
              </div>
              <div class="flex items-center justify-between text-gray-400">
                <span>جمع جزء</span>
                <span dir="ltr">{{ formatPrice(totalAmount) }} تومان</span>
              </div>
              <div v-if="couponDiscount > 0" class="flex items-center justify-between text-green-400">
                <span>تخفیف کد تخفیف</span>
                <span dir="ltr">−{{ formatPrice(couponDiscount) }} تومان</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-white/10 mb-6">
              <span class="font-bold">مبلغ قابل پرداخت</span>
              <span class="text-xl font-black" dir="ltr">{{ formatPrice(finalTotal) }} <span class="text-sm font-normal text-gray-400">تومان</span></span>
            </div>

            <button
              type="button"
              disabled
              class="w-full py-3.5 cursor-default! rounded-xl opacity-50 bg-linear-to-r from-purple-600 to-blue-600 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              @click="handleCheckout"
            >
              <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
              <ShieldCheck v-else class="w-5 h-5" />
              پرداخت
              <!-- {{ isSubmitting ? 'در حال ثبت سفارش...' : 'پرداخت و تکمیل خرید' }} -->
            </button>

            <NuxtLink
              to="/vps"
              class="w-full mt-3 inline-flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
            افزودن محصول دیگر
            <ArrowLeft class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
