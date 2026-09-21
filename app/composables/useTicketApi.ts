export function useTicketApi() {
  const config = useRuntimeConfig()
  // آپلود فایل: Content-Type نباید دستی ست شود تا مرورگر multipart + boundary را خودش بسازد
  const uploadHeaders = useApiHeaders('')

  // مطابق منطق مرجع: پاسخ موفق یعنی code === 2000
  function isApiSuccess(payload: any) {
    return Number(payload?.code) === 2000
  }

  // فقط پیام‌های فارسی به کاربر نشان داده می‌شود؛ کلیدهای انگلیسی/خطاهای فنی فقط در کنسول می‌مانند
  function apiErrorMessage(source: any, fallback: string) {
    const message = source?.data?.message ?? source?.message
    return typeof message === 'string' && /[\u0600-\u06FF]/.test(message) ? message : fallback
  }

  // متن ساده‌ی textarea → HTML امن (API توضیحات را به‌صورت HTML ذخیره و نمایش می‌دهد)
  function textToHtml(text: string) {
    const escaped = text
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return `<p>${escaped.replace(/\r?\n/g, '<br>')}</p>`
  }

  // همه‌ی فایل‌ها در یک درخواست؛ خروجی: [{ file: 'آدرس' }] (فرمت ticket_files)
  async function uploadTicketFiles(files: File[]): Promise<{ file: string }[]> {
    if (!files.length) return []

    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files${index}`, file)
    })
    formData.append('destinationFolder', 'tickets')

    const res: any = await $fetch(`${config.public.apiBase}/uploadImage`, {
      method: 'POST',
      headers: uploadHeaders.value,
      body: formData,
    })

    if (!isApiSuccess(res) || !Array.isArray(res?.UploadedImages)) {
      console.error('Upload response:', res)
      throw new Error(apiErrorMessage(res, 'خطا در آپلود فایل'))
    }

    return res.UploadedImages.map((file: string) => ({ file }))
  }

  return {
    isApiSuccess,
    apiErrorMessage,
    textToHtml,
    uploadTicketFiles,
  }
}