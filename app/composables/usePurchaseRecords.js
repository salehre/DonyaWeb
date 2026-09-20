// هلپرهای مشترک بین لیست فاکتورها (components/Dashboard/PurchaseRecords.vue)
// و صفحه‌ی جزئیات فاکتور (pages/dashboard/purchaserecords/[id].vue)

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

// local replacement for $numberWithSeparator (no plugin dependency needed)
function numberWithSeparator(value) {
  const number = Number(value ?? 0)
  if (Number.isNaN(number)) return value
  return number.toLocaleString('en-US')
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

// کلاس بج وضعیت هماهنگ با DashboardStatusBadge.vue (پس‌زمینه‌ی کم‌رنگ + رنگ متن + بوردر، تم تیره)
function getStatusBadgeClass(status) {
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

function getStatusText(item) {
  const raw = item?.status_text || item?.statusLabel || item?.status_label || ''
  if (!raw) return t('pending')
  return t(raw) ?? raw
}

function getTypeText(item) {
  const raw = item?.type_text || item?.typeLabel || item?.type_label || item?.kind_text || ''
  if (!raw) return t('cash')
  return t(raw) ?? raw
}

function getInvoicePrimaryDate(item) {
  return formatJalali(item?.document_date || item?.created_at || item?.updated_at)
}

function getInvoiceCode(item) {
  return item?.invoice_number || item?.tracking_code || item?.id || '---'
}

export function usePurchaseRecords() {
  // این دو باید داخل setup فراخوانی بشن، برای همین داخل خود کامپوزبل هستن
  const config = useRuntimeConfig()
  const headers = useApiHeaders()

  function apiFetch(endpoint, body) {
    return $fetch(config.public.apiBase + endpoint, {
      method: 'POST',
      headers: headers.value,
      body,
    })
  }

  return {
    t,
    apiFetch,
    numberWithSeparator,
    formatJalali,
    getStatusBadgeClass,
    getStatusText,
    getTypeText,
    getInvoicePrimaryDate,
    getInvoiceCode
  }
}