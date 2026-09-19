<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { X, Eye, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  additional: {
    type: String,
    required: false,
    default: ''
  }
})

// no vue-i18n in this project — local Persian dictionary instead.
// Unknown/dynamic keys (e.g. backend status_text, kind_text, currency_symbol
// values) fall back to showing the raw value as-is.
const translations = {
  purchase_records: 'سوابق خرید',
  error: 'خطا',
  status: 'وضعیت',
  date: 'تاریخ',
  presenter: 'نماینده',
  discount: 'تخفیف',
  total_price: 'مبلغ کل',
  order_code: 'کد سفارش',
  delivery_date: 'تاریخ تحویل',
  delivery_time: 'ساعت تحویل',
  delivery_address: 'آدرس تحویل',
  product_title: 'عنوان محصول',
  brand: 'برند',
  quantity: 'تعداد',
  price: 'قیمت',
  description: 'توضیحات',
  order_value: 'مبلغ سفارش',
  send_price: 'هزینه ارسال',
  close: 'بستن',
  transactions: 'تراکنش‌ها',
  no_transactions: 'تراکنشی یافت نشد',
  select_return_items: 'انتخاب اقلام مرجوعی',
  return_reason: 'دلیل مرجوعی',
  submit: 'ثبت',
  code: 'کد',
  kind: 'نوع',
  amount: 'مبلغ',
  tracking_code: 'کد پیگیری',
  gateway: 'درگاه',
  payment_url_not_found: 'آدرس پرداخت یافت نشد',
  gateway_not_supported: 'این درگاه پشتیبانی نمی‌شود',
  status_change_saved: 'تغییر وضعیت ذخیره شد',
  toman: 'تومان',
  rial: 'ریال',
  awaiting_payment: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  completed: 'تکمیل شده',
  canceled: 'لغو شده',
  returned: 'مرجوع شده',
  cash: 'نقدی',
  pre_invoice: 'پیش‌فاکتور',
  installment: 'قسطی',
  pending: 'در حال بررسی'
}
function t(key) {
  return translations[key] ?? key
}

const toast = useToast()

// local replacement for $numberWithSeparator (no plugin dependency needed)
function numberWithSeparator(value) {
  const number = Number(value ?? 0)
  if (Number.isNaN(number)) return value
  return number.toLocaleString('en-US')
}

// local replacement for useNuxtApp().$objectIsEmpty (no such plugin exists here)
function objectIsEmpty(obj) {
  return !obj || (Array.isArray(obj) ? obj.length === 0 : Object.keys(obj).length === 0)
}

const config = useRuntimeConfig()
const headers = useApiHeaders()

function apiFetch(endpoint, body) {
  return $fetch(config.public.apiBase + endpoint, {
    method: 'POST',
    headers: headers.value,
    body,
  })
}

// ===== جایگزین usePersianDate: مبدل میلادی به جلالی، بدون نیاز به پکیج جانبی =====
function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let jy
  const gy2 = gm > 2 ? gy + 1 : gy
  let days = 355666 + 365 * gy2 + Math.floor((gy2 + 8) / 4) - Math.floor((gy2 + 100) / 100) + Math.floor((gy2 + 400) / 400) + gd + g_d_m[gm - 1]
  jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let jm, jd
  if (days < 186) {
    jm = 1 + Math.floor(days / 31)
    jd = 1 + (days % 31)
  } else {
    jm = 7 + Math.floor((days - 186) / 30)
    jd = 1 + ((days - 186) % 30)
  }
  return [jy, jm, jd]
}
function pad2(n) {
  return String(n).padStart(2, '0')
}
function toPersianDigits(value) {
  const map = { 0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹' }
  return String(value).replace(/[0-9]/g, (d) => map[d])
}
// offsetMinutes: برای مواردی که قبلاً با addHour(3).addMinute(30) به وقت ایران تبدیل می‌شدن (۲۱۰ دقیقه)
function formatJalali(input, { withTime = false, offsetMinutes = 0 } = {}) {
  if (!input) return '---'
  const d = new Date(String(input).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(input)
  if (offsetMinutes) d.setMinutes(d.getMinutes() + offsetMinutes)
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  let out = `${jy}/${pad2(jm)}/${pad2(jd)}`
  if (withTime) out += ` ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  return toPersianDigits(out)
}

const language = ref('fa')
const Invoices = ref([])
const Invoice = ref({})
const Transactions = ref([])
const dialog = ref(false)
const dialogAcc = ref(false)
const successBtnText = ref('')
const successBtnLink = ref('')
const successBtnParameter = ref(false)
const btnLoadingPayment = ref(false)
const dialogTransactions = ref(false)
const dialogReturnedGoods = ref(false)
const dialogChangeStatus = ref(false)
const returnData = ref([])
const returnReasons = ref([])
const loadingList = ref(false)
const loadingInvoice = ref(false)

const statusByTab = {
  stores: [2, 3, 4, 5, 8],
  invoices: [6],
  returned_invoices: [9, 10, 11, 12],
  canceled_invoices: [7]
}

const getPurchasesList = (status = statusByTab[tab.value] || statusByTab.stores) => {
  Invoices.value = []
  loadingList.value = true
  apiFetch('/invoices/indexByUser', { conditions: { status } })
    .then((response) => {
      if (response.code === 2000) {
        const items = response.Invoices || response.invoices || response.data || []
        Invoices.value = Array.isArray(items) ? items : []
      }
    })
    .catch((error) => {
      toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
    })
    .finally(() => {
      loadingList.value = false
    })
}

const showInvoice = (item) => {
  loadingInvoice.value = true
  apiFetch('/invoices/show', { invoice_id: item.id })
    .then((response) => {
      if (response.code === 2000) {
        Invoice.value = response.Invoice || response.data?.Invoice || {}
        Transactions.value = response.Transactions || response.data?.Transactions || []
        dialog.value = true
      }
    })
    .catch((error) => {
      toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
    })
    .finally(() => {
      loadingInvoice.value = false
    })
}

// کلاس بج وضعیت هماهنگ با DashboardStatusBadge.vue (پس‌زمینه‌ی کم‌رنگ + رنگ متن + بوردر، تم تیره)
const getStatusBadgeClass = (status) => {
  const normalized = String(status ?? '').toLowerCase()

  if ([0, 7].includes(Number(status)) || normalized.includes('cancel') || normalized.includes('reject') || normalized.includes('failed')) {
    return 'bg-red-500/10 text-red-400 border-red-500/30'
  }
  if ([1].includes(Number(status)) || normalized.includes('pending') || normalized.includes('await') || normalized.includes('review')) {
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
  }
  if ([2].includes(Number(status)) || normalized.includes('payment') || normalized.includes('pay')) {
    return 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  }
  if ([3].includes(Number(status)) || normalized.includes('process')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  }
  if ([6].includes(Number(status)) || normalized.includes('complete') || normalized.includes('paid')) {
    return 'bg-green-500/10 text-green-400 border-green-500/30'
  }
  if ([9].includes(Number(status)) || normalized.includes('return')) {
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  }
  if ([10].includes(Number(status))) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  }
  if ([11].includes(Number(status))) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  }
  if ([12].includes(Number(status))) {
    return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
  }
  return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
}

const getStatusText = (item) => {
  const raw = item?.status_text || item?.statusLabel || item?.status_label || ''
  if (!raw) return t('pending')
  return t(raw) ?? raw
}

const getTypeText = (item) => {
  const raw = item?.type_text || item?.typeLabel || item?.type_label || item?.kind_text || ''
  if (!raw) return t('cash')
  return t(raw) ?? raw
}

const getInvoicePrimaryDate = (item) => {
  return formatJalali(item?.document_date || item?.created_at || item?.updated_at)
}

const getInvoiceCode = (item) => {
  return item?.invoice_number || item?.tracking_code || item?.id || '---'
}

const goPayment = (item) => {
  if (item.presenter_id) {
    toast.warning('جهت پرداخت قسط، لطفاً با نماینده خود هماهنگ فرمایید.')
    return
  }

  btnLoadingPayment.value = true
  apiFetch('/wallets/paymentInstallment', {
    selectedPaymentProcedure: 170,
    selectedGateway: 1,
    transactions_id: item.wallet_transactions_id
  })
    .then((response) => {
      const gatewayTitle = response.GatewayTitle
      const paymentUrl =
        response.GatewayResult?.payment_url || response.GatewayResult?.data?.payment_url || response.GatewayResult?.url
      if (['jibit', 'zibal', 'zarinpal', 'saman', 'free', 'wallet'].includes(gatewayTitle)) {
        if (paymentUrl) {
          window.location.replace(paymentUrl)
        } else {
          toast.error(t('payment_url_not_found'))
        }
      } else {
        toast.error(t('gateway_not_supported'))
      }
    })
    .catch((error) => {
      toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
    })
    .finally(() => {
      btnLoadingPayment.value = false
    })
}

onMounted(() => {
  if (props.additional !== '' && props.additional) {
    const obj = JSON.parse(props.additional)
    successBtnText.value = 'successBtnText' in obj && obj.successBtnText !== '' ? obj.successBtnText : successBtnText.value
    successBtnLink.value = 'successBtnLink' in obj && obj.successBtnLink !== '' ? obj.successBtnLink : successBtnLink.value
    successBtnParameter.value = 'successBtnParameter' in obj && obj.successBtnParameter === 'true'
  }
  loadReturnItems()
  getPurchasesList([2, 3, 4, 5, 8])
})

function openDialogReturnedGoods() {
  returnData.value = Invoice.value.invoice_details.map((item) => ({
    product_id: item.products.id,
    product: item.products,
    amount: item.amount,
    return: 0,
    return_amount: item.return_amount,
    max_return_amount: item.amount - item.return_amount,
    id: item.id,
    return_reason: '',
    return_description: '',
    price_kind: item.price_kind,
    invoice_id: Invoice.value.id
  }))
  dialogReturnedGoods.value = true
}

const submitReturnLoading = ref(false)

async function submitReturnItems() {
  if (submitReturnLoading.value) return

  const items = Invoice.value.invoice_details || []
  if (!items.length) return
  if (!returnData.value || !Array.isArray(returnData.value)) return
  if (!Invoice.value || !Invoice.value.id) return

  const returnItem = returnData.value.filter((item) => Number(item.return) > 0)

  for (const item of returnItem) {
    if (!item.return_reason || !item.return_description) {
      toast.error('لطفا دلیل و توضیحات مرجوعی را وارد کنید')
      return
    }
  }

  if (returnItem.length === 0) return

  const return_detail = returnItem.map((item) => ({
    product_id: item.product.id,
    amount: item.amount,
    invoice_detail_id: item.id,
    return_reason: item.return_reason,
    description: item.return_description
  }))

  const payload = {
    invoice_id: Invoice.value.id,
    return_detail
  }

  submitReturnLoading.value = true

  apiFetch('/invoices/saveReturn', payload)
    .then((response) => {
      if (response.code === 2000) {
        toast.success('ثبت شد')
        dialogReturnedGoods.value = false
        getPurchasesList()
      } else {
        toast.error(t(response.error))
      }
    })
    .catch(() => {
      toast.error('خطا در ثبت درخواست مرجوعی')
    })
    .finally(() => {
      submitReturnLoading.value = false
    })
}

function loadReturnItems() {
  apiFetch('/dynamicKinds/showByType', { type: 'Return' }).then((response) => {
    returnReasons.value = response.DynamicKinds
  })
}

const convertToEnglishNumbers = (input) => {
  const persianToEnglish = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' }
  if (input) {
    return input.replace(/[۰-۹]/g, (match) => persianToEnglish[match])
  }
}

const formatInput = (item) => {
  item.return = String(item.return)
  item.return = convertToEnglishNumbers(item.return)
  if (item.return.length > 1 && item.return.startsWith('0')) {
    item.return = item.return.replace(/^0/, '')
  }
  return Math.min(parseInt(item.return), parseInt(item.max_return_amount))
}

const tab = ref('stores')

function openDialogChangeStatus() {
  dialogChangeStatus.value = true
}

function updateStatus(id, status) {
  apiFetch('/invoices/updateStatus', {
    invoice_id: id,
    newStatus: status,
    description: 'درخواست لغو مرجوعی از سمت کاربر'
  }).then((response) => {
    if (response.code === 2000) {
      toast.success(t('status_change_saved'))
      dialogChangeStatus.value = false
    } else {
      toast.error('خطا در تغییر وضعیت')
    }
  })
}

watch(tab, (newTab) => {
  getPurchasesList(statusByTab[newTab] || statusByTab.stores)
})

const isAllReturned = computed(() => {
  return returnData.value.every((item) => item.return_amount === item.amount)
})

const isReturnedTab = computed(() => tab.value === 'returned_invoices')

const summaryStats = computed(() => {
  const list = Invoices.value || []
  const total = list.length
  const completed = list.filter((item) => [6, 11].includes(item.status)).length
  const pending = list.filter((item) => [2, 3, 4, 5, 8].includes(item.status)).length
  const special = tab.value === 'returned_invoices'
    ? list.filter((item) => [9, 10, 11, 12].includes(item.status)).length
    : list.filter((item) => item.status === 7).length

  return [
    { label: tab.value === 'stores' ? 'کل سفارش‌ها' : tab.value === 'invoices' ? 'کل فاکتورها' : tab.value === 'returned_invoices' ? 'کل مرجوعی‌ها' : 'کل لغوشده‌ها', value: total, tone: 'from-purple-500 to-blue-600' },
    { label: 'تکمیل‌شده', value: completed, tone: 'from-emerald-500 to-teal-600' },
    { label: 'درحال بررسی', value: pending, tone: 'from-amber-500 to-orange-600' },
    { label: tab.value === 'returned_invoices' ? 'مرجوعی' : 'لغو', value: special, tone: 'from-rose-500 to-pink-600' }
  ]
})

const tabsConfig = [
  { value: 'stores', label: 'سفارشات', heading: 'سفارشات من' },
  { value: 'invoices', label: 'فاکتورها', heading: 'فاکتورهای من' },
  { value: 'returned_invoices', label: 'فاکتورهای مرجوعی', heading: 'فاکتورهای مرجوعی من' },
  { value: 'canceled_invoices', label: 'فاکتورهای لغوشده', heading: 'فاکتورهای لغوشده من' }
]
const activeTabConfig = computed(() => tabsConfig.find((c) => c.value === tab.value))
</script>

<template>
  <div class="glass-card rounded-[28px] overflow-hidden" dir="rtl">
    <!-- header -->
    <div class="relative overflow-hidden border-b border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/70 to-purple-950/80 px-4 py-5 sm:px-6 sm:py-6">
      <div class="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-blue-500/10" />
      <div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold text-purple-200">
            <span class="h-2 w-2 rounded-full bg-purple-400" />
            {{ activeTabConfig?.heading }}
          </div>
          <div>
            <h3 class="text-xl font-bold text-white">{{ t('purchase_records') }}</h3>
            <p class="mt-1 text-sm text-slate-400">مشاهده وضعیت سفارش‌ها، فاکتورها و درخواست‌های مرجوعی در یکجا</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div v-for="item in summaryStats" :key="item.label" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <div class="text-[11px] text-slate-400">{{ item.label }}</div>
            <div class="mt-1 text-lg font-bold text-white">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- tabs -->
    <div class="border-b border-white/10 bg-slate-950/20 px-3 py-3 sm:px-6">
      <div class="flex items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1.5 sm:justify-center">
        <button
          v-for="item in tabsConfig"
          :key="item.value"
          type="button"
          class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all"
          :class="tab === item.value
            ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'"
          @click="tab = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- tab panel -->
    <div class="p-4 sm:p-6">
      <div class="mb-4 flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-3 py-2.5 text-sm font-semibold text-purple-200">
        <span class="h-2.5 w-2.5 rounded-full bg-purple-400" />
        {{ activeTabConfig?.heading }}
      </div>

      <!-- mobile cards -->
      <div class="max-h-105 overflow-y-auto scrollbar-thin pb-2 sm:hidden">
        <div v-if="loadingList" class="flex justify-center py-8">
          <Loader2 class="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <template v-else>
          <div v-for="c in Invoices" :key="c.id" class="mb-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-lg shadow-black/20">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'شماره سفارش مرجوعی' : 'شماره سفارش' }}</span>
              <span class="text-sm text-gray-200">{{ c.id }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'شماره فاکتور مرجوعی' : 'شماره فاکتور' }}</span>
              <span class="text-sm text-gray-200">{{ getInvoiceCode(c) }}</span>
            </div>
            <div v-if="isReturnedTab" class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">شماره فاکتور مرجع</span>
              <span class="text-sm text-gray-200">{{ c.return_from_invoice_id ?? '---' }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ t('status') }}</span>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(c.status)">{{ getStatusText(c) }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">نوع پرداخت</span>
              <span class="text-sm text-gray-200">{{ getTypeText(c) }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'تاریخ درخواست مرجوعی' : t('date') }}</span>
              <span class="text-sm text-gray-200">{{ getInvoicePrimaryDate(c) }}</span>
            </div>
            <div v-if="!isReturnedTab" class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ t('presenter') }}</span>
              <span class="text-sm text-gray-200">{{ c.presenter_full_name || c.user_full_name || '---' }}</span>
            </div>
            <div v-if="!isReturnedTab" class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ t('discount') }}</span>
              <span class="text-sm text-gray-200">
                {{ (c.discount_price + c.other_price) !== 0 ? numberWithSeparator(c.discount_price + c.other_price) + ' ' + (c.currency_name || 'تومان') : '---' }}
              </span>
            </div>
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'مبلغ کل قابل استرداد' : t('total_price') }}</span>
              <span class="text-sm font-semibold text-white">{{ numberWithSeparator(c.total_price) }} {{ c.currency_name || 'تومان' }}</span>
            </div>
            <button
              type="button"
              :disabled="loadingInvoice"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              @click="showInvoice(c)"
            >
              <Loader2 v-if="loadingInvoice" class="h-4 w-4 animate-spin" />
              جزئیات
            </button>
          </div>
          <div v-if="!loadingList && Invoices.length === 0" class="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-sm text-gray-400">
            موردی برای نمایش وجود ندارد
          </div>
        </template>
      </div>

      <!-- desktop table -->
      <div class="hidden sm:block">
        <div v-if="loadingList" class="space-y-2">
          <div v-for="n in 6" :key="n" class="h-10 w-full animate-pulse rounded-lg bg-white/5" />
        </div>
        <div v-else-if="Invoices.length > 0" class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/30">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/10 text-gray-400 text-right">
                <th class="whitespace-nowrap px-4 py-3 font-medium">{{ isReturnedTab ? 'شماره سفارش مرجوعی' : 'شماره سفارش' }}</th>
                <th class="whitespace-nowrap px-4 py-3 font-medium">{{ isReturnedTab ? 'شماره فاکتور مرجوعی' : 'شماره فاکتور' }}</th>
                <th v-if="isReturnedTab" class="whitespace-nowrap px-4 py-3 font-medium">شماره فاکتور مرجع</th>
                <th class="px-4 py-3 font-medium">{{ t('status') }}</th>
                <th class="px-4 py-3 font-medium">نوع پرداخت</th>
                <th class="px-4 py-3 font-medium">{{ isReturnedTab ? 'تاریخ درخواست مرجوعی' : t('date') }}</th>
                <th v-if="!isReturnedTab" class="px-4 py-3 font-medium">{{ t('presenter') }}</th>
                <th v-if="!isReturnedTab" class="px-4 py-3 font-medium">{{ t('discount') }}</th>
                <th class="px-4 py-3 font-medium">{{ isReturnedTab ? 'مبلغ قابل استرداد' : t('total_price') }}</th>
                <th class="w-8 px-4 py-3 font-medium">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in Invoices" :key="i" class="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td class="px-4 py-3 text-gray-200">{{ item.id }}</td>
                <td class="px-4 py-3 text-gray-300">{{ getInvoiceCode(item) }}</td>
                <td v-if="isReturnedTab" class="px-4 py-3 text-gray-300">{{ item.return_from_invoice_id ?? '----' }}</td>
                <td class="whitespace-nowrap px-4 py-3">
                  <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(item.status)">{{ getStatusText(item) }}</span>
                </td>
                <td class="px-4 py-3 text-gray-300">{{ getTypeText(item) }}</td>
                <td class="px-4 py-3 text-gray-400">{{ getInvoicePrimaryDate(item) }}</td>
                <td v-if="!isReturnedTab" class="whitespace-nowrap px-4 py-3 text-gray-300">{{ item.presenter_full_name || item.user_full_name || '----' }}</td>
                <td v-if="!isReturnedTab" class="px-4 py-3 text-gray-300">{{ numberWithSeparator(item.discount_price + item.other_price) }}</td>
                <td class="px-4 py-3 text-gray-200 font-medium">{{ numberWithSeparator(item.total_price) }} {{ item.currency_name || 'تومان' }}</td>
                <td class="px-4 py-3">
                  <button type="button" class="inline-flex items-center gap-1.5 text-purple-300 hover:text-purple-200 transition-colors" @click="showInvoice(item)">
                    <Eye class="w-4 h-4" />
                    مشاهده
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-sm text-gray-400">
          موردی برای نمایش وجود ندارد
        </div>
      </div>
    </div>

    <!-- ================= DIALOG: transactions list for an installment (dialogAcc) ================= -->
    <Transition name="garnet-fade">
      <div v-if="dialogAcc" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl glass-strong border border-white/10 shadow-2xl">
          <div class="flex items-center justify-between px-6 pt-4">
            <h3 class="text-base font-bold text-purple-300">لیست تراکنش‌ها</h3>
            <button type="button" class="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10" @click="dialogAcc = false">
              {{ t('close') }}
            </button>
          </div>
          <div class="overflow-auto p-6">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10 text-gray-400 text-right">
                  <th class="px-4 py-3 font-medium">شناسه تراکنش</th>
                  <th class="px-4 py-3 font-medium">نوع تراکنش</th>
                  <th class="px-4 py-3 font-medium">تاریخ سررسید</th>
                  <th class="px-4 py-3 font-medium">مبلغ</th>
                  <th class="px-4 py-3 font-medium">وضعیت</th>
                  <th class="px-4 py-3 font-medium text-center">پرداخت</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in Transactions" :key="item.id" class="border-b border-white/5 last:border-0">
                  <td class="px-4 py-3 text-gray-300">{{ item.wallet_transactions_id }}</td>
                  <td class="px-4 py-3 text-gray-300">{{ t(item.kind_text) }}</td>
                  <td class="px-4 py-3 text-gray-400">{{ formatJalali(item.document_date) }}</td>
                  <td class="px-4 py-3 text-gray-200">{{ numberWithSeparator(parseInt(item.amount)) }} {{ item.currency_name }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(item.status)">{{ t(item.status_text) }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      v-if="item.kind === 8 && (item.status === 1 || item.status === 3)"
                      type="button"
                      :disabled="btnLoadingPayment"
                      class="rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 disabled:opacity-60"
                      @click="goPayment(item)"
                    >
                      پرداخت
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= DIALOG: invoice details ================= -->
    <Transition name="garnet-fade">
      <div v-if="dialog" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
        <div class="flex h-full w-full flex-col overflow-hidden glass-strong border border-white/10 shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-4xl sm:rounded-2xl">
          <div class="flex justify-end px-2 pt-2">
            <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" @click="dialog = false">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="overflow-y-auto scrollbar-thin px-4 py-0 sm:px-8 text-gray-300">
            <div class="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <div class="flex justify-between px-1 sm:block">
                {{ Invoice.status_text?.includes('return') ? 'شماره سفارش مرجوعی' : t('order_code') }} :
                <strong class="text-white">{{ Invoice.id }}</strong>
              </div>
              <div class="flex justify-between px-1 sm:block">
                {{ Invoice.status_text?.includes('return') ? 'شماره فاکتور مرجوعی' : 'شماره فاکتور' }} :
                <strong class="text-white">{{ Invoice.invoice_number }}</strong>
              </div>
              <div v-if="Invoice.status_text?.includes('return')" class="flex justify-between px-1 sm:block">
                شماره فاکتور مرجع :
                <strong class="text-white">{{ Invoice.return_from_invoice_id }}</strong>
              </div>
              <div class="flex justify-between px-1 sm:block">
                {{ t('status') }} :
                <strong class="text-white">{{ t(Invoice.status_text) }}</strong>
              </div>
              <div class="flex justify-between px-1 sm:block">
                {{ Invoice.status_text?.includes('return') ? 'تاریخ درخواست مرجوعی' : t('date') }} :
                <strong class="text-white">{{ formatJalali(Invoice.document_date) }}</strong>
              </div>
              <div v-if="Invoice.send_date" class="flex justify-between px-1 sm:block">
                {{ t('delivery_date') }} :
                <strong class="text-white">{{ formatJalali(Invoice.send_date) }}</strong>
              </div>
              <div v-if="Invoice.send_date" class="flex justify-between px-1 sm:block">
                {{ t('delivery_time') }}:
                <strong class="text-white">{{ Invoice.send_time }}</strong>
              </div>
              <div v-if="Invoice.receiver_address" class="px-1 sm:col-span-2">
                {{ t('delivery_address') }}:
                <strong class="leading-relaxed text-white">{{ Invoice.receiver_address }}</strong>
              </div>
            </div>

            <div v-if="Invoice.status === 9 || Invoice.status === 10" class="mt-4">
              <div class="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3 text-sm text-blue-300">
                برای درخواست مرجوعی، پس از ارسال، درخواست شما بررسی می‌شود و در صورتی که تایید شود، فرآیند ثبت و تایید
                مرجوعی انجام خواهد شد.
              </div>
            </div>

            <div v-if="Invoice.invoice_details?.length" class="my-4 overflow-x-auto rounded-xl border border-white/10">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-white/10 text-gray-400">
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('product_title') }}</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('brand') }}</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ Invoice.status_text?.includes('return') ? 'تعداد مرجوعی' : t('quantity') }}</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('price') }}</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ t('discount') }}</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">{{ Invoice.status_text?.includes('return') ? 'مبلغ قابل استرداد' : t('total_price') }}</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">نوع پرداخت</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">تعداد اقساط</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">مبلغ هر قسط</th>
                    <th class="whitespace-nowrap px-2 py-2.5 text-center font-medium">مبلغ پیش‌پرداخت</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(item, i) in Invoice.invoice_details" :key="i">
                    <tr class="border-b border-white/5">
                      <td class="whitespace-nowrap px-2 py-2.5 text-center">
                        {{ item.price_kind === 0 ? 'خرید' : item.price_kind === 1 ? 'تمدید' : 'تجدید' }}
                        {{ item.products.type_code === 1 ? 'محصول' : item.products.type_code === 2 ? 'خدمات' : item.products.type_code === 3 ? 'کارت' : 'دوره' }}
                        {{ item.products['title_' + language] }}
                      </td>
                      <td class="whitespace-nowrap px-2 py-2.5 text-center">{{ item.products['brand_' + language] }}</td>
                      <td class="px-2 py-2.5 text-center">{{ item.amount }}</td>
                      <td class="px-2 py-2.5 text-center">{{ numberWithSeparator(item.unit_price) }}</td>
                      <td class="px-2 py-2.5 text-center">{{ numberWithSeparator(item.discount_price) }}</td>
                      <td class="px-2 py-2.5 text-center">{{ numberWithSeparator(item.total_price) }}</td>
                      <td class="px-2 py-2.5 text-center">{{ item.product_installment_plan_id ? 'قسطی' : 'نقدی' }}</td>
                      <td class="px-2 py-2.5 text-center">{{ item.product_installment_plan_id ? item.installment_count : '---' }}</td>
                      <td class="px-2 py-2.5 text-center">{{ item.product_installment_plan_id ? numberWithSeparator(item.installment_amount) : '---' }}</td>
                      <td class="px-2 py-2.5 text-center">{{ item.product_installment_plan_id ? numberWithSeparator(item.cash_amount) : '---' }}</td>
                    </tr>
                    <tr v-if="Invoice.status_text?.includes('return') && item.description" class="border-b border-white/5 bg-purple-500/5">
                      <td colspan="12" class="px-2 py-2 text-start">
                        <span class="text-sm font-medium text-gray-500">علت مرجوعی</span>
                        <span class="mx-1">:</span>
                        <template v-if="item.return_reason_title">
                          <span class="text-sm text-gray-400">{{ item.return_reason_title }}</span>
                          <span class="mx-1">-</span>
                        </template>
                        <span class="text-sm text-gray-400">{{ item.description }}</span>
                      </td>
                    </tr>
                    <tr v-else-if="item.dynamic_column_01" class="border-b border-white/5 bg-white/5">
                      <td colspan="2" class="max-w-30 px-2 py-2 text-center">
                        <p class="text-xs text-gray-400 leading-relaxed">
                          {{ JSON.parse(item.dynamic_column_01).product_id }} -
                          {{ JSON.parse(item.dynamic_column_01).product_title }}
                        </p>
                      </td>
                      <td colspan="10" class="px-0 py-2 text-center">
                        <div class="flex items-center justify-start text-sm text-gray-400">
                          <template v-for="a in JSON.parse(item.dynamic_column_01).attibs">
                            <span class="mx-2 h-4 w-px bg-white/10" />
                            <p class="me-1 text-xs">{{ a.title }}</p> :
                            <p class="ms-1 text-xs">{{ a.reslt }}</p>
                          </template>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <div v-else class="my-4 rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              جزئیات این فاکتور در پاسخ API ثبت نشده است.
            </div>

            <div class="grid grid-cols-1 gap-4 py-3 text-sm sm:grid-cols-2">
              <div>
                <div v-if="Invoice.description" class="pb-5">
                  <div class="flex justify-between px-1">{{ t('description') }}:</div>
                  <div class="px-1"><strong class="leading-relaxed text-white">{{ Invoice.description }}</strong></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between px-1">
                  <p>{{ t('order_value') }}:</p>
                  <strong class="text-white">{{ numberWithSeparator(Invoice.impure_price) }} {{ t(Invoice.currency_symbol) }}</strong>
                </div>
                <template v-if="!Invoice.status_text?.includes('return')">
                  <div class="flex justify-between px-1">
                    <p>{{ t('send_price') }} :</p>
                    <strong class="text-white">{{ numberWithSeparator(Invoice.send_price ?? 0) }} {{ t(Invoice.currency_symbol) }}</strong>
                  </div>
                  <div class="flex justify-between px-1">
                    <p>تخفیف پایه :</p>
                    <strong class="text-white">{{ numberWithSeparator(Invoice.discount_price) }} {{ t(Invoice.currency_symbol) }}</strong>
                  </div>
                  <div class="flex justify-between px-1">
                    <p>کد تخفیف :</p>
                    <strong class="text-white">{{ numberWithSeparator(Invoice.other_price ?? 0) }} {{ t(Invoice.currency_symbol) }}</strong>
                  </div>
                </template>
                <div class="flex justify-between px-1">
                  <p>{{ Invoice.status_text?.includes('return') ? 'مبلغ کل قابل استرداد' : t('total_price') }} :</p>
                  <strong class="text-white">{{ numberWithSeparator(Invoice.total_price) }} {{ t(Invoice.currency_symbol) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-3 py-3">
            <button
              v-if="Invoice.status_text?.includes('return') && Invoice.status === 9"
              type="button"
              class="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
              @click="openDialogChangeStatus"
            >
              لغو مرجوعی
            </button>
            <button
              v-if="Invoice.status === 6 && Invoice.returnable"
              type="button"
              class="rounded-lg border border-sky-500/30 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/10"
              @click="openDialogReturnedGoods()"
            >
              ثبت مرجوعی
            </button>
            <a
              v-if="successBtnText"
              :href="successBtnLink + (successBtnParameter ? '?invoiceID=' + Invoice.id : '')"
              class="rounded-lg border border-green-500/30 px-4 py-2 text-sm font-medium text-green-300 hover:bg-green-500/10"
            >
              {{ t(successBtnText) }}
            </a>
            <button
              v-if="[3, 4, 5, 6].includes(Invoice.status)"
              type="button"
              class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
              @click="dialogAcc = true"
            >
              تراکنش‌ها
            </button>
            
            <DashboardPrintInvoice
              v-if="Invoice.status === 11 || Invoice.status === 6"
              :data="Invoice"
              rounded="lg"
              color="blue"
              kind="invoice"
            />
            <button type="button" class="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10" @click="dialog = false">
              {{ t('close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= DIALOG: transactions (dialogTransactions) ================= -->
    <Transition name="garnet-fade">
      <div v-if="dialogTransactions" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div v-if="!objectIsEmpty(Transactions)" class="flex max-h-[90dvh] w-[90%] max-w-5xl flex-col overflow-hidden rounded-2xl glass-strong border border-white/10 px-5 pb-8 pt-0 shadow-2xl">
          <div class="flex items-center justify-between px-0">
            <h3 class="py-3 text-base font-bold text-purple-300">{{ t('transactions') }}</h3>
            <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" @click="dialogTransactions = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="overflow-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10 text-gray-400 text-right">
                  <th class="px-4 py-3 font-medium">{{ t('code') }}</th>
                  <th class="px-4 py-3 font-medium">{{ t('status') }}</th>
                  <th class="px-4 py-3 font-medium">{{ t('date') }}</th>
                  <th class="px-4 py-3 font-medium">{{ t('kind') }}</th>
                  <th class="px-4 py-3 font-medium">{{ t('amount') }} ({{ t(Transactions.currency_name) }})</th>
                  <th class="px-4 py-3 font-medium">{{ t('tracking_code') }}</th>
                  <th class="px-4 py-3 font-medium">{{ t('gateway') }}</th>
                  <th class="px-4 py-3 font-medium">{{ t('description') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in Transactions" :key="index" class="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td class="px-4 py-3 text-gray-300">{{ item.wallet_transactions_id }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(item.status)">{{ t(item.status_text) }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-400" dir="ltr">{{ formatJalali(item.document_date, { withTime: true, offsetMinutes: 210 }) }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(item.kind)">{{ t(item.kind_text) }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-200 text-end" dir="ltr">{{ numberWithSeparator(item.amount) }}</td>
                  <td class="px-4 py-3 text-gray-300">{{ item.tracking_code }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2 text-gray-300">
                      <img :src="item.gateway_image" class="h-6 w-6 rounded object-cover" alt="">
                      {{ item.gateway_title }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-400">{{ item.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end pt-5">
            <button type="button" class="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10" @click="dialogTransactions = false">
              {{ t('close') }}
            </button>
          </div>
        </div>
        <div v-else class="w-full max-w-md rounded-2xl glass-strong border border-white/10 p-6 text-center shadow-2xl">
          <p class="text-sm text-gray-400">{{ t('no_transactions') }}</p>
          <button type="button" class="mt-3 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10" @click="dialogTransactions = false">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ================= DIALOG: returned goods (dialogReturnedGoods) ================= -->
    <Transition name="garnet-slide-up">
      <div v-if="dialogReturnedGoods" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
        <div class="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl glass-strong border border-white/10 p-4 shadow-2xl sm:rounded-2xl">
          <div class="flex items-center justify-between px-0">
            <h3 class="text-base font-bold text-purple-300">{{ t('select_return_items') }}</h3>
            <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" @click="dialogReturnedGoods = false">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="overflow-y-auto scrollbar-thin px-1 pt-0" style="max-height: 50dvh">
            <div v-for="item in returnData" :key="item.id" class="my-4 rounded-xl border border-white/10">
              <div class="flex">
                <div class="flex items-center justify-center px-2 py-2 md:px-4">
                  <img :src="item.product.cover_image" class="h-25 w-25 rounded-lg object-cover" alt="">
                </div>
                <div class="flex flex-1 items-start">
                  <p class="pe-2 pt-2 text-sm font-normal text-gray-200">{{ item.product.title_fa }}</p>
                </div>
              </div>

              <div class="px-4 py-0">
                <div class="mb-2 rounded-lg bg-sky-500/10 border border-sky-500/20 p-2">
                  <p v-if="item.price_kind !== 0" class="text-xs text-gray-400">این ردیف قابل برگشت نیست</p>
                  <p v-else class="text-xs text-gray-400">
                    <template v-if="item.max_return_amount === 0">
                      تمامی {{ item.amount }} عدد از این محصول مرجوع شده است.
                    </template>
                    <template v-else>
                      از مجموع {{ item.amount }} عدد، {{ item.return_amount }} عدد مرجوع شده است.
                    </template>
                  </p>
                </div>

                <template v-if="item.max_return_amount !== 0 && item.price_kind === 0">
                  <div class="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-xs text-gray-400">تعداد مرجوعی</label>
                      <input
                        v-model="item.return"
                        type="number"
                        :min="0"
                        :max="item.max_return_amount"
                        class="w-full rounded-lg input-glass px-3 py-2 text-sm text-white outline-none"
                        @keyup="item.return = formatInput(item)"
                      >
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-gray-400">{{ t('return_reason') }}</label>
                      <select v-model="item.return_reason" class="w-full rounded-lg input-glass px-3 py-2 text-sm text-white outline-none">
                        <option value="" disabled class="bg-slate-800">{{ t('return_reason') }}</option>
                        <option v-for="reason in returnReasons" :key="reason.id" :value="reason.id" class="bg-slate-800">{{ reason.title }}</option>
                      </select>
                    </div>
                  </div>
                  <div class="mb-4">
                    <textarea
                      v-model="item.return_description"
                      :placeholder="t('description')"
                      rows="3"
                      class="w-full resize-none rounded-lg input-glass px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-5">
            <button type="button" class="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10" @click="dialogReturnedGoods = false">
              {{ t('close') }}
            </button>
            <button
              type="button"
              :disabled="isAllReturned || submitReturnLoading"
              class="flex items-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              @click="submitReturnItems()"
            >
              <Loader2 v-if="submitReturnLoading" class="h-4 w-4 animate-spin" />
              {{ t('submit') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ================= DIALOG: change return status (dialogChangeStatus) ================= -->
    <Transition name="garnet-slide-up">
      <div v-if="dialogChangeStatus" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
        <div class="w-full max-w-md rounded-t-2xl glass-strong border border-white/10 p-4 shadow-2xl sm:rounded-2xl">
          <div class="flex items-center justify-between px-0">
            <h3 class="text-base font-bold text-purple-300">درخواست لغو از مرجوعی</h3>
            <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" @click="dialogChangeStatus = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <p class="px-1 py-4 text-sm text-gray-300">آیا از مرجوع کردن محصولات منصرف شده‌اید؟</p>
          <div class="flex justify-end">
            <button
              type="button"
              class="rounded-lg border border-orange-500/30 px-4 py-2 text-sm font-medium text-orange-300 hover:bg-orange-500/10"
              @click="updateStatus(Invoice.id, 12)"
            >
              تایید لغو از مرجوعی
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.garnet-fade-enter-active,
.garnet-fade-leave-active {
  transition: opacity 0.18s ease;
}
.garnet-fade-enter-from,
.garnet-fade-leave-to {
  opacity: 0;
}

.garnet-slide-up-enter-active,
.garnet-slide-up-leave-active {
  transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}
.garnet-slide-up-enter-from,
.garnet-slide-up-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>