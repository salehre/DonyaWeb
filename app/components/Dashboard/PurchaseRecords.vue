<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Eye, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user } = useUserInfo()
const {
  t,
  apiFetch,
  numberWithSeparator,
  getStatusBadgeClass,
  getStatusText,
  getInvoicePrimaryDate,
  getInvoiceCode
} = usePurchaseRecords()

const Invoices = ref([])
const loadingList = ref(false)

const statusByTab = {
  stores: [2, 3, 4, 5, 8],
  invoices: [6],
  returned_invoices: [9, 10, 11, 12],
  canceled_invoices: [7]
}

const tabsConfig = [
  { value: 'stores', label: 'سفارشات', heading: 'سفارشات من' },
  { value: 'invoices', label: 'فاکتورها', heading: 'فاکتورهای من' },
  { value: 'returned_invoices', label: 'فاکتورهای مرجوعی', heading: 'فاکتورهای مرجوعی من' },
  { value: 'canceled_invoices', label: 'فاکتورهای لغوشده', heading: 'فاکتورهای لغوشده من' }
]

// تب فعال از آدرس خونده می‌شه تا بعد از برگشت از صفحه‌ی جزئیات، کاربر روی همون تب بمونه
const initialTab = tabsConfig.some((c) => c.value === route.query.tab) ? route.query.tab : 'stores'
const tab = ref(initialTab)

const getPurchasesList = (status = statusByTab[tab.value] || statusByTab.stores) => {
  Invoices.value = []
  loadingList.value = true
  apiFetch('/invoices/indexByUser', { conditions: { status } })
    .then((response) => {
      if (response.code === 2000) {
        const items = response.Invoices || response.invoices || response.data || []
        Invoices.value = Array.isArray(items) ? items : []
      }
    })
    .catch((error) => {
      toast.error(t('error') + ': ' + t(error?.data?.message || error?.message || error))
    })
    .finally(() => {
      loadingList.value = false
    })
}

// لینک صفحه‌ی جزئیات فاکتور؛ تب فعلی هم همراهش می‌ره
const invoiceLink = (item) => ({
  path: `/dashboard/purchaserecords/${item.id}`,
  query: { tab: tab.value }
})

onMounted(() => {
  // کاربری که status اش ۳ هست به سوابق خرید دسترسی نداره
  if (user.value?.status === 3) {
    navigateTo('/dashboard')
    return
  }
  getPurchasesList()
})

watch(tab, (newTab) => {
  // آدرس رو با تب جدید هماهنگ نگه می‌داریم تا دکمه‌ی back مرورگر هم روی تب درست برگرده
  router.replace({ query: { ...route.query, tab: newTab } })
  getPurchasesList(statusByTab[newTab] || statusByTab.stores)
})

const isReturnedTab = computed(() => tab.value === 'returned_invoices')

const summaryStats = computed(() => {
  const list = Invoices.value || []
  const total = list.length
  const completed = list.filter((item) => [6, 11].includes(item.status)).length
  const pending = list.filter((item) => [2, 3, 4, 5, 8].includes(item.status)).length
  const special = tab.value === 'returned_invoices'
    ? list.filter((item) => [9, 10, 11, 12].includes(item.status)).length
    : list.filter((item) => item.status === 7).length

  return [
    { label: tab.value === 'stores' ? 'کل سفارش‌ها' : tab.value === 'invoices' ? 'کل فاکتورها' : tab.value === 'returned_invoices' ? 'کل مرجوعی‌ها' : 'کل لغوشده‌ها', value: total, tone: 'from-purple-500 to-blue-600' },
    { label: 'تکمیل‌شده', value: completed, tone: 'from-emerald-500 to-teal-600' },
    { label: 'درحال بررسی', value: pending, tone: 'from-amber-500 to-orange-600' },
    { label: tab.value === 'returned_invoices' ? 'مرجوعی' : 'لغو', value: special, tone: 'from-rose-500 to-pink-600' }
  ]
})

const activeTabConfig = computed(() => tabsConfig.find((c) => c.value === tab.value))
</script>

<template>
  <div class="glass-card rounded-[28px] overflow-hidden" dir="rtl">
    <!-- header -->
    <div class="relative overflow-hidden border-b border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/70 to-purple-950/80 px-4 py-5 sm:px-6 sm:py-6">
      <div class="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-blue-500/10" />
      <div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold text-purple-200">
            <span class="h-2 w-2 rounded-full bg-purple-400" />
            {{ activeTabConfig?.heading }}
          </div>
          <div>
            <h3 class="text-xl font-bold text-white">{{ t('purchase_records') }}</h3>
            <p class="mt-1 text-sm text-slate-400">مشاهده وضعیت سفارش‌ها، فاکتورها و درخواست‌های مرجوعی در یکجا</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div v-for="item in summaryStats" :key="item.label" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <div class="text-[11px] text-slate-400">{{ item.label }}</div>
            <div class="mt-1 text-lg font-bold text-white">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- tabs -->
    <div class="border-b border-white/10 bg-slate-950/20 px-3 py-3 sm:px-6">
      <div class="flex items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1.5 sm:justify-center">
        <button
          v-for="item in tabsConfig"
          :key="item.value"
          type="button"
          class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all"
          :class="tab === item.value
            ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'"
          @click="tab = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- tab panel -->
    <div class="p-4 sm:p-6">
      <div class="mb-4 flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-3 py-2.5 text-sm font-semibold text-purple-200">
        <span class="h-2.5 w-2.5 rounded-full bg-purple-400" />
        {{ activeTabConfig?.heading }}
      </div>

      <!-- mobile cards -->
      <div class="max-h-105 overflow-y-auto scrollbar-thin pb-2 sm:hidden">
        <div v-if="loadingList" class="flex justify-center py-8">
          <Loader2 class="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <template v-else>
          <div v-for="c in Invoices" :key="c.id" class="mb-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-lg shadow-black/20">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'شماره سفارش مرجوعی' : 'شماره سفارش' }}</span>
              <span class="text-sm text-gray-200">{{ c.id }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'شماره فاکتور مرجوعی' : 'شماره فاکتور' }}</span>
              <span class="text-sm text-gray-200">{{ getInvoiceCode(c) }}</span>
            </div>
            <div v-if="isReturnedTab" class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">شماره فاکتور مرجع</span>
              <span class="text-sm text-gray-200">{{ c.return_from_invoice_id ?? '---' }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ t('status') }}</span>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(c.status)">{{ getStatusText(c) }}</span>
            </div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'تاریخ درخواست مرجوعی' : t('date') }}</span>
              <span class="text-sm text-gray-200">{{ getInvoicePrimaryDate(c) }}</span>
            </div>
            <div v-if="!isReturnedTab" class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ t('presenter') }}</span>
              <span class="text-sm text-gray-200">{{ c.presenter_full_name ?? '---' }}</span>
            </div>
            <div v-if="!isReturnedTab" class="mb-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ t('discount') }}</span>
              <span class="text-sm text-gray-200">
                {{ (c.discount_price + c.other_price) !== 0 ? numberWithSeparator(c.discount_price + c.other_price) + ' ' + c.currency_name : '---' }}
              </span>
            </div>
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ c.status_text?.includes('return') ? 'مبلغ کل قابل استرداد' : t('total_price') }}</span>
              <span class="text-sm font-semibold text-white">{{ numberWithSeparator(c.total_price) }} {{ c.currency_name }}</span>
            </div>
            <NuxtLink
              :to="invoiceLink(c)"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              جزئیات
            </NuxtLink>
          </div>
          <div v-if="!loadingList && Invoices.length === 0" class="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-sm text-gray-400">
            موردی برای نمایش وجود ندارد
          </div>
        </template>
      </div>

      <!-- desktop table -->
      <div class="hidden sm:block">
        <div v-if="loadingList" class="space-y-2">
          <div v-for="n in 6" :key="n" class="h-10 w-full animate-pulse rounded-lg bg-white/5" />
        </div>
        <div v-else-if="Invoices.length > 0" class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/30">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/10 text-gray-400 text-right">
                <th class="whitespace-nowrap px-4 py-3 font-medium">{{ isReturnedTab ? 'شماره سفارش مرجوعی' : 'شماره سفارش' }}</th>
                <th class="whitespace-nowrap px-4 py-3 font-medium">{{ isReturnedTab ? 'شماره فاکتور مرجوعی' : 'شماره فاکتور' }}</th>
                <th v-if="isReturnedTab" class="whitespace-nowrap px-4 py-3 font-medium">شماره فاکتور مرجع</th>
                <th class="px-4 py-3 font-medium">{{ t('status') }}</th>
                <th class="px-4 py-3 font-medium">{{ isReturnedTab ? 'تاریخ درخواست مرجوعی' : t('date') }}</th>
                <th v-if="!isReturnedTab" class="px-4 py-3 font-medium">{{ t('presenter') }}</th>
                <th v-if="!isReturnedTab" class="px-4 py-3 font-medium">{{ t('discount') }}</th>
                <th class="px-4 py-3 font-medium">{{ isReturnedTab ? 'مبلغ قابل استرداد' : t('total_price') }}</th>
                <th class="w-8 px-4 py-3 font-medium">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in Invoices" :key="i" class="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td class="px-4 py-3 text-gray-200">{{ item.id }}</td>
                <td class="px-4 py-3 text-gray-300">{{ getInvoiceCode(item) }}</td>
                <td v-if="isReturnedTab" class="px-4 py-3 text-gray-300">{{ item.return_from_invoice_id ?? '----' }}</td>
                <td class="whitespace-nowrap px-4 py-3">
                  <span class="rounded-full px-2.5 py-0.5 text-xs font-medium border" :class="getStatusBadgeClass(item.status)">{{ getStatusText(item) }}</span>
                </td>
                <td class="px-4 py-3 text-gray-400">{{ getInvoicePrimaryDate(item) }}</td>
                <td v-if="!isReturnedTab" class="whitespace-nowrap px-4 py-3 text-gray-300">{{ item.presenter_full_name ?? '----' }}</td>
                <td v-if="!isReturnedTab" class="px-4 py-3 text-gray-300">{{ numberWithSeparator(item.discount_price + item.other_price) }}</td>
                <td class="px-4 py-3 text-gray-200 font-medium">{{ numberWithSeparator(item.total_price) }} {{ item.currency_name }}</td>
                <td class="px-4 py-3">
                  <NuxtLink :to="invoiceLink(item)" class="inline-flex items-center gap-1.5 text-purple-300 hover:text-purple-200 transition-colors">
                    <Eye class="w-4 h-4" />
                    مشاهده
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-sm text-gray-400">
          موردی برای نمایش وجود ندارد
        </div>
      </div>
    </div>
  </div>
</template>