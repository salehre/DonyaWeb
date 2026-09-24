<script setup>
import { Server, Clock3, Receipt, MessageSquare, Plus, TicketPlus, AlertTriangle } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

useHead({
  title: 'داشبورد | دنیاوب'
})
const { toJalaliDate } = useJalaliDate()

const { user } = useUserInfo()
const config = useRuntimeConfig()
const headers = useApiHeaders();

const tickets = ref([])
const pending = ref(true)
const error = ref(null)
const stats = reactive({
  activeServices: 0,
  expiringServices: 0,
  pendingInvoices: 0,
  openTickets: 0,
})
const expiringServices = ref([])

function getListFromResponse(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.Tickets)) return response.Tickets
  if (Array.isArray(response?.tickets)) return response.tickets
  if (Array.isArray(response?.Invoices)) return response.Invoices
  if (Array.isArray(response?.invoices)) return response.invoices
  if (Array.isArray(response?.data)) return response.data
  return []
}

function isOpenTicket(item) {
  const status = String(item?.status ?? item?.status_text ?? '').trim().toLowerCase()
  const statusId = Number(item?.status ?? item?.status_id)

  return statusId === 1 || status === 'open' || status.includes('open') || status === 'باز' || status.includes('باز')
}

function isPendingInvoice(item) {
  const status = Number(item?.status ?? item?.status_id ?? 0)
  const statusText = String(item?.status_text ?? '').trim().toLowerCase()

  return [2, 3, 4, 5, 8].includes(status)
    || statusText.includes('pending')
    || statusText.includes('await')
    || statusText.includes('در حال')
    || statusText.includes('انتظار')
}

onMounted(async () => {
  try {
    const [ticketResult, invoiceResult, paidInvoiceResult] = await Promise.all([
      $fetch(`${config.public.apiBase}/tickets/indexByUserId`, {
        method: 'POST',
        headers: headers.value,
        body: {
          status: '1,2,3,4,5,6',
        },
      }),
      $fetch(`${config.public.apiBase}/invoices/indexByUser`, {
        method: 'POST',
        headers: headers.value,
        body: {
          conditions: { status: [2, 3, 4, 5, 8] },
        },
      }),
      // فاکتورهای پرداخت‌شده (همراه با آیتم‌ها) → سرویس‌های کاربر
      $fetch(`${config.public.apiBase}/invoices/indexByUser`, {
        method: 'POST',
        headers: headers.value,
        body: {
          conditions: { status: [6] },
          with_detail: true,
        },
      }),
    ])

    const ticketList = getListFromResponse(ticketResult)
    const invoiceList = getListFromResponse(invoiceResult)

    tickets.value = ticketList
    stats.openTickets = ticketList.filter(isOpenTicket).length
    stats.pendingInvoices = invoiceList.filter(isPendingInvoice).length

    const serviceList = servicesFromInvoices(getListFromResponse(paidInvoiceResult))
    const needAttention = serviceList.filter((s) => s.status === 'expiring')
    stats.activeServices = serviceList.filter((s) => s.status === 'active').length
    stats.expiringServices = needAttention.length
    expiringServices.value = needAttention.slice(0, 3)
  } catch (err) {
    error.value = err
    console.error('Dashboard stats fetch error:', err)
    stats.activeServices = 0
    stats.expiringServices = 0
    stats.pendingInvoices = 0
    stats.openTickets = 0
  } finally {
    pending.value = false
  }
})

const recentTickets = computed(() =>
  tickets.value
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
        new Date(a.updated_at ?? a.created_at ?? 0).getTime()
    )
    .slice(0, 5)
)
</script>

<template>
  <div class="space-y-8">
    <div v-if="pending" class="space-y-8 animate-pulse" aria-label="در حال بارگذاری داشبورد" aria-busy="true">
      <div class="glass-card rounded-3xl p-6 sm:p-8 space-y-3">
        <div class="h-7 w-64 max-w-full rounded-lg bg-white/10" />
        <div class="h-4 w-80 max-w-full rounded bg-white/10" />
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div v-for="index in 4" :key="index" class="glass-card rounded-2xl p-5 space-y-4">
          <div class="h-11 w-11 rounded-xl bg-white/10" />
          <div class="h-4 w-24 rounded bg-white/10" />
          <div class="h-7 w-16 rounded bg-white/10" />
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <div v-for="panel in 2" :key="panel" class="glass-card rounded-3xl p-6 space-y-5">
          <div class="flex items-center justify-between">
            <div class="h-5 w-32 rounded bg-white/10" />
            <div class="h-4 w-20 rounded bg-white/10" />
          </div>
          <div v-for="row in 3" :key="row" class="h-14 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>

    <template v-else>
    <!-- Welcome -->
    <div class="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold mb-1">سلام {{ user?.full_name?.split(' ')[0] || user?.first_name || '' }}، خوش برگشتی </h2>
        <p class="text-gray-400 text-sm">خلاصه‌ای از وضعیت سرویس‌ها و حساب کاربری‌ات</p>
      </div>
<!--      <NuxtLink-->
<!--        to="/start"-->
<!--        class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 shrink-0"-->
<!--      >-->
<!--        <Plus class="w-5 h-5" />-->
<!--        خرید سرویس جدید-->
<!--      </NuxtLink>-->
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <DashboardStatCard :icon="Server" label="سرویس فعال" :value="stats.activeServices" color="from-purple-500 to-blue-600" />
      <DashboardStatCard :icon="Clock3" label="در حال انقضا" :value="stats.expiringServices" color="from-yellow-500 to-orange-500" />
      <NuxtLink
        to="/dashboard/purchaserecords"
        class="block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
        aria-label="مشاهده فاکتورهای در انتظار پرداخت"
      >
        <DashboardStatCard :icon="Receipt" label="فاکتور در انتظار" :value="stats.pendingInvoices" color="from-pink-500 to-purple-600" />
      </NuxtLink>
      <DashboardStatCard :icon="MessageSquare" label="تیکت باز" :value="stats.openTickets" color="from-blue-500 to-purple-600" />
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Renewal alerts -->
      <div class="glass-card rounded-3xl p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-yellow-400" />
            نیاز به توجه
          </h3>
          <NuxtLink to="/dashboard/services" class="text-sm text-purple-300 hover:text-purple-200 transition-colors">مشاهده همه</NuxtLink>
        </div>

        <div v-if="expiringServices.length" class="space-y-3">
          <div
            v-for="s in expiringServices"
            :key="s.id"
            class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5"
          >
            <div class="min-w-0">
              <p class="font-medium text-sm truncate">{{ s.name }}</p>
              <p class="text-xs text-gray-500" dir="ltr">{{ s.identifier }}</p>
            </div>
            <DashboardStatusBadge :status="s.status" />
          </div>
        </div>
        <p v-else class="text-gray-400 text-sm text-center py-6">همه‌چیز مرتبه! سرویسی نیاز به توجه فوری نداره.</p>
      </div>

      <!-- Recent tickets -->
      <div class="glass-card rounded-3xl p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold flex items-center gap-2">
            <MessageSquare class="w-5 h-5 text-blue-400" />
            آخرین تیکت‌ها
          </h3>
          <NuxtLink to="/dashboard/tickets/new" class="text-sm text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-1">
            <TicketPlus class="w-4 h-4" />
            تیکت جدید
          </NuxtLink>
        </div>

        <div class="space-y-3">
          <NuxtLink
            v-for="t in recentTickets"
            :key="t.id"
            :to="`/dashboard/tickets/${t.id}`"
            class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <div class="min-w-0">
              <p class="font-medium text-sm truncate">
                {{ t.title }}
              </p>

              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-500">
                  {{ t.department_title }}
                </span>

                <span class="text-xs text-gray-600">•</span>

                <span class="text-xs text-gray-500">
                  {{ toJalaliDate(t.created_at) }}
                </span>
              </div>
            </div>

            <DashboardStatusBadge :status="t.status_text" />
          </NuxtLink>

          <div
            v-if="!pending && !recentTickets.length"
            class="text-center text-gray-500 py-8"
          >
            هنوز تیکتی ثبت نشده است.
          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>