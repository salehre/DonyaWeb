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

console.log(user.value)

const { data, refresh, pending, error } = await useFetch(`${config.public.apiBase}/tickets/indexByUserId`, {
  method: 'POST',
  headers,
  body: {
    status: "1,2,3,4,5,6"
  },
})

const tickets = computed(() => data.value?.Tickets ?? [])

const { stats, getExpiringServices } = useDashboard()

const expiringServices = getExpiringServices()
// const recentTickets = getRecentTickets()
const recentTickets = computed(() =>
  tickets.value
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime()
    )
    .slice(0, 5)
)
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome -->
    <div class="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold mb-1">سلام {{ user?.full_name?.split(' ')[0] || user?.first_name || '' }}، خوش برگشتی 👋</h2>
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
  </div>
</template>