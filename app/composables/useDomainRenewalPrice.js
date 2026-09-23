// قیمت تمدید یک پسوند دامنه رو برمی‌گردونه.
// منطق: ۱) از products/indexLite (دسته‌ی «پسوند دامنه») آیدیِ محصولِ متناظر با پسوند رو پیدا می‌کنیم،
//        ۲) با products/show جزئیات کامل محصول (شامل تاریخچه‌ی قیمت‌ها) رو می‌گیریم،
//        ۳) آخرین ردیفی که توی product_prices ثبت شده (جدیدترین created_at) رو، دقیقاً همون‌طور
//           که ثبت شده (بدون تبدیل ارز/محاسبه‌ی اضافه)، به‌عنوان قیمت فعلی برمی‌گردونیم.
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
        withAttrib: false
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
      body: { product_id: productId }
    })

    if (Number(response?.code) !== 2000) return null

    const prices = response.Product?.product_prices || []
    if (!prices.length) return null

    const latest = [...prices].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0]

    return {
      amount: Number(latest.price),
      currencyName: latest.currency_name || '',
      currencySymbol: latest.currency_symbol || ''
    }
  }

  return { getRenewalPrice }
}