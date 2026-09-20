<script setup>
// صفحه‌ی نتیجه‌ی پرداخت — معادل pages/Receipt در پروژه‌ی مبدأ.
// بک‌اند بعد از برگشت از درگاه (یا پرداخت با کیف پول) کاربر رو با ?Status=OK به این صفحه می‌فرسته؛
// هر مقدار دیگه‌ای (یا نبودن Status) یعنی پرداخت ناموفق.
import { computed } from 'vue'
import { CheckCircle2, XCircle, ChevronLeft } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const route = useRoute()
const success = computed(() => route.query.Status === 'OK')

useHead({
  title: computed(() => (success.value ? 'پرداخت موفق | دنیاوب' : 'پرداخت ناموفق | دنیاوب'))
})
</script>

<template>
  <div>
    <section class="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div v-if="success" class="glass-card rounded-3xl p-8 sm:p-10 text-center">
        <CheckCircle2 class="w-16 h-16 text-green-400 mx-auto mb-5" />
        <h1 class="text-2xl font-bold mb-2">پرداخت شما با موفقیت انجام شد</h1>
        <p class="text-gray-400 mb-8">از خرید شما سپاسگزاریم.</p>
        <NuxtLink
          to="/dashboard/purchaserecords"
          class="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold"
        >
          مشاهده فاکتورها
          <ChevronLeft class="w-4 h-4" />
        </NuxtLink>
      </div>

      <div v-else class="glass-card rounded-3xl p-8 sm:p-10 text-center">
        <XCircle class="w-16 h-16 text-red-400 mx-auto mb-5" />
        <h1 class="text-2xl font-bold mb-2">خرید ناموفق</h1>
        <p class="text-gray-400 mb-8">پرداخت انجام نشد. اگه مبلغی از حساب شما کسر شده، به‌صورت خودکار برگردانده می‌شه.</p>
        <NuxtLink
          to="/dashboard/purchaserecords"
          class="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-bold"
        >
          بازگشت به فاکتورها
          <ChevronLeft class="w-4 h-4" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>