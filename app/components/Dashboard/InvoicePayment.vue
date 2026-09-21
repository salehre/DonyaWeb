<script setup>
// پرداخت فاکتور «در انتظار پرداخت» — بر اساس مرحله‌ی payment در CartSpike.vue پروژه‌ی مبدأ.
// مراحل: ۱) گرفتن روش‌های پرداخت  ۲) گرفتن موجودی کیف پول  ۳) invoices/updateToNextStatus و رفتن به درگاه.
// فقط برای فاکتورهای بدون کالای فیزیکی (بدون نیاز به آدرس/زمان ارسال) استفاده می‌شه.
import { ref, computed, onMounted } from 'vue'
import { CreditCard, Wallet, Loader2, AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  invoice: { type: Object, required: true }
})

const toast = useToast()
const { t, apiFetch, numberWithSeparator } = usePurchaseRecords()

const loading = ref(true)
const paying = ref(false)
const paymentProcedure = ref([])
const paymentOption = ref(null)
const walletInfo = ref(null)

// مبلغی که همین الان باید پرداخت بشه: همون total_price نهایی فاکتور (بعد از کسر تخفیف پایه و کد تخفیف)
// توجه: invoice_details فیلدی به اسم cash_amount نداره؛ فیلد واقعی هر آیتم total_price هست (مثل جدول همین صفحه)
const payableAmount = computed(() => Number(props.invoice.total_price) || 0)

// وقتی کیف پول انتخاب شده، تا سقف موجودی از کیف پول کم می‌شه
const walletDecrease = computed(() => {
  if (paymentOption.value?.pp_d1 !== 'walletPayment' || !walletInfo.value) return 0
  return Math.min(Number(walletInfo.value.balance) || 0, payableAmount.value)
})

const walletInsufficient = computed(
  () => paymentOption.value?.pp_d1 === 'walletPayment' && payableAmount.value - walletDecrease.value !== 0
)

// گزینه‌ی کیف پول فقط وقتی نشون داده می‌شه که کیف پول همین ارزِ فاکتور وجود داشته باشه
const visibleOptions = computed(() =>
  paymentProcedure.value.filter((o) => o.pp_d1 !== 'walletPayment' || walletInfo.value)
)

const gatewayLabel = (title) => (title === 'zarinpal' ? 'زرین‌پال' : title)

async function loadPaymentProcedure() {
  // مثل نمونه، language_id و currency_id ثابت ۱ هست
  const response = await apiFetch('/options/indexPaymentProcedure', { language_id: 1, currency_id: 1 })
  const list = []
  for (const value of response.PaymentProcedure || []) {
    const base = {
      pp_id: value.id,
      pp_title: value.title,
      pp_d1: value.dynamic_column_01,
      pp_d2: value.dynamic_column_02,
      pp_d3: value.dynamic_column_03,
      pp_d4: value.dynamic_column_04,
      pp_d5: value.dynamic_column_05
    }
    if (value.dynamic_column_01 === 'onlinePayment') {
      for (const gateway of value.gateways || []) {
        list.push({ ...base, gateway_id: gateway.id, gateway_title: gateway.title })
      }
    } else if (value.dynamic_column_01 === 'walletPayment') {
      list.push(base)
    }
    // روش آفلاین (کارت‌به‌کارت) عمداً نیست: توی نمونه هم مسیر کاملی برای ثبتش وجود نداره
  }
  paymentProcedure.value = list
}

async function loadWalletBalance() {
  const response = await apiFetch('/wallets/getBalance')
  walletInfo.value = (response.Wallets || []).find((w) => w.currency_id === props.invoice.currency_id) || null
}

onMounted(async () => {
  try {
    await loadPaymentProcedure()
    if (paymentProcedure.value.some((o) => o.pp_d1 === 'walletPayment')) {
      await loadWalletBalance()
    }
    paymentOption.value = visibleOptions.value[0] || null
    if (!visibleOptions.value.length) {
      toast.error('هیچ متد پرداختی تعریف نشده')
    }
  } catch (error) {
    toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
  } finally {
    loading.value = false
  }
})

async function goPayment() {
  if (!paymentOption.value) {
    toast.error('روش پرداخت را انتخاب کنید')
    return
  }

  paying.value = true
  try {
    const response = await apiFetch('/invoices/updateToNextStatus', {
      platform: 'Web',
      browser: '',
      invoiceId: props.invoice.id,
      selectedPaymentProcedure: paymentOption.value.pp_id,
      selectedGateway: paymentOption.value.gateway_id,
      noDelivery: true,
      selectedAddress: null,
      // فاکتور بدون کالای فیزیکی: همون مقادیر پیش‌فرضی که نمونه می‌فرسته
      description: ''
    })

    if (response.code !== 2000) {
      if (response.error === 'user_not_active') {
        toast.error('برای پرداخت، ابتدا باید اطلاعات هویتی حساب (نام، کد ملی، تاریخ تولد) تکمیل شود.')
      } else {
        toast.error(t('error') + ': ' + t(response.error || response.msg || 'error'))
      }
      paying.value = false
      return
    }

    const gatewayTitle = response.GatewayTitle
    const paymentUrl =
      response.GatewayResult?.payment_url || response.GatewayResult?.data?.payment_url || response.GatewayResult?.url
    if (['jibit', 'zibal', 'zarinpal', 'saman', 'free', 'wallet'].includes(gatewayTitle)) {
      if (paymentUrl) {
        // رفتن به درگاه (یا صفحه‌ی نتیجه برای کیف پول)؛ paying عمداً true می‌مونه تا دکمه دوباره کلیک نشه
        window.location.replace(paymentUrl)
        return
      }
      toast.error(t('payment_url_not_found'))
    } else {
      toast.error(t('gateway_not_supported'))
    }
  } catch (error) {
    toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
  }
  paying.value = false
}
</script>

<template>
  <div class="glass-card rounded-3xl p-5 sm:p-8 space-y-5" dir="rtl">
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
        <CreditCard class="w-5 h-5" />
      </div>
      <div>
        <h3 class="font-bold text-white">پرداخت فاکتور</h3>
        <p class="text-xs text-gray-400">روش پرداخت را انتخاب کنید.</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <Loader2 class="w-6 h-6 text-purple-400 animate-spin" />
    </div>

    <div v-else-if="!visibleOptions.length" class="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-sm text-gray-400">
      هیچ روش پرداختی تعریف نشده است.
    </div>

    <template v-else>
      <div class="space-y-3">
        <label
          v-for="option in visibleOptions"
          :key="option.pp_id + '-' + option.gateway_id"
          class="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors"
          :class="option === paymentOption ? 'border-purple-400/60 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'"
        >
          <input v-model="paymentOption" type="radio" :value="option" class="mt-1 accent-purple-500">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
            <Wallet v-if="option.pp_d1 === 'walletPayment'" class="w-5 h-5" />
            <CreditCard v-else class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-bold text-white">{{ option.pp_title }}</div>
            <p v-if="option.pp_d1 === 'onlinePayment'" class="mt-1 text-sm text-gray-400">
              درگاه پرداخت:
              <span class="font-bold text-gray-200">{{ gatewayLabel(option.gateway_title) }}</span>
            </p>
            <p v-if="option.pp_d1 === 'walletPayment'" class="mt-1 text-sm text-gray-400">
              موجودی کیف پول:
              <span class="font-bold text-gray-200">{{ numberWithSeparator(walletInfo.balance) }} {{ walletInfo.currency_name }}</span>
            </p>
          </div>
        </label>
      </div>

      <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
        <span class="text-gray-400">مبلغ قابل پرداخت</span>
        <strong class="text-white">{{ numberWithSeparator(payableAmount) }} {{ t(invoice.currency_symbol) }}</strong>
      </div>

      <div v-if="walletInsufficient" class="flex flex-col gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200 sm:flex-row sm:items-center sm:justify-between">
        <span class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          موجودی کیف پول کافی نیست؛ یک درگاه آنلاین انتخاب کنید یا موجودی را افزایش دهید.
        </span>
        <NuxtLink to="/dashboard/finance/topup" class="shrink-0 rounded-lg border border-yellow-500/40 px-3 py-1.5 text-center text-xs font-medium hover:bg-yellow-500/10">
          افزایش موجودی
        </NuxtLink>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          :disabled="paying || !paymentOption || walletInsufficient"
          class="flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          @click="goPayment"
        >
          <Loader2 v-if="paying" class="h-4 w-4 animate-spin" />
          تایید و پرداخت
        </button>
      </div>
    </template>
  </div>
</template>