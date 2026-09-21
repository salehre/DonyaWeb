<script setup>
import { computed, ref, onMounted } from 'vue'
import { ArrowRight, Send, Paperclip } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const config = useRuntimeConfig()
const headers = useApiHeaders()
const { user } = useUserInfo()
const toast = useToast()
const { uploadTicketFiles, textToHtml, isApiSuccess, apiErrorMessage } = useTicketApi()
const isDev = import.meta.dev

const ticketInfo = ref(null)
const details = ref([])
const ticketPending = ref(true)
const ticketError = ref(null)

const reply = ref('')
const replyAttachments = ref([])
const isSending = ref(false)

// --- دریافت تیکت: مطابق پروژه‌ی Vuetify → body: { ticketID, direction: 'asc' }، پاسخ: Ticket + TicketDetail ---

async function loadTicket() {
  const result = await $fetch(`${config.public.apiBase}/tickets/show`, {
    method: 'POST',
    headers: headers.value,
    body: {
      ticketID: Number(route.params.id),
      direction: 'asc',
    },
  })

  if (!result?.Ticket) {
    console.error('tickets/show response:', result)
    throw new Error(apiErrorMessage(result, 'تیکت پیدا نشد'))
  }

  ticketInfo.value = result.Ticket
  details.value = Array.isArray(result.TicketDetail) ? result.TicketDetail : []
}

onMounted(async () => {
  try {
    await loadTicket()
  } catch (error) {
    ticketError.value = error
    console.error('ticket fetch error:', error, error?.data)
  } finally {
    ticketPending.value = false
  }
})

// --- نمایش ---

const priorityLabels = {
  low: 'کم',
  normal: 'عادی',
  high: 'فوری',
}

const yellow = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
const red = 'bg-red-500/10 text-red-400 border-red-500/30'
const green = 'bg-green-500/10 text-green-400 border-green-500/30'
const gray = 'bg-gray-500/10 text-gray-400 border-gray-500/30'

// رنگ‌ها مطابق getStatusColor پروژه‌ی Vuetify؛ برچسب‌های فارسی معادل کلیدهای وضعیت هستند
const statusMeta = {
  created: { label: 'ثبت‌شده', class: yellow },
  pending: { label: 'در انتظار بررسی', class: yellow },
  processing: { label: 'در حال بررسی', class: yellow },
  operator_reply: { label: 'پاسخ کارشناس', class: red },
  user_reply: { label: 'پاسخ شما', class: yellow },
  awaiting_user_reply: { label: 'در انتظار پاسخ شما', class: red },
  completed: { label: 'بسته‌شده', class: green },
  unknown: { label: 'نامشخص', class: gray },
}

// زمان‌ها در دیتابیس UTC هستند (پروژه‌ی Vuetify هم ۳:۳۰ اضافه می‌کرد) → نمایش به وقت تهران
const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Tehran',
})

function formatDate(value) {
  if (!value) return ''

  const raw = String(value).trim().replace(' ', 'T')
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(raw)
  const date = new Date(hasZone ? raw : `${raw}Z`)

  return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date)
}

const ticket = computed(() => {
  const t = ticketInfo.value
  if (!t) return null

  const status = t.status_text ?? 'unknown'

  return {
    id: t.id ?? route.params.id,
    subject: t.title ?? 'تیکت بدون عنوان',
    department: t.department_title ?? '—',
    product: t.product_title_fa ?? '',
    priority: priorityLabels[t.priority_text] ?? '',
    status,
    statusMeta: statusMeta[status] ?? { label: status, class: gray },
    created: formatDate(t.created_at),
  }
})

useHead({
  title: computed(() => (ticket.value ? `${ticket.value.subject} | دنیاوب` : 'تیکت | دنیاوب')),
})

const ticketErrorText = computed(() => {
  const error = ticketError.value
  if (!error) return ''
  return error?.data?.message || error?.message || String(error)
})

// type: ۱ کاربر، ۲ کارشناس، ۶ نماینده
function isOwn(detail) {
  return Number(detail?.type) === 1
}

function authorName(detail) {
  if (isOwn(detail)) {
    const u = user?.value
    return u?.full_name || `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() || 'شما'
  }

  const name = `${detail?.operator_first_name ?? ''} ${detail?.operator_last_name ?? ''}`.trim()
  return name || (Number(detail?.type) === 6 ? 'نماینده' : 'کارشناس')
}

function authorRole(detail) {
  const type = Number(detail?.type)
  if (type === 2) return 'کارشناس'
  if (type === 6) return 'نماینده'
  return ''
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
}

function fileName(file) {
  return String(file?.file ?? '').split('/').pop() || 'فایل'
}

// --- ارسال پاسخ: tickets/createReply → پاسخ شامل Ticket و TicketDetail (به‌ترتیب نزولی) ---

async function sendReply() {
  if (!reply.value.trim() || !ticketInfo.value) return

  isSending.value = true

  try {
    const ticketFiles = await uploadTicketFiles(replyAttachments.value)

    const replyRes = await $fetch(`${config.public.apiBase}/tickets/createReply`, {
      method: 'POST',
      headers: headers.value,
      body: {
        ticketID: ticketInfo.value.id,
        description: textToHtml(reply.value),
        type: 1,
        ticket_files: ticketFiles,
      },
    })

    if (!isApiSuccess(replyRes)) {
      console.error('Reply response:', replyRes)
      throw new Error(apiErrorMessage(replyRes, 'ارسال پاسخ ناموفق بود'))
    }

    if (replyRes.Ticket && Array.isArray(replyRes.TicketDetail)) {
      // مثل پروژه‌ی Vuetify: پاسخ createReply را برعکس می‌کنیم تا قدیمی‌ترین پیام بالا باشد
      ticketInfo.value = replyRes.Ticket
      details.value = [...replyRes.TicketDetail].reverse()
    } else {
      await loadTicket()
    }

    reply.value = ''
    replyAttachments.value = []
    toast.success('پاسخ شما با موفقیت ارسال شد.')
  } catch (error) {
    console.error('Reply error:', error, error?.data)
    toast.error(apiErrorMessage(error, 'ارسال پاسخ با مشکل مواجه شد.'))
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div v-if="ticketPending" class="max-w-3xl mx-auto py-10 text-center text-gray-400">
    در حال بارگذاری تیکت...
  </div>

  <div v-else-if="!ticket" class="max-w-3xl mx-auto py-10 text-center space-y-2">
    <p class="text-red-400">تیکت مورد نظر پیدا نشد.</p>
    <p v-if="isDev && ticketErrorText" class="text-xs text-gray-500" dir="ltr">{{ ticketErrorText }}</p>
  </div>

  <div v-else class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <NuxtLink to="/dashboard/tickets" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowRight class="w-4 h-4" />
        بازگشت به تیکت‌ها
      </NuxtLink>

      <span
        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap"
        :class="ticket.statusMeta.class"
      >
        {{ ticket.statusMeta.label }}
      </span>
    </div>

    <div class="glass-card rounded-3xl p-6 sm:p-8">
      <h1 class="text-xl sm:text-2xl font-bold mb-2">{{ ticket.subject }}</h1>
      <p class="text-sm text-gray-500">
        <span dir="ltr">#{{ ticket.id }}</span>
        · {{ ticket.department }}
        <template v-if="ticket.product"> · {{ ticket.product }}</template>
        <template v-if="ticket.priority"> · اولویت: {{ ticket.priority }}</template>
        <template v-if="ticket.created"> · ثبت شده در {{ ticket.created }}</template>
      </p>
    </div>

    <div class="space-y-4">
      <div
        v-for="(d, i) in details"
        :key="d.id ?? i"
        class="flex gap-4"
        :class="isOwn(d) ? 'flex-row-reverse' : ''"
      >
        <div
          class="w-10 h-10 rounded-full bg-linear-to-br flex items-center justify-center text-xs font-bold shrink-0"
          :class="isOwn(d) ? 'from-purple-500 to-blue-600' : 'from-pink-500 to-purple-600'"
        >
          {{ initials(authorName(d)) }}
        </div>

        <div class="glass-card rounded-2xl p-5 max-w-[80%]" :class="isOwn(d) ? 'rounded-tl-sm' : 'rounded-tr-sm'">
          <div class="flex items-center justify-between gap-4 mb-2">
            <span class="font-medium text-sm">
              {{ authorName(d) }}
              <span v-if="authorRole(d)" class="text-xs text-gray-500"> ({{ authorRole(d) }})</span>
            </span>
            <span class="text-xs text-gray-500">{{ formatDate(d.created_at) }}</span>
          </div>

          <!-- توضیحات از API به‌صورت HTML می‌آید (مثل پروژه‌ی Vuetify) -->
          <div class="ticket-html text-gray-300 text-sm leading-relaxed" v-html="d.description" />

          <div v-if="d.ticket_files && d.ticket_files.length" class="mt-3 flex flex-wrap gap-2">
            <a
              v-for="(f, fi) in d.ticket_files"
              :key="fi"
              :href="f.file"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:border-purple-500/40 transition-all"
            >
              <Paperclip class="w-3.5 h-3.5 text-purple-400" />
              <span dir="ltr">{{ fileName(f) }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="ticket.status !== 'completed'" class="glass-card rounded-3xl p-6">
      <label for="reply" class="block text-sm text-gray-300 mb-2">پاسخ شما</label>
      <textarea
        id="reply"
        v-model="reply"
        rows="4"
        placeholder="پاسخ خود را بنویسید..."
        class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none resize-none mb-4"
      ></textarea>
      <div class="mb-4">
        <DashboardFileAttachInput v-model="replyAttachments" />
      </div>
      <button
        type="button"
        :disabled="isSending || !reply.trim()"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
        @click="sendReply"
      >
        <Send class="w-4 h-4" />
        {{ isSending ? 'در حال ارسال...' : 'ارسال پاسخ' }}
      </button>
    </div>
    <div v-else class="text-center text-gray-500 text-sm py-4">
      این تیکت بسته شده است. برای پیگیری، یک تیکت جدید ثبت کنید.
    </div>
  </div>
</template>

<style scoped>
.ticket-html :deep(p) {
  margin: 0 0 0.5rem;
}

.ticket-html :deep(p:last-child) {
  margin-bottom: 0;
}

.ticket-html :deep(ul),
.ticket-html :deep(ol) {
  margin: 0 0 0.5rem;
  padding-inline-start: 1.25rem;
}

.ticket-html :deep(ul) {
  list-style: disc;
}

.ticket-html :deep(ol) {
  list-style: decimal;
}

.ticket-html :deep(a) {
  color: #c4b5fd;
  text-decoration: underline;
}
</style>