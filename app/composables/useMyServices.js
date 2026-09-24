// منطق مشترک «سرویس‌های من» بین لیست (dashboard/services/index.vue) و صفحه‌ی جزئیات (dashboard/services/[id].vue).
// هر آیتمِ invoice_details یک فاکتورِ پرداخت‌شده یک سرویس حساب می‌شه.

// آیدی دسته‌ها در پنل: دامنه = ۱، هاست = ۲، VPS = ۳
const CATEGORY_TYPE = { 1: 'domain', 2: 'hosting', 3: 'vps' }

export const SERVICE_TYPE_LABEL = { hosting: 'هاست ابری', vps: 'VPS ابری', domain: 'دامنه' }
const DEFAULT_CYCLE = { hosting: 'ماهانه', vps: 'ماهانه', domain: 'سالانه' }

// سرویسی که کمتر از این تعداد روز به انقضاش مونده (یا منقضی شده) «در حال انقضا» حساب می‌شه
export const EXPIRING_DAYS = 30

function resolveStatus(expire) {
  if (!expire) return 'active'
  const date = new Date(String(expire).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return 'active'
  return date.getTime() - Date.now() <= EXPIRING_DAYS * 24 * 60 * 60 * 1000 ? 'expiring' : 'active'
}

function parseJson(value) {
  if (!value || typeof value !== 'string') return null
  try { return JSON.parse(value) } catch { return null }
}

// نوع سرویس: اول از روی دسته‌ی محصول، اگه نبود از روی عنوان
function resolveType(product) {
  const categoryId = product?.category_id ?? product?.category?.id ?? product?.categories?.[0]?.id
  if (categoryId !== undefined && CATEGORY_TYPE[categoryId]) return CATEGORY_TYPE[categoryId]

  const title = String(product?.title_fa || '').toLowerCase()
  if (/vps|سرور مجازی/.test(title)) return 'vps'
  if (/host|هاست/.test(title)) return 'hosting'
  if (/دامنه|domain/.test(title) || /^\.[a-z.]+$/.test(title)) return 'domain'
  return null
}

// شناسه‌ی سرویس = «شماره فاکتور-شماره آیتم»؛ صفحه‌ی جزئیات از روی همین می‌فهمه کدوم فاکتور رو از API بگیره
export function parseServiceId(id) {
  const [invoiceId, detailId] = String(id ?? '').split('-')
  return { invoiceId: invoiceId || null, detailId: detailId || null }
}

export function mapInvoiceDetailToService(invoice, item) {
  const type = resolveType(item.products)
  if (!type) return null

  const extra = parseJson(item.dynamic_column_01)
  const expire = item.expire_date || item.expires_at || item.end_date

  return {
    id: `${invoice.id}-${item.id}`,
    type,
    typeLabel: SERVICE_TYPE_LABEL[type],
    name: String(item.products?.title_fa || '---').replace(/<[^>]*>/g, ' ').trim(),
    identifier: item.description || extra?.product_title || item.products?.title_fa || '---',
    status: resolveStatus(expire),
    expireRaw: expire || null,
    price: item.total_price,
    cycle: DEFAULT_CYCLE[type],
    attributes: (extra?.attibs || extra?.attribs || []).map((a) => ({ title: a.title, value: a.reslt })),
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number ?? null,
    purchasedAt: invoice.created_at || null
  }
}

export function servicesFromInvoice(invoice) {
  return (invoice?.invoice_details || [])
    .map((item) => mapInvoiceDetailToService(invoice, item))
    .filter(Boolean)
}

// لیست فاکتورها → لیست سرویس‌ها. یک سرویس ممکنه توی چند فاکتور (خرید + تمدیدها) باشه؛
// فقط اولین (جدیدترین) رو نگه می‌داریم.
export function servicesFromInvoices(invoices) {
  const seen = new Set()
  return (Array.isArray(invoices) ? invoices : [])
    .flatMap(servicesFromInvoice)
    .filter((s) => {
      if (s.identifier === '---') return true
      const key = `${s.type}|${s.name}|${s.identifier}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}