import { truncateDomainPrice } from '~/utils/domainPrice'

// قیمت تمدید یک پسوند دامنه رو برمی‌گردونه.
// منطق: ۱) از products/indexLite (دسته‌ی «پسوند دامنه») آیدیِ محصولِ متناظر با پسوند رو پیدا می‌کنیم،
//        ۲) با products/show جزئیات کامل محصول (شامل تاریخچه‌ی قیمت‌ها) رو می‌گیریم،
//        ۳) آخرین ردیفِ معتبر (currency_id = 1 و uncertain_price = 0، جدیدترین created_at) رو، دقیقاً همون‌طور
//           که ثبت شده (بدون تبدیل ارز/محاسبه‌ی اضافه)، به‌عنوان قیمت فعلی برمی‌گردونیم.

// قیمتِ معتبر یک محصول دامنه رو برمی‌گردونه:
// فقط ردیفی که currency_id = 1 و uncertain_price = 0 داره، و اگه چندتا بود جدیدترینش.
// هم product_last_prices (توی indexLite) و هم product_prices (توی show) رو چک می‌کنه
// و چه آرایه باشن چه آبجکت تکی، درست کار می‌کنه. اگه قیمتی پیدا نشه null برمی‌گردونه.
// نکته: اگه ردیف قیمت اصلاً فیلد currency_id نداشته باشه (چون خود درخواست currency_id: 1 داره)
// رد نمی‌شه؛ فقط ردیفی که ارز دیگه‌ای داره حذف می‌شه.
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : [])

let debugLogCount = 0

export function pickDomainPrice(product) {
  const candidates = [
    ...toArray(product?.product_last_prices),
    ...toArray(product?.product_prices)
  ]

  const valid = candidates.filter((p) => {
    if (!p || p.price === null || p.price === undefined) return false
    const uncertain = p.uncertain_price ?? p.uncertan_price ?? 0
    const currencyOk = p.currency_id === null || p.currency_id === undefined || Number(p.currency_id) === 1
    return currencyOk && Number(uncertain) === 0
  })

  if (!valid.length) {
    // فقط برای عیب‌یابی: چند بار اول نشون بده چی از API اومده
    if (debugLogCount < 3) {
      debugLogCount++
      console.warn('[pickDomainPrice] قیمت معتبری پیدا نشد. محصول:', {
        id: product?.id,
        title_fa: product?.title_fa,
        keys: Object.keys(product || {}),
        product_last_prices: product?.product_last_prices,
        product_prices: product?.product_prices
      })
    }
    return null
  }

  const time = (p) => Date.parse(p.created_at) || 0
  return [...valid].sort((a, b) => time(b) - time(a) || Number(b.id || 0) - Number(a.id || 0))[0]
}

const DOMAIN_CATEGORY_ID = '1' // دسته‌ی "پسوند دامنه" در پنل دنیاوب

export function useDomainRenewalPrice() {
  const config = useRuntimeConfig()
  const apiHeaders = useApiHeaders()

  async function findProductIdByExt(ext) {
    const normalizedExt = String(ext || '').trim().toLowerCase()
    if (!normalizedExt) return null

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
        withAttrib: false,
        currency_id: 1
      }
    })

    if (Number(response?.code) !== 2000) return null

    const match = (response.Products || []).find(
      (p) => String(p.title_fa || '').trim().toLowerCase() === normalizedExt
    )
    return match?.id ?? null
  }

  // آخرین قیمتی که برای این محصول توی پنل ثبت شده (همون مقدار خام، با ارز خودش)
  async function getRenewalPrice(ext) {
    const productId = await findProductIdByExt(ext)
    if (!productId) return null

    const response = await $fetch(`${config.public.apiBase}/products/show`, {
      method: 'POST',
      headers: apiHeaders.value,
      body: { product_id: productId, currency_id: 1 }
    })

    if (Number(response?.code) !== 2000) return null

    const latest = pickDomainPrice(response.Product)
    if (!latest) return null

    return {
      amount: truncateDomainPrice(latest.price, ext),
      currencyName: latest.currency_name || '',
      currencySymbol: latest.currency_symbol || ''
    }
  }

  return { getRenewalPrice }
}