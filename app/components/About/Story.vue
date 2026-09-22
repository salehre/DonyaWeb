<script setup>
import { Target, Rocket } from 'lucide-vue-next'
</script>

<template>
  <section class="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="glass rounded-3xl p-8 md:p-16 relative overflow-hidden">
      <div class="absolute inset-0 bg-linear-to-r from-purple-900/20 to-blue-900/20" />
      <div class="relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold mb-6">چطور <span class="text-purple-400">شروع کردیم</span></h2>
          <p class="text-gray-400 leading-relaxed mb-6">
            دنیاوب کارش را با یک سرور اجاره‌ای و چند مشتری اولیه شروع کرد. امروز، با هزاران وب‌سایت و اپلیکیشن فعال روی زیرساخت‌مان، همچنان همان اصل اول را دنبال می‌کنیم:
            پشتیبانی واقعی از انسان‌های واقعی، نه فقط یک تیکت خودکار.
          </p>

          <div class="space-y-5">
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Target class="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h4 class="font-bold text-lg mb-1">ماموریت ما</h4>
                <p class="text-gray-400">در دسترس قرار دادن زیرساخت باکیفیت و مقرون‌به‌صرفه برای هر کسب‌وکاری، از استارتاپ‌های نوپا تا سازمان‌های بزرگ</p>
              </div>
            </div>
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Rocket class="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 class="font-bold text-lg mb-1">چشم‌انداز ما</h4>
                <p class="text-gray-400">تبدیل شدن به قابل‌اعتمادترین ارائه‌دهنده خدمات ابری در منطقه، با تمرکز بر سرعت، شفافیت و پشتیبانی انسانی</p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative text-left"  dir="ltr">
          <div class="absolute inset-0 bg-linear-to-r from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-30" />
          <div class="glass-strong rounded-3xl p-6 relative">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-3 h-3 rounded-full bg-red-500" />
              <div class="w-3 h-3 rounded-full bg-yellow-500" />
              <div class="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div class="space-y-3 font-mono text-sm">
              <div class="flex gap-2 text-green-400">
                <span>$ whoami</span>
              </div>
              <div class="text-gray-300">Donyaweb - Founded 1389</div>
              <div class="flex gap-2 text-blue-400 mt-4">
                <span>$ uptime --since founding</span>
              </div>
              <div class="text-gray-300">99.9% average uptime, every year</div>
              <div class="flex gap-2 text-purple-400 mt-4">
                <span>$ cat mission.txt</span>
              </div>
              <div class="text-gray-300">"Make infrastructure simple and reliable"</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
