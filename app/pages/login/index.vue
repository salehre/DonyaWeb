<script setup>
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'
import { ref } from 'vue'

useHead({
  title: 'ورود | دنیاوب'
})

definePageMeta({
  layout: "auth",
});

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const isLoading = ref(false)
const toast = useToast()


const config = useRuntimeConfig()
const baseUrl = config.public.apiBase

async function handleLogin() {
  if (!email.value || !password.value) {
    toast.error('لطفاً ایمیل و رمز عبور را وارد کنید')
    return
  }

  const headers = useApiHeaders()

  isLoading.value = true
  try {
    const response = await $fetch(`${baseUrl}/auth/loginEmail`, {
      method: 'POST',
      headers: headers.value,
      body: {
        email: email.value,
        password: password.value
      }
    })

    if(response.code === 2000) {
      // TODO: بسته به ساختار واقعی پاسخ API این بخش را تنظیم کنید.
      const token = response?.token
      if (token) {
        const authToken = useCookie('donyaweb_auth_token', {
          maxAge: rememberMe.value ? 60 * 60 * 24 * 30 : undefined,
          sameSite: 'lax'
        })
        authToken.value = token

        // اطلاعات کاربر اینجا ذخیره نمی‌شود؛ middleware/auth.global.js سر اولین
        // ورود به داشبورد از /users/userInfo می‌گیرد و در localStorage ذخیره می‌کند.
      }
  
      toast.success('ورود با موفقیت انجام شد.')
      await navigateTo('/dashboard')
      return
    }

    if(response.code === 2002) {
      toast.error('ایمیل یا رمز عبور اشتباه است.')
      return
    }

  } catch (err) {
    const message = err?.data?.message || err?.data?.error || 'خطایی رخ داده چند لحظه بعد دوباره امتحان کنید'
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex justify-center">
    <div class="w-full max-w-md relative z-10">
      <div class="glass-card rounded-3xl p-8 md:p-10 shadow-2xl">
        <div class="flex flex-col items-center mb-8">
          <NuxtLink to="/" class="flex items-center justify-center mb-4 w-30">
            <NuxtImg src="/logo.png" cover />
          </NuxtLink>

          <h1 class="text-2xl font-bold mb-1">ورود به حساب کاربری</h1>
          <p class="text-gray-400 text-sm">به دنیاوب خوش آمدید</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm text-gray-300 mb-2">ایمیل</label>
            <div class="relative">
              <Mail class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="example@email.com"
                class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
              >
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-sm text-gray-300">رمز عبور</label>
              <NuxtLink to="/forgot-password" tabindex="-1" class="text-xs text-purple-300 hover:text-purple-200 transition-colors">فراموشی رمز عبور؟</NuxtLink>
            </div>
            <div class="relative">
              <Lock class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full pr-12 pl-12 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
              >
              <button
                type="button"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 hover:text-gray-200 transition-colors"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <p class="text-sm text-gray-400">
            با ورود، با قوانین و مقررات دنیاوب موافقت می‌کنید.
          </p>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'در حال ورود...' : 'ورود' }}
          </button>
        </form>

        <!-- <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-white/10"></div>
          <span class="text-xs text-gray-500">یا</span>
          <div class="flex-1 h-px bg-white/10"></div>
        </div>

        <p class="text-center text-sm text-gray-400">
          حساب کاربری ندارید؟
          <NuxtLink to="/register" class="text-purple-300 hover:text-purple-200 font-medium transition-colors">ثبت‌نام کنید</NuxtLink>
        </p> -->
      </div>
    </div>
  </section>
</template>