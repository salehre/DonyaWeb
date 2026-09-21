<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { ArrowRight, Send } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'تیکت جدید | دنیاوب'
})

const config = useRuntimeConfig()
const headers = useApiHeaders()
// برای آپلود فایل نباید Content-Type دستی ست شود؛ مرورگر خودش multipart + boundary را می‌سازد
const uploadHeaders = useApiHeaders('')
const toast = useToast()

const departments = ref<any[]>([])
const departmentsPending = ref(true)

onMounted(async () => {
  try {
    const result: any = await $fetch(`${config.public.apiBase}/tickets/indexDepartments`, {
      method: 'POST',
      headers: headers.value,
    })

    departments.value = result && (result.TicketDepartments || result.ticketDepartments) ? (result.TicketDepartments || result.ticketDepartments) : []
  } catch (error) {
    console.error('Departments fetch error:', error)
  } finally {
    departmentsPending.value = false
  }
})

// value رشته است چون StartCustomSelect مقدار modelValue را String و با === مقایسه می‌کند
const departmentOptions = computed(() =>
  departments.value.map((item: any) => ({
    value: String(item.id),
    label: item.title ?? item.name,
  }))
)

const priorities = [
  { value: 'low', label: 'کم' },
  { value: 'normal', label: 'عادی' },
  { value: 'high', label: 'فوری' },
]

const priorityOptions = computed(() => priorities)

function isSuccessResponse(payload: any) {
  if (!payload) return false

  const nested = payload.data ?? payload.result ?? payload.response ?? null
  const code = Number(payload.code ?? nested?.code)
  const status = payload.status ?? nested?.status ?? null

  return (
    code === 2000 ||
    Number(status) === 2000 ||
    status === 'success' ||
    payload.success === true ||
    nested?.success === true ||
    payload.message === 'success' ||
    !!(payload.Ticket || payload.ticket || nested?.Ticket || nested?.ticket)
  )
}

const subject = ref('')
const department = ref('')
const priority = ref('normal')
const message = ref('')
const attachments = ref<File[]>([])
const isSubmitting = ref(false)

watch(
  departmentOptions,
  (options) => {
    if (!department.value && options.length) {
      department.value = String(options[0]?.value ?? '')
    }
  },
  { immediate: true }
)

async function uploadAttachment(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const res: any = await $fetch(`${config.public.apiBase}/uploadImage`, {
    method: 'POST',
    headers: uploadHeaders.value,
    body: formData,
  })

  const list = res?.UploadedImages ?? res?.uploadedImages ?? res?.images
  const uploaded = (Array.isArray(list) ? list[0] : null) ?? res?.image ?? null

  if (!uploaded || !isSuccessResponse(res)) {
    console.error('Upload response:', res)
    throw new Error('خطا در آپلود فایل')
  }

  // همان فرمتی که صفحه‌ی پاسخ به تیکت ([id].vue) می‌فرستد
  return typeof uploaded === 'string' ? { file: uploaded } : uploaded
}

async function handleSubmit() {
  if (!subject.value || !message.value || !department.value) {
    toast.error('لطفاً تمام فیلدهای ضروری را تکمیل کنید.')
    return
  }

  isSubmitting.value = true

  try {
    const ticketFiles: any[] = []

    // آپلود فایل‌ها
    for (const file of attachments.value) {
      ticketFiles.push(await uploadAttachment(file))
    }

    // ثبت تیکت
    const createRes: any = await $fetch(`${config.public.apiBase}/tickets/create`, {
      method: 'POST',
      headers: headers.value,
      body: {
        title: subject.value,
        description: `<p>${message.value}</p>`,
        department: Number(department.value),
        priority: priority.value,
        type: 1,
        product_id: null,
        ticket_files: ticketFiles,
      },
    })

    if (!isSuccessResponse(createRes)) {
      console.error('Create ticket response:', createRes)
      throw new Error('ثبت تیکت ناموفق بود')
    }

    toast.success('تیکت با موفقیت ثبت شد.')

    await navigateTo('/dashboard/tickets')
  } catch (err: any) {
    console.error('Ticket submit error:', err, err?.data)

    const apiMessage = err?.data?.message
    toast.error(
      typeof apiMessage === 'string' && apiMessage
        ? apiMessage
        : err?.name === 'FetchError'
          ? 'خطایی در ثبت تیکت رخ داد.'
          : err?.message || 'خطایی در ثبت تیکت رخ داد.'
    )
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <NuxtLink
      to="/dashboard/tickets"
      class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
    >
      <ArrowRight class="w-4 h-4" />
      بازگشت به تیکت‌ها
    </NuxtLink>

    <div class="glass-card rounded-3xl p-6 sm:p-8">
      <h2 class="text-xl font-bold mb-6">
        ثبت تیکت جدید
      </h2>

      <form
        class="space-y-5"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label
            for="subject"
            class="block text-sm text-gray-300 mb-2"
          >
            موضوع
          </label>

          <input
            id="subject"
            v-model="subject"
            type="text"
            placeholder="مثلاً: مشکل در اتصال به سرور"
            class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
          >
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label
              for="department"
              class="block text-sm text-gray-300 mb-2"
            >
              بخش مربوطه
            </label>

            <StartCustomSelect
              id="department"
              v-model="department"
              :options="departmentOptions"
              :loading="departmentsPending"
              placeholder="انتخاب بخش"
            />
          </div>

          <div>
            <label
              for="priority"
              class="block text-sm text-gray-300 mb-2"
            >
              اولویت
            </label>

            <StartCustomSelect
              id="priority"
              v-model="priority"
              :options="priorityOptions"
              placeholder="انتخاب اولویت"
            />
          </div>
        </div>

        <div>
          <label
            for="message"
            class="block text-sm text-gray-300 mb-2"
          >
            شرح مشکل
          </label>

          <textarea
            id="message"
            v-model="message"
            rows="6"
            placeholder="مشکل خود را با جزئیات شرح دهید..."
            class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none resize-none"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2">
            پیوست فایل (اختیاری)
          </label>

          <DashboardFileAttachInput v-model="attachments" />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || departmentsPending"
          class="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send class="w-4 h-4" />

          {{
            isSubmitting
              ? 'در حال ارسال...'
              : 'ثبت تیکت'
          }}
        </button>
      </form>
    </div>
  </div>
</template>