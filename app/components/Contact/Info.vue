<script setup>
import { Phone, Mail, MapPin } from 'lucide-vue-next'

const channels = [
  {
    icon: Phone,
    title: 'تماس تلفنی',
    detail: '۰۲۱-۹۱۰۹۰۶۰۵',
    action: 'تماس بگیرید',
    href: 'tel:02191090605'
  },
  {
    icon: Mail,
    title: 'ایمیل',
    detail: 'support@donyaweb.com',
    action: 'ارسال ایمیل',
    href: 'mailto:support@donyaweb.com'
  },
  {
    icon: MapPin,
    title: 'دفتر مرکزی',
    detail: ' خیابان ولیعصر، بالاتر از پارک وی، خیابان فیاضی، پلاک 148، طبقه دوم',
    action: 'مسیریابی',
    href: 'https://maps.google.com/?q=خیابان ولیعصر ، بالاتر ار پارک وی ،خیابان فیاضی ،پلاک 148 ،طبقه دوم'
  }
]
</script>

<template>
  <section class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
    <div class="grid md:grid-cols-3 gap-6">
      <a
        v-for="c in channels"
        :key="c.title"
        :href="c.href"
        target="_blank"
        rel="noopener noreferrer"
        class="glass-card rounded-3xl p-8 text-center hover-lift flex flex-col items-center"
      >
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30">
          <component :is="c.icon" class="w-7 h-7 text-white" />
        </div>
        <h3 class="text-lg font-bold mb-2">{{ c.title }}</h3>
        <p class="text-gray-400 text-sm mb-5" dir="ltr">{{ c.detail }}</p>
        <span class="text-sm text-purple-300 font-medium">{{ c.action }}</span>
      </a>
    </div>
  </section>
</template>
