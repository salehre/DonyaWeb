<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight, Landmark, Gift, FileText,
  Clock, TrendingUp, TrendingDown, Search, X, Loader2, ShieldCheck, Copy,
  Pencil
} from 'lucide-vue-next'

const { toJalaliDate } = useJalaliDate()

definePageMeta({ layout: 'dashboard' })

useHead({
  title: 'کیف پول | دنیاوب'
})

const { user } = useUserInfo()

// شماره شبای ذخیره‌شده در پروفایل کاربر (از صفحه حساب کاربری) — پیش‌نیاز درخواست برداشت
const savedIban = computed(() => user.value?.irb_iban_number || '')
const hasSavedIban = computed(() => Boolean(savedIban.value))

const {
  balance,
  transactions: history,
  pendingItems,
  totalDeposited,
  totalSpent,
  transactionsPending,
  ensureLoaded,
  refresh,
  requestWithdraw: submitWithdrawRequest,
  formatNumber
} = useWallet()

await ensureLoaded()

const toast = useToast()

const pendingCount = computed(() => pendingItems.value.length)

const statCards = computed(() => [
  { icon: Wallet, label: 'موجودی قابل استفاده', value: `${formatNumber(balance.value)} تومان`, color: 'from-purple-500 to-blue-600' },
  { icon: TrendingUp, label: 'مجموع واریزی‌ها', value: `${formatNumber(totalDeposited.value)} تومان`, color: 'from-green-500 to-emerald-600' },
  { icon: TrendingDown, label: 'مجموع مصرف', value: `${formatNumber(totalSpent.value)} تومان`, color: 'from-orange-500 to-red-500' },
  { icon: Clock, label: 'در انتظار تسویه', value: `${pendingCount.value} تراکنش`, color: 'from-yellow-500 to-amber-600' }
])

// --- نمودار ساده‌ی روند ۷ روز اخیر (داده نمایشی، بدون نیاز به پکیج نمودار) ---
const weeklyTrend = [
  { day: 'شنبه', deposit: 120, usage: 80 },
  { day: 'یکشنبه', deposit: 180, usage: 90 },
  { day: 'دوشنبه', deposit: 90, usage: 110 },
  { day: 'سه‌شنبه', deposit: 280, usage: 60 },
  { day: 'چهارشنبه', deposit: 150, usage: 130 },
  { day: 'پنجشنبه', deposit: 320, usage: 170 },
  { day: 'جمعه', deposit: 210, usage: 95 }
]
const trendMax = Math.max(...weeklyTrend.flatMap((d) => [d.deposit, d.usage]))

// --- فرم درخواست برداشت ---
const showWithdrawForm = ref(false)
const withdrawAmount = ref('')
const isWithdrawing = ref(false)

function toggleWithdrawForm() {
  if (!hasSavedIban.value) {
    toast.error('برای برداشت وجه ابتدا باید شماره شبای خود را در حساب کاربری ثبت کنید.')
    return
  }

  showWithdrawForm.value = !showWithdrawForm.value
}

async function submitWithdraw() {
  if (!hasSavedIban.value) {
    toast.error('برای برداشت وجه ابتدا باید شماره شبای خود را در حساب کاربری ثبت کنید.')
    return
  }

  const amount = Number(withdrawAmount.value)
  const iban = savedIban.value.trim()

  if (!amount || amount < 50000) {
    toast.error('حداقل مبلغ برداشت ۵۰,۰۰۰ تومان است.')
    return
  }

  if (!isValidSheba(iban)) {
    toast.error('شماره شبای ثبت‌شده معتبر نیست. لطفاً آن را از بخش حساب کاربری بررسی کنید.')
    return
  }

  isWithdrawing.value = true

  try {
    // همیشه شبای ثبت‌شده کاربر ارسال می‌شود.
    await submitWithdrawRequest(amount, iban)

    toast.success('درخواست برداشت با موفقیت ثبت شد.')

    withdrawAmount.value = ''
    showWithdrawForm.value = false
  } catch (err) {
    toast.error(err.message || 'خطایی در ثبت درخواست رخ داد.')
  } finally {
    isWithdrawing.value = false
  }
}

// --- فیلتر و جستجوی تراکنش‌ها ---
const activeFilter = ref('all')
const searchQuery = ref('')

const filters = [
  { id: 'all', label: 'همه' },
  { id: 'topup', label: 'واریز' },
  { id: 'usage', label: 'مصرف' },
  { id: 'withdraw', label: 'برداشت' }
]

const typeMeta = {
  deposit: {
    label: 'واریز',
    color: 'text-green-400',
    icon: ArrowDownLeft,
  },

  purchase: {
    label: 'خرید',
    color: 'text-red-400',
    icon: ArrowUpRight,
  },

  withdraw: {
    label: 'برداشت',
    color: 'text-orange-400',
    icon: Landmark,
  },

  transfer: {
    label: 'انتقال',
    color: 'text-blue-400',
    icon: ArrowUpRight,
  },

  award: {
    label: 'پاداش',
    color: 'text-yellow-400',
    icon: Gift,
  },
}

const filteredHistory = computed(() => {
  return history.value
    .filter((t) => {
      const matchesFilter =
        activeFilter.value === 'all' || t.type === activeFilter.value

      const q = searchQuery.value.trim().toLowerCase()

      const matchesSearch =
        !q ||
        String(t.id).includes(q) ||
        t.method.toLowerCase().includes(q)

      return matchesFilter && matchesSearch
    })
})

function copyBalance() {
  if (import.meta.client) {
    navigator.clipboard?.writeText(String(balance.value))
    toast.success('موجودی در کلیپ‌بورد کپی شد')
  }
}

function isValidSheba(sheba) {
  sheba = sheba.replace(/\s+/g, '').toUpperCase()

  if (!/^IR\d{24}$/.test(sheba)) return false

  const rearranged = sheba.slice(4) + '1827' + sheba.slice(2, 4)

  let remainder = ''

  for (const char of rearranged) {
    remainder = (remainder + char)

    remainder = (BigInt(remainder) % 97n).toString()
  }

  return remainder === '1'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Hero: موجودی + اکشن‌های سریع -->
    <div class="relative overflow-hidden glass-card rounded-3xl p-6 sm:p-8">
      <div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-purple-600/20 blur-3xl" />
      <div class="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl" />

      <div class="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
            <Wallet class="w-8 h-8 text-white" />
          </div>
          <div>
            <p class="text-gray-400 text-sm mb-1">موجودی قابل استفاده</p>
            <div class="flex items-center gap-2">
              <p class="text-3xl sm:text-4xl font-black">{{ balance.toLocaleString('fa-IR') }}</p>
              <span class="text-base font-normal text-gray-400">تومان</span>
              <button type="button" class="text-gray-500 hover:text-white transition-colors" @click="copyBalance">
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/dashboard/finance/topup"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30"
          >
            <Plus class="w-4 h-4" />
            افزایش موجودی
          </NuxtLink>
          <!-- <button
            type="button"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 transition-all font-bold"
            :class="hasSavedIban ? 'hover:border-purple-500/40' : 'opacity-50 cursor-not-allowed'"
            :title="hasSavedIban ? '' : 'ابتدا شماره شبا را در حساب کاربری ثبت کنید'"
            @click="toggleWithdrawForm"
          >
            <Landmark class="w-4 h-4" />
            برداشت وجه
          </button>
          <NuxtLink
            to="/dashboard/finance/gift-card"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 hover:border-purple-500/40 transition-all font-bold"
          >
            <Gift class="w-4 h-4" />
            کارت هدیه
          </NuxtLink> -->
        </div>
      </div>

      <div
        v-if="!hasSavedIban"
        class="relative mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
      >
        <ShieldCheck class="w-4 h-4 shrink-0" />
        <span>برای فعال‌شدن برداشت وجه، ابتدا باید شماره شبای خود را در حساب کاربری ثبت کنید.</span>
        <NuxtLink
          to="/dashboard/account"
          class="mr-auto inline-flex items-center gap-1 font-bold text-white underline underline-offset-4 hover:text-purple-300"
        >
          ثبت شماره شبا
        </NuxtLink>
      </div>
    </div>

    <!-- فرم درخواست برداشت -->
    <div v-if="showWithdrawForm && hasSavedIban" class="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <Landmark class="w-5 h-5 text-purple-400" />
          درخواست برداشت وجه
        </h2>
        <button type="button" class="text-gray-500 hover:text-white transition-colors" @click="showWithdrawForm = false">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-300 mb-2">مبلغ برداشت (تومان)</label>
          <input
            v-model="withdrawAmount"
            type="number"
            min="50000"
            placeholder="حداقل ۵۰,۰۰۰"
            class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
          >
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-2">شماره شبا مقصد</label>
          <input
            :value="savedIban"
            type="text"
            dir="ltr"
            readonly
            aria-readonly="true"
            class="w-full px-4 py-3 rounded-xl input-glass text-gray-300 outline-none text-left cursor-not-allowed opacity-75"
            title="شماره شبا فقط از بخش حساب کاربری قابل ثبت است"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs text-gray-500">
        <ShieldCheck class="w-4 h-4 shrink-0" />
        درخواست‌های برداشت پس از بررسی، طی حداکثر ۲۴ ساعت کاری به حساب اعلام‌شده واریز می‌شوند.
      </div>

      <button
        type="button"
        :disabled="isWithdrawing"
        class="w-full sm:w-auto px-8 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        @click="submitWithdraw"
      >
        <Loader2 v-if="isWithdrawing" class="w-4 h-4 animate-spin" />
        <ArrowUpRight v-else class="w-4 h-4" />
        {{ isWithdrawing ? 'در حال ثبت درخواست...' : 'ثبت درخواست برداشت' }}
      </button>
    </div>

    <!-- آمار کلی -->
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <DashboardStatCard
        v-for="card in statCards"
        :key="card.label"
        :icon="card.icon"
        :label="card.label"
        :value="card.value"
        :color="card.color"
      />
    </div>

    <!-- نمودار روند هفتگی (SVG سبک، بدون نیاز به پکیج جانبی) -->
    <!-- <div class="glass-card rounded-3xl p-6 sm:p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold">روند واریز و مصرف (۷ روز اخیر)</h2>
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-500" /> واریز</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-400/60" /> مصرف</span>
        </div>
      </div>
      <div class="flex items-end justify-between gap-2 sm:gap-4 h-40">
        <div v-for="d in weeklyTrend" :key="d.day" class="flex-1 flex flex-col items-center gap-2">
          <div class="w-full flex items-end justify-center gap-1 h-32">
            <div
              class="w-1/2 max-w-3.5 rounded-t-md bg-linear-to-t from-purple-600 to-purple-400"
              :style="{ height: `${(d.deposit / trendMax) * 100}%` }"
            />
            <div
              class="w-1/2 max-w-3.5 rounded-t-md bg-linear-to-t from-blue-600/50 to-blue-400/50"
              :style="{ height: `${(d.usage / trendMax) * 100}%` }"
            />
          </div>
          <span class="text-[11px] text-gray-500">{{ d.day }}</span>
        </div>
      </div>
    </div> -->

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- جدول تراکنش‌ها -->
      <div class="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
        <div class="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 class="text-lg font-bold">تاریخچه تراکنش‌ها</h2>
          <div class="flex items-center gap-3">
            <div class="relative">
              <Search class="w-4 h-4 text-gray-500 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="جستجوی شناسه یا روش..."
                class="w-full sm:w-56 pr-9 pl-3 py-2 rounded-lg input-glass text-sm text-white placeholder-gray-500 outline-none"
              >
            </div>
          </div>
        </div>

        <div class="px-6 flex items-center gap-2 overflow-x-auto pb-4">
          <button
            v-for="f in filters"
            :key="f.id"
            type="button"
            class="px-4 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap"
            :class="activeFilter === f.id
              ? 'bg-linear-to-r from-purple-600 to-blue-600 border-transparent'
              : 'glass border-white/10 text-gray-400 hover:text-white hover:border-purple-500/40'"
            @click="activeFilter = f.id"
          >
            {{ f.label }}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-y border-white/10 text-gray-400 text-right">
                <th class="px-6 py-3 font-medium">شناسه</th>
                <th class="px-6 py-3 font-medium">نوع</th>
                <th class="px-6 py-3 font-medium">مبلغ (تومان)</th>
                <th class="px-6 py-3 font-medium">روش</th>
                <th class="px-6 py-3 font-medium">تاریخ</th>
                <th class="px-6 py-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="transactionsPending"
              >
                <td
                  colspan="6"
                  class="px-6 py-12 text-center text-gray-500"
                >
                  در حال دریافت تراکنش‌ها...
                </td>
              </tr>

              <tr
                v-else
                v-for="t in filteredHistory"
                :key="t.id"
                class="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <td class="px-6 py-4 font-medium" dir="ltr">
                  {{ t.id }}
                </td>

                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center gap-1.5"
                    :class="typeMeta[t.type]?.color"
                  >
                    <component
                      :is="typeMeta[t.type]?.icon"
                      class="w-4 h-4"
                    />
                    {{ typeMeta[t.type]?.label || t.type }}
                  </span>
                </td>

                <td class="px-6 py-4 text-gray-300" dir="ltr">
                  {{ formatNumber(t.amount) }}
                </td>

                <td class="px-6 py-4 text-gray-400">
                  {{ t.method }}
                </td>

                <td class="px-6 py-4 text-gray-400">
                  {{ t.date }}
                </td>

                <td class="px-6 py-4">
                  <DashboardStatusBadge :status="t.status" />
                </td>
              </tr>

              <tr
                v-if="!transactionsPending && !filteredHistory.length"
              >
                <td
                  colspan="6"
                  class="px-6 py-12 text-center text-gray-500"
                >
                  تراکنشی یافت نشد.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ستون کناری -->
      <div class="space-y-6">
        <!-- درخواست‌های در انتظار -->
        <div class="glass-card rounded-3xl overflow-hidden">
          <div class="p-5 border-b border-white/10">
            <h3 class="font-bold flex items-center gap-2">
              <Clock class="w-4 h-4 text-yellow-400" />
              درخواست‌های در انتظار
            </h3>
          </div>
          <div v-if="pendingItems.length" class="p-5 space-y-3">
            <div v-for="p in pendingItems" :key="p.id" class="rounded-xl bg-white/5 border border-white/10 p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">{{ typeMeta[p.type]?.label || p.type }}</span>
                <DashboardStatusBadge :status="p.status" />
              </div>
              <p class="text-gray-400 text-sm" dir="ltr">{{ formatNumber(p.amount) }} تومان</p>
            </div>
          </div>
          <div v-else class="p-5 text-sm text-gray-500 text-center">
            درخواست در انتظاری وجود ندارد.
          </div>
        </div>

        <!-- دسترسی سریع -->
        <div class="glass-card rounded-3xl p-5 space-y-3">
          <h3 class="font-bold mb-1">دسترسی سریع</h3>
          <NuxtLink to="/dashboard/invoices" class="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors">
            <div class="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <FileText class="w-4 h-4 text-purple-400" />
            </div>
            <span class="text-sm">فاکتورهای پرداخت‌نشده</span>
          </NuxtLink>
          <NuxtLink to="/dashboard/finance/gift-card" class="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors">
            <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Gift class="w-4 h-4 text-amber-400" />
            </div>
            <span class="text-sm">فعال‌سازی کارت هدیه</span>
          </NuxtLink>
        </div>

        <!-- اطلاعات حساب -->
        <!-- <div class="glass-card rounded-3xl overflow-hidden">
          <div class="p-5 border-b border-white/10 flex items-center justify-between">
            <h3 class="font-bold">اطلاعات حساب</h3>
            
            <NuxtLink
              to="/dashboard/account"
              title="ویرایش اطلاعات حساب"
              class="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Pencil class="w-3.5 h-3.5" />
              ویرایش
            </NuxtLink>
          </div>
          <div class="divide-y divide-white/5 text-sm">
            <div class="flex justify-between p-4">
              <span class="text-gray-400">نام کاربر</span>
              <span class="font-medium">{{ user.full_name }}</span>
            </div>
            <div class="flex justify-between p-4">
              <span class="text-gray-400">ایمیل</span>
              <span class="font-medium" dir="ltr">{{ user.email }}</span>
            </div>
            <div class="flex justify-between p-4">
              <span class="text-gray-400">تاریخ عضویت</span>
              <span class="font-medium">{{ toJalaliDate(user.register_date) }}</span>
            </div>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>