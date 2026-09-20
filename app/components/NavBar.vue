<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Menu, X, ShoppingCart } from 'lucide-vue-next'

const scrolled = ref(false)
const mobileOpen = ref(false)
const route = useRoute()
const { itemCount } = useCart()

// همون کوکی‌ای که موقع ورود موفق در صفحه‌ی لاگین ست می‌شه
const authToken = useCookie('donyaweb_auth_token')
const isLoggedIn = computed(() => !!authToken.value)

function handleScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

const navLinks = [
  { to: '/cloudhosting', label: 'هاست ابری' },
  { to: '/vps', label: 'VPS' },
  // { to: '/dedicatedserver', label: 'سرور اختصاصی' },
  { to: '/domain', label: 'دامنه' },
  { to: '/support', label: 'پشتیبانی' },
  { to: '/about-us', label: 'درباره ما' },
  { to: '/contact-us', label: 'تماس با ما' }
]
</script>

<template>
  <nav
    class="fixed w-full z-50 top-0 border-b border-white/10 transition-all"
    :class="scrolled ? 'glass-strong' : 'glass'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-20 flex items-center justify-center">
            <NuxtImg src="/logo.png" cover />
          </div>
          <span class="text-2xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">دنیاوب</span>
        </NuxtLink>

        <div class="hidden md:flex items-center gap-8">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-gray-300 hover:text-white transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <NuxtLink to="/cart" class="relative w-10 h-10 rounded-full glass flex items-center justify-center shrink-0 hover:bg-white/20 transition-all">
            <ShoppingCart class="w-5 h-5" />
            <span
              v-if="itemCount > 0"
              class="absolute -top-1 -left-1 min-w-4.5 h-4.5 px-1 rounded-full bg-linear-to-r from-purple-500 to-blue-500 text-[10px] font-bold flex items-center justify-center"
            >
              {{ itemCount }}
            </span>
          </NuxtLink>
          <NuxtLink
            :to="isLoggedIn ? '/dashboard' : '/login'"
            class="hidden md:block px-6 py-2 rounded-full glass hover:bg-white/20 transition-all"
          >
            {{ isLoggedIn ? 'پنل کاربری' : 'ورود' }}
          </NuxtLink>
          <NuxtLink to="/start" class="px-4 sm:px-6 py-2 rounded-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/30 text-sm sm:text-base">
            شروع کنید
          </NuxtLink>

          <button
            type="button"
            class="md:hidden w-10 h-10 rounded-full glass flex items-center justify-center shrink-0"
            :aria-expanded="mobileOpen"
            aria-label="باز کردن منو"
            @click="mobileOpen = !mobileOpen"
          >
            <X v-if="mobileOpen" class="w-5 h-5" />
            <Menu v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-150"
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileOpen" class="md:hidden glass-strong border-t border-white/10">
        <div class="px-4 sm:px-6 py-4 flex flex-col gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
          <NuxtLink
            :to="isLoggedIn ? '/dashboard' : '/login'"
            class="px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            {{ isLoggedIn ? 'پنل کاربری' : 'ورود' }}
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </nav>
</template>