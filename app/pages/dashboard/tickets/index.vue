<script setup lang="ts">
import { ChevronLeft, TicketPlus } from 'lucide-vue-next'
import { ref, onMounted, computed } from 'vue'

definePageMeta({ layout: 'dashboard' })

const config = useRuntimeConfig()

const headers = useApiHeaders();

const tickets = ref<any[]>([])
const pending = ref(true)
const error = ref<unknown>(null)

onMounted(async () => {
  try {
    const result = await $fetch(`${config.public.apiBase}/tickets/indexByUserId`, {
      method: 'POST',
      headers: headers.value,
      body: {
        status: '1,2,3,4,5,6',
      },
    })

    tickets.value = result && (result.Tickets || result.tickets) ? (result.Tickets || result.tickets) : []
  } catch (err) {
    error.value = err
    console.error('Tickets list fetch error:', err)
  } finally {
    pending.value = false
  }
})

const priorityLabels: Record<string, { label: string; class: string }> = {
  low: { label: 'کم', class: 'text-gray-400' },
  normal: { label: 'عادی', class: 'text-yellow-400' },
  high: { label: 'فوری', class: 'text-red-400' },
}

watch(
  error,
  (err) => {
    if (err) {
      console.error('Tickets list fetch error:', err)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-end">
      <NuxtLink
        to="/dashboard/tickets/new"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm shadow-lg shadow-purple-500/30"
      >
        <TicketPlus class="w-4 h-4" />
        تیکت جدید
      </NuxtLink>
    </div>

    <div class="space-y-3">
      <div v-if="tickets.length" class="space-y-3 mt">
        <NuxtLink
          v-for="t in tickets"
          :key="t.id"
          :to="`/dashboard/tickets/${t.id}`"
          class="glass-card rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover-lift"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-xs text-gray-500">#{{ t.id }}</span>
              <span class="text-xs text-gray-600">·</span>
              <span class="text-xs text-gray-500">
                {{ t.department_title }}
              </span>
            </div>

            <h3 class="font-bold truncate">
              {{ t.title }}
            </h3>

            <p class="text-gray-500 text-xs mt-1">
              {{ t.created_at }}
            </p>
          </div>

          <div
            class="hidden sm:flex items-center gap-2 text-xs font-medium"
            :class="priorityLabels[t.priority_text]?.class"
          >
            اولویت:
            {{ priorityLabels[t.priority_text]?.label }}
          </div>

          <DashboardStatusBadge :status="t.status_text" />

          <ChevronLeft class="w-5 h-5 text-gray-500 shrink-0" />
        </NuxtLink>
      </div>

      <div
        v-else-if="!pending"
        class="glass-card rounded-3xl py-16 px-6 flex flex-col items-center justify-center text-center"
      >
        <div
          class="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-5"
        >
          <TicketPlus class="w-10 h-10 text-purple-400" />
        </div>

        <h3 class="text-xl font-bold mb-2">
          هنوز تیکتی ثبت نکرده‌اید
        </h3>

        <p class="text-gray-400 max-w-md mb-6">
          در حال حاضر هیچ تیکت پشتیبانی برای حساب شما وجود ندارد. اگر سوال یا مشکلی
          دارید، می‌توانید یک تیکت جدید ثبت کنید.
        </p>

        <NuxtLink
          to="/dashboard/tickets/new"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition"
        >
          <TicketPlus class="w-4 h-4" />
          ثبت تیکت جدید
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
