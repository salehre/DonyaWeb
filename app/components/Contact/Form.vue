<script setup>
import { onMounted, ref } from 'vue'
import {
  User, AtSign, MessageSquare, Clock, Instagram, Twitter, Linkedin, Send
} from 'lucide-vue-next'

const name = ref('')
const email = ref('')
const message = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)
const serverError = ref('')
const errors = ref({ name: '', email: '', message: '' })
const toast = useToast()
const config = useRuntimeConfig()
const apiHeaders = useApiHeaders()

const FORM_ID = 1
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
let startTime = 0

onMounted(() => {
  startTime = Date.now()
})

function validateForm() {
  errors.value = { name: '', email: '', message: '' }
  let isValid = true

  if (!name.value.trim()) {
    errors.value.name = 'وارد کردن نام و نام خانوادگی الزامی است'
    isValid = false
  } else if (name.value.trim().length < 3) {
    errors.value.name = 'نام باید حداقل ۳ حرف باشد'
    isValid = false
  }

  if (!email.value.trim()) {
    errors.value.email = 'وارد کردن ایمیل الزامی است'
    isValid = false
  } else if (!EMAIL_REGEX.test(email.value.trim())) {
    errors.value.email = 'ایمیل واردشده معتبر نیست'
    isValid = false
  }

  if (!message.value.trim()) {
    errors.value.message = 'وارد کردن متن پیام الزامی است'
    isValid = false
  } else if (message.value.trim().length < 10) {
    errors.value.message = 'متن پیام باید حداقل ۱۰ حرف باشد'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  serverError.value = ''
  if (!validateForm()) return

  isSubmitting.value = true
  const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
  const payload = {
    formId: FORM_ID,
    status: 1,
    uniqueForm: true,
    duration,
    formResults: {
      1: name.value.trim(),
      2: email.value.trim(),
      3: message.value.trim()
    }
  }

  try {
    const response = await $fetch(`${config.public.apiBase}/forms/createResults`, {
      method: 'POST',
      headers: apiHeaders.value,
      body: payload
    })

    if (Number(response?.code) !== 2000) {
      throw new Error(response?.message || response?.msg || 'ارسال پیام ناموفق بود')
    }

    submitted.value = true
    toast.success('پیام شما با موفقیت ارسال شد.')
  } catch (error) {
    console.error('[Contact] خطا در ارسال فرم:', error)
    serverError.value = 'ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
    toast.error(serverError.value)
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  name.value = ''
  email.value = ''
  message.value = ''
  errors.value = { name: '', email: '', message: '' }
  serverError.value = ''
  submitted.value = false
  startTime = Date.now()
}
</script>

<template>
  <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-24">
    <div class="grid lg:grid-cols-2 gap-10">
      <!-- Contact Form -->
      <div class="glass-card rounded-3xl p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Send class="w-6 h-6 text-purple-400" />
          </div>
          <h2 class="text-xl font-bold">ارسال پیام</h2>
        </div>

        <div v-if="submitted" class="flex flex-col items-center text-center py-10">
          <div class="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <Send class="w-7 h-7 text-green-400" />
          </div>
          <h3 class="text-lg font-bold mb-2">پیام شما ارسال شد</h3>
          <p class="text-gray-400 text-sm mb-6">تیم مربوطه به‌زودی از طریق ایمیل با شما تماس می‌گیرد.</p>
          <button
            type="button"
            class="px-6 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition-all text-sm"
            @click="submitted = false"
          >
            ارسال پیام جدید
          </button>
        </div>

        <form v-else class="space-y-5" novalidate @submit.prevent="handleSubmit">
          <div v-if="serverError" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {{ serverError }}
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label for="contact-name" class="block text-sm text-gray-300 mb-2">نام و نام خانوادگی</label>
              <div class="relative">
                <User class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                <input
                  id="contact-name"
                  v-model="name"
                  type="text"
                  placeholder="نام شما"
                  class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                  :class="errors.name ? 'border-red-500' : ''"
                  @input="errors.name = ''"
                >
              </div>
              <p v-if="errors.name" class="mt-1 text-xs text-red-400">{{ errors.name }}</p>
            </div>

            <div>
              <label for="contact-email" class="block text-sm text-gray-300 mb-2">ایمیل</label>
              <div class="relative">
                <AtSign class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
                <input
                  id="contact-email"
                  v-model="email"
                  type="email"
                  placeholder="example@email.com"
                  class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
                  :class="errors.email ? 'border-red-500' : ''"
                  @input="errors.email = ''"
                >
              </div>
              <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
            </div>
          </div>


          <div>
            <label for="contact-message" class="block text-sm text-gray-300 mb-2">پیام شما</label>
            <div class="relative">
              <MessageSquare class="w-5 h-5 text-gray-400 absolute top-4 right-4" />
              <textarea
                id="contact-message"
                v-model="message"
                rows="5"
                placeholder="پیام خود را اینجا بنویسید..."
                class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none resize-none"
                :class="errors.message ? 'border-red-500' : ''"
                @input="errors.message = ''"
              ></textarea>
            </div>
            <p v-if="errors.message" class="mt-1 text-xs text-red-400">{{ errors.message }}</p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? 'در حال ارسال...' : 'ارسال پیام' }}
          </button>
        </form>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <div class="glass-card rounded-3xl p-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Clock class="w-6 h-6 text-blue-400" />
            </div>
            <h3 class="text-lg font-bold">ساعات کاری</h3>
          </div>
          <ul class="space-y-2 text-gray-400 text-sm">
            <li class="flex justify-between"><span>شنبه تا چهارشنبه</span><span>۹:۰۰ - ۱۸:۰۰</span></li>
            <li class="flex justify-between"><span>پنجشنبه</span><span>۹:۰۰ - ۱۳:۰۰</span></li>
            <li class="flex justify-between"><span>پشتیبانی فنی آنلاین</span><span class="text-green-400">۲۴/۷</span></li>
          </ul>
        </div>

        <!-- <div class="glass-card rounded-3xl p-8">
          <h3 class="text-lg font-bold mb-4">ما را دنبال کنید</h3>
          <div class="flex gap-4">
            <a href="#" class="w-11 h-11 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all">
              <Instagram class="w-5 h-5" />
            </a>
            <a href="#" class="w-11 h-11 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all">
              <Twitter class="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/company/sinatech-dm/" target="_blank" class="w-11 h-11 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all">
              <Linkedin class="w-5 h-5" />
            </a>
          </div>
        </div> -->

        <div class="glass-card rounded-3xl p-8">
          <h3 class="text-lg font-bold mb-2">دفتر مرکزی</h3>
          <p class="text-gray-400 text-sm leading-relaxed mb-4">خیابان ولیعصر، بالاتر از پارک وی، خیابان فیاضی، پلاک 148، طبقه دوم</p>
          <div class="rounded-2xl overflow-hidden border border-white/10 h-40 bg-white/5 flex items-center justify-center text-gray-500 text-sm">
            <NuxtImg class="w-full h-full object-cover" src="/map.png" cover />
          </div>
          <!-- <div class="rounded-2xl overflow-hidden border border-white/10 h-40 bg-white/5 flex items-center justify-center text-gray-500 text-sm">
            نقشه محل دفتر
          </div> -->
        </div>
      </div>
    </div>
  </section>
</template>
