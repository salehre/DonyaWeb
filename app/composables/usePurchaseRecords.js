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
  awaiting_approval:' در انتظار تایید',
  close: 'بستن',
  transactions: 'تراکنش‌ها',
  no_transactions: 'تراکنشی یافت نشد',
  select_return_items: 'انتخاب اقلام مرجوعی',
  return_reason: 'دلیل مرجوعی',
  submit: 'ثبت',
  code: 'کد',
  kind: 'نوع',
  deposit: 'واریز',
  purchase: 'خرید',
  refund: 'بازگشت وجه',
  confirmed: 'تایید شده',
  rejected: 'رد شده',
  failed: 'ناموفق',
  amount: 'مبلغ',
  tracking_code: 'کد پیگیری',
  tax: 'عوارض و مالیات',
  gateway: 'درگاه',
  payment_url_not_found: 'آدرس پرداخت یافت نشد',
  gateway_not_supported: 'این درگاه پشتیبانی نمی‌شود',
  status_change_saved: 'تغییر وضعیت ذخیره شد',
  toman: 'تومان',
  rial: 'ریال',
  awaiting_payment: 'در انتظار پرداخت',
  processing: 'در حال پردازش',
  paid: 'پرداخت شده',
  completed: 'تکمیل شده',
  canceled: 'لغو شده',
  cancel: 'لغو شده',
  returned: 'مرجوع شده',
  IRT: 'تومان',
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

// ===== تبدیل میلادی به جلالی با Intl (بدون نیاز به پکیج جانبی) =====
// خود مرورگر تقویم جلالی رو بلده؛ قبلاً یه الگوریتم دستی اینجا بود که همه‌ی تاریخ‌ها رو غلط (حدود یک سال جلوتر) نشون می‌داد.
const jalaliFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

function toJalaliParts(date) {
  const parts = {}
  for (const p of jalaliFormatter.formatToParts(date)) parts[p.type] = p.value
  return [Number(parts.year), Number(parts.month), Number(parts.day)]
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
  const [jy, jm, jd] = toJalaliParts(d)
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
  return item?.status_text ? t(item.status_text) : '---'
}

// تاریخ ستون «تاریخ» در لیست، تاریخ ایجاد رکورد (created_at) هست
function getInvoicePrimaryDate(item) {
  return formatJalali(item?.created_at)
}

// سفارش‌هایی که هنوز فاکتور نشدن شماره فاکتور ندارن، پس شماره سفارش جایگزینش نمی‌شه
function getInvoiceCode(item) {
  return item?.invoice_number ?? '---'
}

// جایگزین usePersianDate که PrintInvoice.vue صداش می‌زنه (پکیج تاریخ جلالی توی این پروژه نیست).
// خروجی toString همیشه به‌صورت ۱۴۰۴/۰۵/۱۰ هست؛ فرمت ورودی نادیده گرفته می‌شه.
export function usePersianDate(input) {
  return {
    toString: () => formatJalali(input)
  }
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
    getInvoicePrimaryDate,
    getInvoiceCode
  }
}