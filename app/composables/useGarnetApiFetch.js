// درخواست عمومی POST به بک‌اند پنل (همون بک‌اندی که بقیه‌ی composable ها مثل
// useHostingPlans و useSiteOptions ازش استفاده می‌کنن): آدرس از config.public.apiBase،
// هدرها از useApiHeaders (شامل g-api-key و توکن لاگین در صورت وجود) گرفته می‌شه.
// در صورت موفقیت (code === 2000) کل پاسخ رو برمی‌گردونه (همون شکلی که سایر
// composable ها با response.Products / response.Option و... انتظار دارن)،
// در غیر این صورت خطا throw می‌کنه تا catch سمت فراخوان‌کننده مدیریتش کنه.
export async function useGarnetApiFetch(endpoint, body = {}) {
  const config = useRuntimeConfig()
  const apiHeaders = useApiHeaders()

  const response = await $fetch(`${config.public.apiBase}/${endpoint}`, {
    method: 'POST',
    headers: apiHeaders.value,
    body
  })

  if (Number(response?.code) !== 2000) {
    throw new Error(response?.message || response?.msg || 'خطا در دریافت اطلاعات از سرور')
  }

  return response
}
