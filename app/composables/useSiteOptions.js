// تنظیمات سایت (مثل اطلاعات شرکت و هدر/فوتر فاکتور) که PrintInvoice.vue از پراپ custom می‌خونه.
// معادل customizer.allOptions در پروژه‌ی مبدأ؛ از endpoint ‏options/indexSiteValues گرفته می‌شه
// و با useState بین صفحات به اشتراک گذاشته می‌شه (فقط یک بار از سرور گرفته می‌شه).

export function useSiteOptions() {
  const config = useRuntimeConfig()
  const headers = useApiHeaders()

  const options = useState('site-options', () => ({}))
  const loaded = useState('site-options-loaded', () => false)

  async function ensureLoaded(force = false) {
    if (loaded.value && !force) return options.value
    try {
      const response = await $fetch(`${config.public.apiBase}/options/indexSiteValues`, {
        method: 'POST',
        headers: headers.value
      })
      options.value = response?.Options || {}
      loaded.value = true
    } catch (error) {
      // اگه نشد، loaded false می‌مونه تا دفعه‌ی بعد دوباره تلاش بشه
      console.error('options/indexSiteValues failed:', error)
    }
    return options.value
  }

  return { options, ensureLoaded }
}