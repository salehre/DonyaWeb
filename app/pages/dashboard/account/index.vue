<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { User, AtSign, Phone, Lock, Save, CreditCard, Hash, Calendar, Check } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const config = useRuntimeConfig()
const baseUrl = config.public.apiBase
const headers = useApiHeaders()

useHead({
  title: 'حساب کاربری | دنیاوب'
})

const { user, setUser, fetchUser } = useUserInfo()
const toast = useToast()

// ---- کمکی‌های ورودی عددی ----

function toEnglishDigits(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

// ورودی‌ای که فقط عدد می‌پذیرد: مقدار DOM را هم اصلاح می‌کند (فقط عوض کردن state کافی نیست،
// چون اگر state تغییری نکند Vue مقدار input را دوباره رندر نمی‌کند و حرف تایپ‌شده در فیلد می‌ماند)
function sanitizeInput(event, normalize) {
  const el = event.target
  const raw = el.value
  const cleaned = normalize(raw)

  if (raw !== cleaned) {
    const caret = Math.max((el.selectionStart ?? raw.length) - (raw.length - cleaned.length), 0)
    el.value = cleaned
    el.setSelectionRange(caret, caret)
  }

  return cleaned
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// ---- اطلاعات پروفایل (از users/userInfo → User) ----

const u = computed(() => user.value || {})

// با ورود به صفحه، اطلاعات تازه‌ی کاربر از API گرفته می‌شود (در صورت خطا همان داده‌ی ذخیره‌شده می‌ماند)
onMounted(async () => {
  try {
    await fetchUser()
  } catch (err) {
    console.error('User info refresh error:', err, err?.data)
  }
})

const green = 'bg-green-500/10 text-green-400 border-green-500/30'
const gray = 'bg-gray-500/10 text-gray-400 border-gray-500/30'

const statusLabels = { active: 'فعال' }

function isTrue(value) {
  return value === true || value === 1 || value === '1'
}

const isAccountVerified = computed(() =>
  isTrue(u.value.verified_mobile) && isTrue(u.value.verified_email)
)

// تاریخ‌وساعت‌های سرور UTC هستند → نمایش به وقت تهران
const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Tehran'
})

function formatDateTime(value) {
  if (!value) return ''
  const raw = String(value).trim().replace(' ', 'T')
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(raw)
  const date = new Date(hasZone ? raw : `${raw}Z`)
  return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.format(date)
}

// موبایل در API بدون صفر ابتدایی می‌آید (مثلاً 9300377838)
function formatMobile(value) {
  const digits = String(value ?? '').trim()
  if (!digits) return ''
  return digits.length === 10 && digits.startsWith('9') ? `0${digits}` : digits
}

const avatarLetter = computed(() => u.value.first_name?.charAt(0) || u.value.full_name?.charAt(0) || '؟')

const statusLabel = computed(() => {
  if (u.value.status_text === 'active' && !isAccountVerified.value) return 'پیش ثبت نام'
  return statusLabels[u.value.status_text] ?? u.value.status_text ?? ''
})

// فیلدهای فقط‌نمایشی (کد ملی، تاریخ تولد و جنسیت پایین‌تر در فرم قابل ویرایش هستند)
const infoRows = computed(() => {
  const data = u.value

  const rows = [
    { label: 'نام', value: data.first_name, icon: User },
    { label: 'نام خانوادگی', value: data.last_name, icon: User },
    { label: 'شماره موبایل', value: formatMobile(data.mobile), icon: Phone, ltr: true, verified: isTrue(data.verified_mobile) },
    { label: 'ایمیل', value: data.email, icon: AtSign, ltr: true, verified: data.email ? isTrue(data.verified_email) : null }
  ]

  rows.push({ label: 'تاریخ عضویت', value: formatDateTime(data.register_date), icon: Calendar })

  return rows
})

// ---- اطلاعات هویتی: کد ملی، تاریخ تولد و جنسیت (قابل ویرایش) ----

function normalizeNationalCode(value) {
  return toEnglishDigits(value).replace(/\D/g, '').slice(0, 10)
}

// اعتبارسنجی کد ملی ایران (ده رقم + رقم کنترل)
function isValidNationalCode(value) {
  const code = normalizeNationalCode(value)

  if (!/^\d{10}$/.test(code)) return false
  if (/^(\d)\1{9}$/.test(code)) return false

  const sum = code
    .slice(0, 9)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0)

  const remainder = sum % 11
  const check = Number(code[9])

  return remainder < 2 ? check === remainder : check === 11 - remainder
}

const nationalCode = ref(normalizeNationalCode(user.value?.national_code))
// birth_date در API به‌صورت میلادی 'YYYY-MM-DD' است؛ DashboardDatePicker (نمایش شمسی) همین فرمت را می‌گیرد و برمی‌گرداند
const birthDate = ref(String(user.value?.birth_date ?? '').slice(0, 10))
const isSavingIdentity = ref(false)

// جنسیت: مقدار عددی در API (gender). ۰ = زن (طبق نمونه‌ی userInfo: gender 0 ↔ gender_text 'woman')
// و ۱ = مرد (فرض؛ باید با بک‌اند چک شود). value ها رشته‌اند چون StartCustomSelect مقدار String می‌گیرد.
const genderOptions = [
  { value: '0', label: 'زن' },
  { value: '1', label: 'مرد' }
]

function genderValueFrom(data) {
  if (data?.gender_text === 'woman') return '0'
  if (data?.gender_text === 'man') return '1'
  const numeric = String(data?.gender ?? '')
  return genderOptions.some((o) => o.value === numeric) ? numeric : ''
}

const gender = ref(genderValueFrom(user.value))

// وقتی اطلاعات تازه از API رسید، فرم هم به‌روز می‌شود
watch(
  [() => u.value.national_code, () => u.value.birth_date, () => u.value.gender_text, () => u.value.gender],
  ([code, birth]) => {
    nationalCode.value = normalizeNationalCode(code)
    birthDate.value = String(birth ?? '').slice(0, 10)
    gender.value = genderValueFrom(u.value)
  }
)

// can_update: '1' یعنی کاربر اجازه‌ی ویرایش دارد (اگر فیلد نبود، ویرایش مجاز فرض می‌شود)
const canUpdate = computed(() => (u.value.can_update === undefined ? true : isTrue(u.value.can_update)))

function onNationalCodeInput(event) {
  nationalCode.value = sanitizeInput(event, normalizeNationalCode)
}

async function saveIdentity() {
  if (isSavingIdentity.value) return

  const payload = {}

  if (nationalCode.value) {
    if (!isValidNationalCode(nationalCode.value)) {
      toast.error('کد ملی وارد شده معتبر نیست')
      return
    }
    payload.national_code = nationalCode.value
  }

  if (birthDate.value) {
    if (birthDate.value > todayIso()) {
      toast.error('تاریخ تولد نمی‌تواند در آینده باشد')
      return
    }
    payload.birth_date = birthDate.value
  }

  // جنسیت فقط وقتی عوض شده ارسال می‌شود (تا مقدار پیش‌فرض API بی‌دلیل ثبت نشود)
  if (gender.value !== '' && gender.value !== genderValueFrom(u.value)) {
    payload.gender = Number(gender.value)
  }

  if (!Object.keys(payload).length) {
    toast.info('اطلاعاتی برای ثبت وارد نشده است')
    return
  }

  isSavingIdentity.value = true

  try {
    const response = await $fetch(`${baseUrl}/users/update`, {
      method: 'POST',
      headers: headers.value,
      body: payload
    })

    if (Number(response?.code) === 2000) {
      toast.success('اطلاعات ثبت شد.')

      // اطلاعات ذخیره‌شده را دوباره از userInfo می‌گیریم؛ اگر نشد، همان مقادیر را محلی ثبت می‌کنیم
      try {
        await fetchUser()
      } catch (refreshError) {
        console.error('User info refresh error:', refreshError)
        setUser({
          ...(user.value || {}),
          ...payload,
          ...(payload.gender !== undefined ? { gender_text: payload.gender === 1 ? 'man' : 'woman' } : {})
        })
      }
    } else {
      console.error('users/update response:', response)
      toast.error(response?.error || response?.msg || response?.message || 'خطا در ثبت اطلاعات')
    }
  } catch (err) {
    console.error('users/update error:', err, err?.data)

    const message =
      err?.data?.message ||
      err?.data?.error ||
      err?.data?.msg ||
      'خطا در ثبت اطلاعات'

    toast.error(message)
  } finally {
    isSavingIdentity.value = false
  }
}

// ---- تنظیمات اعلان‌ها ----

const passwords = ref({
  current: '',
  next: '',
  confirm: ''
})

const notifications = ref({
  renewalReminders: true,
  invoiceEmails: true,
  ticketUpdates: true,
  marketing: false
})

const notificationOptions = [
  { key: 'renewalReminders', label: 'یادآوری تمدید سرویس‌ها' },
  { key: 'invoiceEmails', label: 'ایمیل صدور فاکتور' },
  { key: 'ticketUpdates', label: 'اطلاع‌رسانی پاسخ تیکت‌ها' },
  { key: 'marketing', label: 'ایمیل‌های تبلیغاتی و پیشنهادات ویژه' }
]

const isSavingPassword = ref(false)

// ---- اطلاعات بانکی ----

const ibanNumber = ref(
  normalizeShebaInput(
    user.value?.irb_iban_number ||
    user.value?.iban_number ||
    user.value?.iban ||
    ''
  )
)

const isSavingBankInfo = ref(false)

function normalizeShebaInput(value) {
  return toEnglishDigits(value)
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/^IR/, '')
    .replace(/\D/g, '')
    .slice(0, 24)
}

// فقط عدد: هر کاراکتر غیرعددی همان لحظه از فیلد حذف می‌شود (ارقام فارسی/عربی به انگلیسی تبدیل می‌شوند)
function onIbanInput(event) {
  ibanNumber.value = sanitizeInput(event, normalizeShebaInput)
}

function isValidShebaNumber(value) {
  const digits = normalizeShebaInput(value)

  if (!/^\d{24}$/.test(digits)) {
    return false
  }

  const sheba = `IR${digits}`

  const rearranged = sheba.slice(4) + sheba.slice(0, 4)

  const converted = rearranged.replace(/[A-Z]/g, char => {
    return String(char.charCodeAt(0) - 55)
  })

  let remainder = 0

  for (const digit of converted) {
    remainder = (remainder * 10 + Number(digit)) % 97
  }

  return remainder === 1
}

async function saveBankInfo() {
  if (isSavingBankInfo.value) return

  if (!ibanNumber.value) {
    toast.info('شماره شبا خود را وارد کنید')
    return
  }

  if (!isValidShebaNumber(ibanNumber.value)) {
    toast.error('فرمت شماره شبا اشتباه می‌باشد')
    return
  }

  isSavingBankInfo.value = true

  try {
    const sendData = {
      irb_iban_number: `IR${ibanNumber.value}`
    }

    const response = await $fetch(`${baseUrl}/users/updateIban`, {
      method: 'POST',
      headers: headers.value,
      body: sendData
    })

    if (Number(response?.code) === 2000) {
      toast.success('اطلاعات ثبت شد.')

      setUser({
        ...(user.value || {}),
        irb_iban_number: sendData.irb_iban_number
      })
    } else {
      toast.error(response?.error || response?.msg || 'خطا در ثبت اطلاعات')
    }
  } catch (err) {
    const message =
      err?.data?.message ||
      err?.data?.error ||
      err?.data?.msg ||
      'خطا در ثبت اطلاعات بانکی'

    toast.error(message)
  } finally {
    isSavingBankInfo.value = false
  }
}

// ---- تغییر رمز عبور ----

async function savePassword() {
  if (!passwords.value.current || !passwords.value.next || !passwords.value.confirm) {
    toast.error('لطفاً همه فیلدها را تکمیل کنید')
    return
  }
  if (passwords.value.next !== passwords.value.confirm) {
    toast.error('رمز عبور جدید و تکرار آن یکسان نیستند')
    return
  }
  if (passwords.value.next.length < 4) {
    toast.error('رمز عبور جدید باید حداقل 4 کاراکتر باشد')
    return
  }

  isSavingPassword.value = true
  try {
    const res = await $fetch(`${baseUrl}/users/updatePassword`, {
      method: 'POST',
      headers: headers.value,
      body: {
        oldPassword: passwords.value.current,
        password: passwords.value.next,
      }
    })

    if(res.code === 2000) {
      toast.success('رمز عبور با موفقیت تغییر کرد.')
      passwords.value = { current: '', next: '', confirm: '' }
    } else {
      toast.error('خطایی رخ داده. دوباره امتحان کنید')
    }
  } catch (err) {
    console.log(err)
    const message = err?.data?.message || err?.data?.error || 'تغییر رمز عبور با خطا مواجه شد. لطفاً رمز فعلی را بررسی کنید.'
    toast.error(message)
  } finally {
    isSavingPassword.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Profile -->
    <div class="glass-card rounded-3xl p-6 sm:p-8">
      <div class="flex items-center gap-4 mb-6">
        <div
          class="w-14 h-14 rounded-full bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center text-lg font-bold shrink-0"
        >
          {{ avatarLetter }}
        </div>

        <div class="min-w-0">
          <h2 class="text-lg font-bold truncate">{{ u.full_name || 'اطلاعات پروفایل' }}</h2>
          <p class="text-xs text-gray-500">
            <template v-if="u.id">
              کد کاربری: <span dir="ltr">#{{ u.id }}</span>
            </template>
            <template v-if="statusLabel"> · وضعیت حساب: {{ statusLabel }}</template>
          </p>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div
          v-for="row in infoRows"
          :key="row.label"
          class="rounded-2xl bg-white/5 border border-white/10 px-4 py-3"
        >
          <p class="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <component :is="row.icon" class="w-4 h-4" />
            {{ row.label }}
          </p>

          <div class="flex items-center justify-between gap-2">
            <span
              class="text-sm font-medium truncate"
              :class="row.value ? 'text-white' : 'text-gray-500'"
              :dir="row.ltr && row.value ? 'ltr' : undefined"
            >
              {{ row.value || 'ثبت نشده' }}
            </span>

            <span
              v-if="row.verified !== null && row.verified !== undefined"
              class="text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap"
              :class="row.verified ? green : gray"
            >
              {{ row.verified ? 'تأیید شده' : 'تأیید نشده' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Identity (editable) -->
      <form class="mt-8 pt-6 border-t border-white/10 space-y-5" @submit.prevent="saveIdentity">
        <h3 class="text-base font-bold">اطلاعات هویتی</h3>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label for="national-code" class="block text-sm text-gray-300 mb-2">
              کد ملی
            </label>

            <div class="relative">
              <Hash class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />

              <input
                id="national-code"
                :value="nationalCode"
                @input="onNationalCodeInput"
                :disabled="!canUpdate"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="off"
                dir="ltr"
                maxlength="10"
                placeholder="0012345678"
                class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white outline-none tracking-widest disabled:opacity-60"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm text-gray-300 mb-2">
              تاریخ تولد
            </label>

            <DashboardDatePicker
              v-model="birthDate"
              placeholder="تاریخ تولد را انتخاب کنید"
              :disabled="!canUpdate"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-300 mb-2">
              جنسیت
            </label>

            <div :class="canUpdate ? '' : 'pointer-events-none opacity-60'">
              <StartCustomSelect
                v-model="gender"
                :options="genderOptions"
                placeholder="انتخاب جنسیت"
              />
            </div>
          </div>
        </div>

        <button
          v-if="canUpdate"
          type="submit"
          :disabled="isSavingIdentity"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-medium disabled:opacity-60"
        >
          <Save class="w-4 h-4" />
          {{ isSavingIdentity ? 'در حال ثبت...' : 'ثبت اطلاعات هویتی' }}
        </button>

        <p v-else class="text-xs text-gray-500">
          ویرایش اطلاعات برای حساب شما فعال نیست.
        </p>
      </form>
    </div>

    <!-- Bank Info -->
    <!-- <div class="glass-card rounded-3xl p-6 sm:p-8">
      <h2 class="text-lg font-bold mb-6">اطلاعات بانکی</h2>

      <form class="space-y-5" @submit.prevent="saveBankInfo">
        <div>
          <label for="iban-number" class="block text-sm text-gray-300 mb-2">
            شماره شبا
          </label>

          <div class="relative">
            <CreditCard class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />

            <span class="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 font-medium">
              IR
            </span>

            <input
              id="iban-number"
              :value="ibanNumber"
              @input="onIbanInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              dir="ltr"
              maxlength="32"
              placeholder="240123456789012345678901"
              class="w-full pr-12 pl-14 py-3 rounded-xl input-glass text-white outline-none tracking-widest"
            >
          </div>

          <p class="text-xs text-gray-400 mt-2">
            شماره شبا را بدون IR وارد کنید (فقط عدد).
          </p>
        </div>

        <button
          type="submit"
          :disabled="isSavingBankInfo"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-medium disabled:opacity-60"
        >
          <Save class="w-4 h-4" />
          {{ isSavingBankInfo ? 'در حال ثبت...' : 'ثبت شماره شبا' }}
        </button>
      </form>
    </div> -->

    <!-- Password -->
    <div class="glass-card rounded-3xl p-6 sm:p-8">
      <h2 class="text-lg font-bold mb-6">تغییر رمز عبور</h2>

      <form class="space-y-5" @submit.prevent="savePassword">
        <div>
          <label for="current-password" class="block text-sm text-gray-300 mb-2">رمز عبور فعلی</label>
          <div class="relative">
            <Lock class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
            <input id="current-password" v-model="passwords.current" type="password" class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white outline-none">
          </div>
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label for="new-password" class="block text-sm text-gray-300 mb-2">رمز عبور جدید</label>
            <div class="relative">
              <Lock class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
              <input id="new-password" v-model="passwords.next" type="password" class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white outline-none">
            </div>
          </div>
          <div>
            <label for="confirm-password" class="block text-sm text-gray-300 mb-2">تکرار رمز جدید</label>
            <div class="relative">
              <Lock class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
              <input id="confirm-password" v-model="passwords.confirm" type="password" class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white outline-none">
            </div>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isSavingPassword"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-medium disabled:opacity-60"
        >
          <Save class="w-4 h-4" />
          {{ isSavingPassword ? 'در حال ذخیره...' : 'تغییر رمز عبور' }}
        </button>
      </form>
    </div>

    <!-- Notifications -->
    <div class="glass-card rounded-3xl p-6 sm:p-8">
      <h2 class="text-lg font-bold mb-6">تنظیمات اعلان‌ها</h2>

      <div class="space-y-4">
        <label
          v-for="option in notificationOptions"
          :key="option.key"
          class="flex items-center justify-between gap-4 cursor-pointer select-none"
        >
          <span class="text-sm text-gray-300">{{ option.label }}</span>

          <!-- چک‌باکس کاستوم: input واقعی مخفی است (برای کیبورد/دسترسی‌پذیری) و ظاهر با peer ساخته می‌شود -->
          <span class="relative inline-flex w-6 h-6 shrink-0">
            <input
              v-model="notifications[option.key]"
              type="checkbox"
              class="peer sr-only"
            >

            <span
              class="absolute inset-0 rounded-lg border border-white/20 bg-white/10 transition-all duration-200 hover:border-purple-400/60 peer-checked:border-transparent peer-checked:bg-linear-to-br peer-checked:from-purple-600 peer-checked:to-blue-600 peer-checked:shadow-lg peer-checked:shadow-purple-500/30 peer-focus-visible:ring-4 peer-focus-visible:ring-purple-500/30"
            />

            <Check
              class="absolute inset-0 m-auto w-4 h-4 text-white pointer-events-none scale-50 opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100"
            />
          </span>
        </label>
      </div>
    </div>
  </div>
</template>