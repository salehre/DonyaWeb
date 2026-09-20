<template>
    <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Ticket Action -->
        <div class="glass-card rounded-3xl p-8 text-center hover-lift flex flex-col justify-between">
          <div class="align-center">
            <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30">
              <LifeBuoy class="w-7 h-7 text-white" />
            </div>

            <h2 class="text-xl font-bold mb-2">ثبت تیکت پشتیبانی</h2>
            <p class="text-gray-400 text-sm leading-relaxed mb-5">
              برای ثبت درخواست جدید یا پیگیری تیکت‌های قبلی، وارد پنل کاربری خود شوید.
            </p>
          </div>

          <NuxtLink
            to="/dashboard/tickets"
            class="w-full py-3 rounded-xl border border-purple-500/50 text-purple-300 hover:bg-purple-500/20 transition-all font-medium text-sm inline-flex items-center justify-center gap-2"
          >
            <Send class="w-4 h-4" />
            ورود به تیکت‌ها
          </NuxtLink>
        </div>

        <!-- FAQ -->
        <div>
          <h2 class="text-xl font-bold mb-6">سوالات <span class="gradient-text">متداول</span></h2>

          <div class="space-y-3">
            <div
              v-for="(f, i) in faqs"
              :key="f.q"
              class="glass rounded-2xl overflow-hidden border border-white/10"
            >
              <button
                type="button"
                class="w-full flex items-center justify-between gap-4 px-6 py-4 text-right"
                @click="toggleFaq(i)"
              >
                <span class="font-medium">{{ f.q }}</span>
                <ChevronDown
                  class="w-5 h-5 text-gray-400 shrink-0 transition-transform"
                  :class="openFaq === i ? 'rotate-180' : ''"
                />
              </button>
              <div
                class="grid transition-all duration-300"
                :class="openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
              >
                <div class="overflow-hidden">
                  <p class="px-6 pb-4 text-gray-400 text-sm leading-relaxed">{{ f.a }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
</template>

<script setup>
import {
  LifeBuoy, ChevronDown, Send
} from 'lucide-vue-next'

// --- FAQ ---
const faqs = [
  {
    q: 'چطور می‌توانم دامنه خود را به دنیاوب منتقل کنم؟',
    a: 'از بخش «ثبت دامنه» گزینه انتقال دامنه را انتخاب کنید، کد انتقال (EPP) را از ثبت‌کننده فعلی دریافت کنید و در فرم وارد نمایید. فرآیند معمولاً بین ۲ تا ۷ روز کاری طول می‌کشد.'
  },
  {
    q: 'روش‌های پرداخت چه مواردی را شامل می‌شود؟',
    a: 'پرداخت از طریق درگاه بانکی، کیف پول داخلی حساب کاربری و کارت‌های شتاب پشتیبانی می‌شود.'
  },
  {
    q: 'آیا امکان بازگشت وجه وجود دارد؟',
    a: 'برای سرویس‌های هاست و VPS، تا ۷ روز پس از خرید امکان بازگشت وجه کامل وجود دارد، مشروط به عدم استفاده غیرمتعارف از منابع.'
  },
  {
    q: 'زمان راه‌اندازی سرویس بعد از پرداخت چقدر است؟',
    a: 'هاست ابری و VPS بلافاصله و به‌صورت خودکار فعال می‌شوند. سرور اختصاصی تا ۲۴ ساعت کاری زمان نیاز دارد.'
  },
  {
    q: 'چطور یک تیکت پشتیبانی جدید ثبت کنم؟',
    a: 'می‌توانید از داخل پنل کاربری، بخش «تیکت‌ها» را باز کنید و درخواست جدید خود را ثبت یا تیکت‌های قبلی را پیگیری کنید.'
  }
]

const openFaq = ref(null)
function toggleFaq(i) {
  openFaq.value = openFaq.value === i ? null : i
}

</script>