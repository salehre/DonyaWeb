<script setup>
import { ref } from 'vue'
import {
  Phone, Mail, MapPin, Instagram, Twitter, Linkedin, Send,
  ShieldCheck, Clock, Award, Zap, ArrowUp
} from 'lucide-vue-next'

const productLinks = [
  { label: 'هاست ابری', to: '/cloudhosting' },
  { label: 'VPS', to: '/vps' },
  { label: 'سرور اختصاصی', to: '/dedicatedserver' },
  { label: 'ثبت دامنه', to: '/domain' }
]
const supportLinks = [
  { label: 'درباره ما', to: '/about-us' },
  { label: 'ارتباط با ما', to: '/contact-us' },
  { label: 'مرکز آموزش', to: '#' },
  { label: 'وضعیت شبکه', to: '#' },
  { label: 'تماس با ما', to: '/support' },
  { label: 'قوانین خدمات', to: '/terms' },
  { label: 'حریم خصوصی', to: '/privacy' },
  { label: 'تعهدنامه سطح خدمات (SLA)', to: '/sla' }
]

const trustBadges = [
  { icon: Award, label: 'آپتایم ٪۹۹.۹' },
  { icon: Clock, label: 'پشتیبانی ۲۴/۷' },
  { icon: ShieldCheck, label: 'پرداخت امن' },
  { icon: Zap, label: 'فعال‌سازی آنی' }
]

const socialLinks = [
  // { icon: Instagram, label: 'اینستاگرام', href: '#' },
  // { icon: Twitter, label: 'توییتر', href: '#' },
  // { icon: Linkedin, label: 'لینکدین', href: 'https://www.linkedin.com/company/sinatech-dm/' }
]

// فرم عضویت در خبرنامه
const email = ref('')
const isSubmitting = ref(false)
const toast = useToast()

async function handleSubscribe() {
  if (!email.value || !email.value.includes('@')) {
    toast.error('لطفاً یک ایمیل معتبر وارد کنید')
    return
  }
  isSubmitting.value = true
  // TODO: اتصال به API واقعی ثبت ایمیل در خبرنامه
  await new Promise((resolve) => setTimeout(resolve, 700))
  isSubmitting.value = false
  toast.success('عضویت شما در خبرنامه با موفقیت ثبت شد.')
  email.value = ''
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="relative border-t border-white/10 mt-20 glass overflow-hidden">
    <!-- نوار اعتماد -->
    <div class="border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div v-for="b in trustBadges" :key="b.label" class="flex items-center justify-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-linear-to-br from-purple-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center shrink-0">
              <component :is="b.icon" class="w-4.5 h-4.5 text-purple-300" />
            </div>
            <span class="text-sm text-gray-300 font-medium">{{ b.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid md:grid-cols-5 gap-10 mb-10">
        <!-- برند + خبرنامه -->
        <div class="md:col-span-2">
          <NuxtLink to="/" class="flex items-center gap-2 mb-4">
            <div class="flex items-center justify-center w-20">
              <NuxtImg src="/logo.png" cover />
            </div>
            <span class="text-xl font-bold">دنیاوب</span>
          </NuxtLink>
          <p class="text-gray-400 text-sm leading-relaxed mb-6">
            ارائه‌دهنده خدمات میزبانی ابری با تضمین uptime و امنیت بالا برای کسب‌وکارهای آنلاین.
          </p>

          <h4 class="font-bold mb-3 text-sm">عضویت در خبرنامه</h4>
          <p class="text-gray-500 text-xs mb-3">از تخفیف‌ها و اخبار دنیاوب باخبر شوید.</p>

          <form class="flex gap-2" @submit.prevent="handleSubscribe">
            <input
              v-model="email"
              type="email"
              placeholder="ایمیل شما"
              dir="ltr"
              class="flex-1 min-w-0 px-4 py-2.5 rounded-xl input-glass text-white placeholder-gray-500 outline-none text-sm"
            >
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm shadow-lg shadow-purple-500/20 disabled:opacity-60 shrink-0"
            >
              <Send class="w-4 h-4" />
            </button>
          </form>
        </div>

        <div>
          <h4 class="font-bold mb-4">محصولات</h4>
          <ul class="space-y-2 text-gray-400 text-sm">
            <li v-for="l in productLinks" :key="l.label">
              <NuxtLink :to="l.to" class="hover:text-white transition-colors">{{ l.label }}</NuxtLink>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-4">پشتیبانی</h4>
          <ul class="space-y-2 text-gray-400 text-sm">
            <li v-for="l in supportLinks" :key="l.label">
              <NuxtLink :to="l.to" class="hover:text-white transition-colors">{{ l.label }}</NuxtLink>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-4">ارتباط با ما</h4>
          <ul class="space-y-3 text-gray-400 text-sm">
            <li>
              <a href="tel:02191090605" class="flex items-center gap-2 hover:text-white transition-colors">
                <Phone class="w-4 h-4 shrink-0" />
                <span dir="rtl">۰۲۱-۹۱۰۹۰۶۰۵</span>
              </a>
            </li>
            <li>
              <a href="mailto:support@donyaweb.com" class="flex items-center gap-2 hover:text-white transition-colors">
                <Mail class="w-4 h-4 shrink-0" />
                support@donyaweb.com
              </a>
            </li>
            <li class="flex items-start gap-2">
              <MapPin class="w-4 h-4 shrink-0" />
              خیابان ولیعصر ، بالاتر ار پارک وی ،خیابان فیاضی ،پلاک 148 ،طبقه دوم
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-gray-400 text-sm">© 1405 دنیاوب. تمامی حقوق محفوظ است.</p>

        <div class="flex items-center gap-3">
          <a
            href="https://trustseal.enamad.ir/?id=7777753&Code=71lEVcK3EUE3zE3SOe3URKEnmS8SXekF"
            referrerpolicy="origin"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="نماد اعتماد الکترونیکی"
          >
            <img
              src="https://trustseal.enamad.ir/logo.aspx?id=7777753&Code=71lEVcK3EUE3zE3SOe3URKEnmS8SXekF"
              alt="نماد اعتماد الکترونیکی"
              class="h-14 w-auto cursor-pointer"
            >
          </a>

          <a
            v-for="s in socialLinks"
            :key="s.label"
            :href="s.href"
            :aria-label="s.label"
            target="_blank"
            class="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-linear-to-br hover:from-purple-600 hover:to-blue-600 hover:border-transparent hover-lift transition-all"
          >
            <component :is="s.icon" class="w-5 h-5" />
          </a>

          <button
            type="button"
            aria-label="بازگشت به بالا"
            class="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all"
            @click="scrollToTop"
          >
            <ArrowUp class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>