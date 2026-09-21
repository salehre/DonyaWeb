<script setup>
import { computed, ref } from 'vue'
import {
  User, AtSign, MessageSquare, Clock, Instagram, Twitter, Linkedin, Send
} from 'lucide-vue-next'

const departments = [
  { value: 'sales', label: 'فروش و سفارش‌ها' },
  { value: 'support', label: 'پشتیبانی فنی' },
  { value: 'billing', label: 'مالی و صورت‌حساب' },
  { value: 'other', label: 'سایر موارد' }
]

const departmentOptions = computed(() => departments)

const name = ref('')
const email = ref('')
const department = ref('sales')
const message = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)
const toast = useToast()

async function handleSubmit() {
  if (!name.value || !email.value || !message.value) {
    toast.error('لطفاً نام، ایمیل و پیام خود را وارد کنید')
    return
  }

  isSubmitting.value = true
  try {
    // TODO: اتصال به API واقعی ارسال پیام
    await new Promise((resolve) => setTimeout(resolve, 1000))
    submitted.value = true
    toast.success('پیام شما با موفقیت ارسال شد.')
  } finally {
    isSubmitting.value = false
  }
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

        <form v-else class="space-y-5" @submit.prevent="handleSubmit">
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
                >
              </div>
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
                >
              </div>
            </div>
          </div>

          <div>
            <label for="department" class="block text-sm text-gray-300 mb-2">موضوع پیام</label>
            <StartCustomSelect
              id="department"
              v-model="department"
              :options="departmentOptions"
              placeholder="انتخاب موضوع"
            />
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
              ></textarea>
            </div>
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
          <p class="text-gray-400 text-sm leading-relaxed mb-4">خیابان ولیعصر ، بالاتر ار پارک وی ،خیابان فیاضی ،پلاک 148 ،طبقه دوم</p>
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
