<script setup>
import { Zap, Shield, Headphones } from 'lucide-vue-next'

const features = [
  {
    icon: Zap,
    title: 'سرعت فوق‌العاده',
    desc: 'سرورهای مجهز به NVMe SSD و پردازنده‌های قدرتمند اینتل و AMD',
    bg: 'bg-purple-500/20',
    color: 'text-purple-400'
  },
  {
    icon: Shield,
    title: 'امنیت لایه‌ای',
    desc: 'فایروال سخت‌افزاری، ضد DDoS و SSL رایگان برای تمام سرویس‌ها',
    bg: 'bg-blue-500/20',
    color: 'text-blue-400'
  },
  {
    icon: Headphones,
    title: 'پشتیبانی ۲۴/۷',
    desc: 'تیم فنی متخصص در تمام ساعات شبانه‌روز آماده کمک به شماست',
    bg: 'bg-green-500/20',
    color: 'text-green-400'
  }
]
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="glass rounded-3xl p-8 md:p-16 relative overflow-hidden">
      <div class="absolute inset-0 bg-linear-to-r from-purple-900/20 to-blue-900/20"></div>
      <div class="relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold mb-6">چرا <span class="text-purple-400">دنیاوب</span>؟</h2>
          <div class="space-y-6">
            <div v-for="f in features" :key="f.title" class="flex gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" :class="f.bg">
                <component :is="f.icon" class="w-6 h-6" :class="f.color" />
              </div>
              <div>
                <h4 class="font-bold text-lg mb-1">{{ f.title }}</h4>
                <p class="text-gray-400">{{ f.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative text-left"  dir="ltr">
          <div class="absolute inset-0 bg-linear-to-r from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-30"></div>
          <div class="glass-strong rounded-3xl p-6 relative">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div class="space-y-3 font-mono text-sm">
              <div class="flex gap-2 text-green-400">
                <span>$ uptime</span>
              </div>
              <div class="text-gray-300">99.99% uptime - Last 30 days</div>
              <div class="flex gap-2 text-blue-400 mt-4">
                <span>$ ping donyaweb.com</span>
              </div>
              <div class="text-gray-300">Reply from 185.XXX.XXX.XXX: bytes=32 time=12ms TTL=55</div>
              <div class="text-gray-300">Reply from 185.XXX.XXX.XXX: bytes=32 time=11ms TTL=55</div>
              <div class="text-gray-300">Reply from 185.XXX.XXX.XXX: bytes=32 time=10ms TTL=55</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
