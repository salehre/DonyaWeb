<script setup>
import { Star, Quote } from 'lucide-vue-next'

const testimonials = [
  {
    name: 'محمد رضایی',
    role: 'مدیر فروشگاه اینترنتی',
    initials: 'م.ر',
    color: 'from-purple-500 to-blue-600',
    rating: 5,
    quote: 'بعد از انتقال فروشگاهم به دنیاوب، سرعت بارگذاری صفحات محصولات چند برابر شد و نرخ تبدیل فروشگاه هم بهبود قابل توجهی داشت. پشتیبانی هم واقعاً سریع جواب می‌ده.'
  },
  {
    name: 'مهدی محمدی',
    role: 'توسعه‌دهنده وب',
    initials: 'م',
    color: 'from-pink-500 to-purple-600',
    rating: 5,
    quote: 'برای پروژه‌های مشتری‌هام از VPS دنیاوب استفاده می‌کنم. دسترسی روت کامل، منابع پایدار و قیمت منصفانه، دقیقاً چیزیه که برای یک فریلنسر لازمه.'
  },
  {
    name: 'امیر صادقی',
    role: 'بنیان‌گذار استارتاپ',
    initials: 'ا.ص',
    color: 'from-blue-500 to-purple-600',
    rating: 5,
    quote: 'از مرحله انتخاب دامنه تا راه‌اندازی سرور اختصاصی، همه چیز شفاف و بدون دردسر بود. آپتایم اعلام‌شده رو هم واقعاً تجربه کردیم؛ چند ماهه که هیچ قطعی نداشتیم.'
  }
]
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold mb-4">نظرات <span class="gradient-text">مشتریان</span> ما</h2>
      <p class="text-gray-400">تجربه واقعی کسب‌وکارهایی که به دنیاوب اعتماد کرده‌اند</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div
        v-for="t in testimonials"
        :key="t.name"
        class="glass-card rounded-3xl p-8 hover-lift relative"
      >
        <Quote class="w-8 h-8 text-purple-500/30 mb-4" />

        <div class="flex items-center gap-1 mb-4">
          <Star v-for="i in t.rating" :key="i" class="w-4 h-4 text-yellow-400 fill-yellow-400" />
        </div>

        <p class="text-gray-300 leading-relaxed mb-6">{{ t.quote }}</p>

        <div class="flex items-center gap-3 pt-4 border-t border-white/10">
          <div
            class="w-10 h-10 rounded-full bg-linear-to-br flex items-center justify-center text-sm font-bold text-white shrink-0"
            :class="t.color"
          >
            {{ t.initials }}
          </div>
          <div>
            <div class="font-bold text-sm">{{ t.name }}</div>
            <div class="text-gray-400 text-xs">{{ t.role }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>