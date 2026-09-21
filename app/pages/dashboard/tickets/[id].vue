<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { ArrowRight, Send, Paperclip } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const config = useRuntimeConfig()
const headers = useApiHeaders()
const { user } = useUserInfo()
const toast = useToast()

const ticketData = ref(null)
const ticketPending = ref(true)
const ticketError = ref(null)

onMounted(async () => {
  try {
    const result = await $fetch(`${config.public.apiBase}/tickets/show`, {
      method: 'POST',
      headers: headers.value,
      body: {
        id: route.params.id,
      },
    })

    ticketData.value = result
  } catch (error) {
    ticketError.value = error
    console.error('ticket fetch error:', error)
  } finally {
    ticketPending.value = false
  }
});

const rawTicket = computed(() => {
  const payload = ticketData.value
  if (!payload) return null
  return payload.Ticket ?? payload.ticket ?? payload.data ?? payload.result ?? null
})

function normalizeMessage(message) {
  return {
    from: message?.from ?? (message?.is_admin ? 'support' : 'user'),
    name: message?.name ?? message?.sender_name ?? message?.user_name ?? 'کاربر',
    text: message?.text ?? message?.message ?? '',
    date: message?.created_at ?? message?.date ?? 'همین الان',
    attachments: Array.isArray(message?.attachments) ? message.attachments : [],
  }
}

function normalizeTicket(ticket) {
  if (!ticket) return null

  const normalizedStatus = String(ticket.status_text ?? ticket.status ?? 'open').toLowerCase()

  return {
    id: ticket.id ?? route.params.id,
    subject: ticket.title ?? ticket.subject ?? 'تیکت بدون عنوان',
    department: ticket.department_title ?? ticket.department ?? '—',
    status: normalizedStatus.includes('closed') ? 'closed' : normalizedStatus.includes('answered') ? 'answered' : normalizedStatus.includes('open') ? 'open' : normalizedStatus || 'open',
    date: ticket.created_at ?? ticket.date ?? 'همین الان',
    messages: Array.isArray(ticket.messages) ? ticket.messages.map(normalizeMessage) : [],
  }
}

const ticket = computed(() => normalizeTicket(rawTicket.value))
const localMessages = ref([])
const reply = ref('')
const replyAttachments = ref([])
const isSending = ref(false)

watch(
  ticket,
  (value) => {
    if (value && !localMessages.value.length) {
      localMessages.value = [...value.messages]
    }
  },
  { immediate: true }
)

watch(
  ticketError,
  (error) => {
    if (error) {
      console.error('ticket fetch error:', error)
    }
  }
);

async function uploadFiles(files) {
  const uploaded = []

  if (!files.length) return uploaded

  for (const file of files) {
    const formData = new FormData()
    formData.append('image', file)

    const uploadRes = await $fetch(`${config.public.apiBase}/uploadImage`, {
      method: 'POST',
      headers: headers.value,
      body: formData,
    })

    const payload = uploadRes
    const code = payload?.code ?? payload?.data?.code
    if (code !== 2000 && payload?.status !== 'success') {
      throw new Error('خطا در آپلود فایل پیوست')
    }

    const image = payload?.UploadedImages?.[0] ?? payload?.uploadedImages?.[0] ?? payload?.image
    if (image) {
      uploaded.push({ file: image })
    }
  }

  return uploaded
}

async function sendReply() {
  if (!reply.value.trim() || !ticket.value) return

  isSending.value = true

  try {
    const uploadedFiles = await uploadFiles(replyAttachments.value)

    const replyRes = await $fetch(`${config.public.apiBase}/tickets/reply`, {
      method: 'POST',
      headers: headers.value,
      body: {
        id: Number(ticket.value.id),
        message: reply.value.trim(),
        ticket_files: uploadedFiles,
      },
    })

    const success = (replyRes && replyRes.code === 2000) || (replyRes && replyRes.status === 'success') || (replyRes && replyRes.success === true)

    if (!success) {
      throw new Error('ارسال پاسخ ناموفق بود')
    }

    const newMessage = {
      from: 'user',
      name: user?.value?.full_name || user?.value?.first_name || 'کاربر',
      text: reply.value.trim(),
      date: 'همین الان',
      attachments: [...replyAttachments.value],
    }

    localMessages.value.push(newMessage)
    reply.value = ''
    replyAttachments.value = []
    toast.success('پاسخ شما با موفقیت ارسال شد.')
  } catch (error) {
    console.error(error)
    toast.error('ارسال پاسخ با مشکل مواجه شد.')
  } finally {
    isSending.value = false
  }
}

function isFileObject(att) {
  return import.meta.client && typeof File !== 'undefined' && att instanceof File
}

function attachmentUrl(att) {
  return isFileObject(att) ? URL.createObjectURL(att) : '#'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} بایت`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`
}

watch(
  ticket,
  (value) => {
    if (value) {
      useHead({
        title: `${value.subject} | دنیاوب`,
      })
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="ticketPending" class="max-w-3xl mx-auto py-10 text-center text-gray-400">
    در حال بارگذاری تیکت...
  </div>

  <div v-else-if="!ticket" class="max-w-3xl mx-auto py-10 text-center text-red-400">
    تیکت مورد نظر پیدا نشد.
  </div>

  <div v-else class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <NuxtLink to="/dashboard/tickets" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowRight class="w-4 h-4" />
        بازگشت به تیکت‌ها
      </NuxtLink>
      <DashboardStatusBadge :status="ticket.status" />
    </div>

    <div class="glass-card rounded-3xl p-6 sm:p-8">
      <h1 class="text-xl sm:text-2xl font-bold mb-2">{{ ticket.subject }}</h1>
      <p class="text-sm text-gray-500">
        <span dir="ltr">{{ ticket.id }}</span> · {{ ticket.department }} · ثبت شده در {{ ticket.date }}
      </p>
    </div>

    <div class="space-y-4">
      <div
        v-for="(m, i) in localMessages"
        :key="i"
        class="flex gap-4"
        :class="m.from === 'user' ? 'flex-row-reverse' : ''"
      >
        <div
          class="w-10 h-10 rounded-full bg-linear-to-br flex items-center justify-center text-xs font-bold shrink-0"
          :class="m.from === 'user' ? 'from-purple-500 to-blue-600' : 'from-pink-500 to-purple-600'"
        >
          {{ m.name.split(' ').map(w => w[0]).join('') }}
        </div>
        <div class="glass-card rounded-2xl p-5 max-w-[80%]" :class="m.from === 'user' ? 'rounded-tl-sm' : 'rounded-tr-sm'">
          <div class="flex items-center justify-between gap-4 mb-2">
            <span class="font-medium text-sm">{{ m.name }}</span>
            <span class="text-xs text-gray-500">{{ m.date }}</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed">{{ m.text }}</p>

          <div v-if="m.attachments && m.attachments.length" class="mt-3 flex flex-wrap gap-2">
            <template v-for="(att, ai) in m.attachments" :key="ai">
              <a
                v-if="isFileObject(att)"
                :href="attachmentUrl(att)"
                :download="att.name"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:border-purple-500/40 transition-all"
              >
                <Paperclip class="w-3.5 h-3.5 text-purple-400" />
                {{ att.name }}
                <span class="text-gray-500" dir="ltr">({{ formatSize(att.size) }})</span>
              </a>
              <span
                v-else
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400"
              >
                <Paperclip class="w-3.5 h-3.5 text-purple-400" />
                {{ att.name }}
                <span class="text-gray-500" dir="ltr">({{ formatSize(att.size) }})</span>
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="ticket.status !== 'closed'" class="glass-card rounded-3xl p-6">
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
