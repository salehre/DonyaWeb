// app/composables/useUserInfo.js
// نگهداری اطلاعات کاربر (User) در localStorage به‌جای کوکی.
// چون localStorage فقط سمت کلاینت در دسترسه، از useState برای state مشترکِ
// reactive استفاده شده و مقدار واقعی فقط بعد از mount (سمت کلاینت) از
// localStorage خونده می‌شه — قبل از اون null/خالیه (بدون mismatch در هیدریشن).

const STORAGE_KEY = 'user_donyaweb'

export function useUserInfo() {
  const user = useState('user-info', () => null)

  // خواندن مقدار از localStorage و پرکردن state — فقط سمت کلاینت معنا دارد
  function load() {
    if (!import.meta.client) return user.value
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      user.value = raw ? JSON.parse(raw) : null
    } catch {
      user.value = null
    }
    return user.value
  }

  // نوشتن/به‌روزرسانی اطلاعات کاربر
  function setUser(value) {
    user.value = value
    if (!import.meta.client) return
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // localStorage در دسترس نبود (مثلاً حالت خصوصی مرورگر) — بی‌خیال می‌شویم
    }
  }

  function clearUser() {
    setUser(null)
  }

  // دریافت اطلاعات تازه‌ی کاربر از API: users/userInfo → { code: 2000, User: {...} }
  // این تابع باید همزمان (قبل از هر await) از داخل setup/onMounted صدا زده شود تا کانتکست Nuxt در دسترس باشد.
  async function fetchUser() {
    const config = useRuntimeConfig()
    const headers = useApiHeaders()

    const response = await $fetch(`${config.public.apiBase}/users/userInfo`, {
      method: 'POST',
      headers: headers.value
    })

    if (Number(response?.code) !== 2000 || !response?.User) {
      console.error('users/userInfo unexpected response:', response)
      throw new Error('دریافت اطلاعات کاربر ناموفق بود.')
    }

    // شماره شبا در پاسخ userInfo برنمی‌گردد و فقط سمت کلاینت نگه داشته می‌شود؛
    // پس هنگام رفرش، مقدار ذخیره‌شده را از بین نمی‌بریم.
    const savedIban = user.value?.irb_iban_number
    setUser(
      savedIban && !response.User.irb_iban_number
        ? { ...response.User, irb_iban_number: savedIban }
        : response.User
    )

    return user.value
  }

  return { user, load, setUser, clearUser, fetchUser }
}