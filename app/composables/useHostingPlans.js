// پلن‌های هاست رو از products/indexLite (دسته‌ی «هاست» در پنل دنیاوب) می‌خونه.
// همه‌ی صفحه‌ها/کامپوننت‌ها (PricingSection، start، checkout-host) از همین composable
// استفاده می‌کنن و چون key ثابته، useAsyncData درخواست رو فقط یک بار می‌فرسته
// و نتیجه توی payload سرور می‌مونه (سمت کلاینت دوباره fetch نمی‌شه).

// ⚠️ آیدی دسته‌ی هاست رو از پنل چک کن و اینجا بذار
const HOSTING_CATEGORY_ID = '2'

// API دوره‌ی قیمت (duration_of_use) رو فعلاً null برمی‌گردونه، پس برچسب دوره اینجا ثابته
export const HOSTING_PRICE_PERIOD_LABEL = 'ماهانه'

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// هر ویژگی از products/showByPub: title_fa = اسم ویژگی، مقدار یا توی value_fa میاد
// (برای ویژگی‌های just_values که چندتا مقدار با کاما دارن) یا توی description
function buildFeatures(attributes) {
  return (attributes || [])
    .map((attr) => {
      const rawValue = attr.just_values
        ? String(attr.value_fa ?? '').split(',').map((v) => v.trim()).filter(Boolean).join('، ')
        : (attr.value_fa || attr.description || attr.attribute_values_description)
      const value = stripHtml(rawValue)
      if (!value) return null
      const label = stripHtml(attr.title_fa)
      return label ? `${label}: ${value}` : value
    })
    .filter(Boolean)
}

function normalizeProduct(product) {
  const price = Number(product.price) || 0
  const finalPrice = Number(product.final_price ?? product.price) || 0
  const discount = Number(product.discount) || 0
  const hasPrice = finalPrice > 0

  const features = buildFeatures(product.product_attributes_inline)

  return {
    id: String(product.id),
    name: stripHtml(product.title_fa),
    desc: stripHtml(product.summary_fa),
    features,
    price,
    finalPrice,
    discount,
    discountPercent: Math.round(Number(product.discount_percent) || 0),
    hasPrice,
    currencyName: product.currency_name || 'تومان',
    image: product.cover_image || null,
    sellable: hasPrice && Boolean(product.allow_sale) && product.status === 1
  }
}

export function formatHostingPrice(value) {
  return Math.round(Number(value) || 0).toLocaleString('fa-IR')
}

export async function useHostingPlans() {
  const config = useRuntimeConfig()
  const apiHeaders = useApiHeaders()

  async function fetchProductDetail(id) {
    try {
      const response = await $fetch(`${config.public.apiBase}/products/showByPub`, {
        method: 'POST',
        headers: apiHeaders.value,
        body: {
          id,
          inline_attributes: true,
          inline_price: true,
      
         }
      })
      if (Number(response?.code) !== 2000 || !response.Product) return null
      return response.Product
    } catch (error) {
      console.error(`[Hosting] خطا در دریافت جزئیات محصول ${productId}:`, error)
      return null
    }
  }

  const { data: plans, status, refresh } = await useAsyncData('hosting-plans', async () => {
    try {
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
          category: HOSTING_CATEGORY_ID,
          typeCode: 0,
          withAttrib: false
        }
      })

      if (Number(response?.code) !== 2000) {
        console.error('[Hosting] پاسخ نامعتبر از products/indexLite:', response)
        return []
      }

      const seenIds = new Set()
      const listed = (response.Products || []).filter((product) => {
        if (!product.title_fa || product.status !== 1 || seenIds.has(product.id)) return false
        seenIds.add(product.id)
        return true
      })

      // لیست فقط اطلاعات پایه رو داره؛ ویژگی‌ها (با اسم و مقدار) از showByPub هر محصول گرفته می‌شن.
      // اگه جزئیات یک محصول نیومد، همون داده‌ی لیست (بدون ویژگی) نمایش داده می‌شه.
      const detailed = await Promise.all(listed.map((product) => fetchProductDetail(product.id)))

      return listed.map((product, i) => normalizeProduct(
        detailed[i] ? { ...product, ...detailed[i] } : { ...product, product_attributes_inline: [] }
      ))
    } catch (error) {
      console.error('[Hosting] خطا در دریافت پلن‌های هاست:', error)
      return []
    }
  }, { default: () => [] })

  const isLoading = computed(() => status.value === 'pending')

  function findPlan(id) {
    if (id === undefined || id === null || id === '') return null
    return plans.value.find((p) => p.id === String(id)) || null
  }

  const defaultPlan = computed(() => plans.value.find((p) => p.sellable) || plans.value[0] || null)

  return { plans, status, isLoading, refresh, findPlan, defaultPlan }
}
