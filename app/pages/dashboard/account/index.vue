<script setup>
import { ref, computed, onMounted } from 'vue'
import { User, AtSign, Phone, Lock, Save, CreditCard, Hash, Calendar } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const config = useRuntimeConfig()
const baseUrl = config.public.apiBase
const headers = useApiHeaders()

useHead({
  title: 'حساب کاربری | دنیاوب'
})

const { user, setUser, fetchUser } = useUserInfo()

// ---- اطلاعات پروفایل (فقط نمایش؛ از users/userInfo → User) ----

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
const genderLabels = { woman: 'زن', man: 'مرد' }

function isTrue(value) {
  return value === true || value === 1 || value === '1'
}

// تاریخ تولد فقط روز است؛ بدون جابه‌جایی منطقه‌ی زمانی
const dateOnlyFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC'
})

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

function formatBirthDate(value) {
  if (!value) return ''
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? String(value) : dateOnlyFormatter.format(date)
}

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

const statusLabel = computed(() => statusLabels[u.value.status_text] ?? u.value.status_text ?? '')

const infoRows = computed(() => {
  const data = u.value
  const gender = genderLabels[data.gender_text]

  const rows = [
    { label: 'نام', value: data.first_name, icon: User },
    { label: 'نام خانوادگی', value: data.last_name, icon: User },
    { label: 'شماره موبایل', value: formatMobile(data.mobile), icon: Phone, ltr: true, verified: isTrue(data.verified_mobile) },
    { label: 'ایمیل', value: data.email, icon: AtSign, ltr: true, verified: data.email ? isTrue(data.verified_email) : null },
    { label: 'کد ملی', value: data.national_code, icon: Hash, ltr: true },
    { label: 'تاریخ تولد', value: formatBirthDate(data.birth_date), icon: Calendar },
    { label: 'تاریخ عضویت', value: formatDateTime(data.register_date), icon: Calendar }
  ]

  if (gender) {
    rows.splice(6, 0, { label: 'جنسیت', value: gender, icon: User })
  }

  return rows
})

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

const isSavingPassword = ref(false)
const toast = useToast()

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

function toEnglishDigits(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

function normalizeShebaInput(value) {
  return toEnglishDigits(value)
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/^IR/, '')
    .replace(/\D/g, '')
    .slice(0, 24)
}

function onIbanInput(event) {
  ibanNumber.value = normalizeShebaInput(event.target.value)
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
    </div>

    <!-- Bank Info -->
    <div class="glass-card rounded-3xl p-6 sm:p-8">
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
              dir="ltr"
              maxlength="32"
              placeholder="240123456789012345678901"
              class="w-full pr-12 pl-14 py-3 rounded-xl input-glass text-white outline-none tracking-widest"
            >
          </div>

          <p class="text-xs text-gray-400 mt-2">
            شماره شبا را بدون IR وارد کنید.
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
    </div>

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
        <label class="flex items-center justify-between gap-4 cursor-pointer">
          <span class="text-sm text-gray-300">یادآوری تمدید سرویس‌ها</span>
          <input v-model="notifications.renewalReminders" type="checkbox" class="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0">
        </label>
        <label class="flex items-center justify-between gap-4 cursor-pointer">
          <span class="text-sm text-gray-300">ایمیل صدور فاکتور</span>
          <input v-model="notifications.invoiceEmails" type="checkbox" class="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0">
        </label>
        <label class="flex items-center justify-between gap-4 cursor-pointer">
          <span class="text-sm text-gray-300">اطلاع‌رسانی پاسخ تیکت‌ها</span>
          <input v-model="notifications.ticketUpdates" type="checkbox" class="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0">
        </label>
        <label class="flex items-center justify-between gap-4 cursor-pointer">
          <span class="text-sm text-gray-300">ایمیل‌های تبلیغاتی و پیشنهادات ویژه</span>
          <input v-model="notifications.marketing" type="checkbox" class="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0">
        </label>
      </div>
    </div>
  </div>
</template>