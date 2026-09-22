<script setup>
import { Search, CheckCircle2, XCircle, Loader2, ChevronLeft, Pencil } from 'lucide-vue-next'

const domainModel = defineModel({ type: String, default: '' })

const emit = defineEmits(['select'])

const query = ref('')
const status = ref('idle') // idle | loading | done
const results = ref([])
const manualMode = ref(false)
const manualDomain = ref('')

const tlds = [
  { ext: '.com', price: 'تماس بگیرید' },
  { ext: '.ir', price: 'تماس بگیرید' },
  { ext: '.net', price: 'تماس بگیرید' },
  { ext: '.co', price: 'تماس بگیرید' }
]

function checkDomain() {
  const name = query.value.trim().replace(/\s+/g, '-')
  if (!name) return

  status.value = 'loading'
  results.value = []

  // شبیه‌سازی درخواست به سرور — در آینده با API واقعی جایگزین شود
  setTimeout(() => {
    results.value = tlds.map((t, i) => {
      const seed = (name.length + i * 7) % 5
      return {
        domain: `${name}${t.ext}`,
        // available: !name.includes('test') && seed !== 0,
        available: true,
        price: t.price
      }
    })
    status.value = 'done'
  }, 1200)
}

function selectDomain(domain) {
  domainModel.value = domain
  emit('select', domain)
}

function changeDomain() {
  domainModel.value = ''
  query.value = ''
  results.value = []
  status.value = 'idle'
  manualMode.value = false
}

function confirmManual() {
  const name = manualDomain.value.trim().toLowerCase()
  if (!name || !name.includes('.')) return
  selectDomain(name)
}
</script>

<template>
  <section class="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-20">
    <!-- انتخاب‌شده -->
    <div v-if="domainModel" class="glass-strong rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-green-500/30">
      <div class="flex items-center gap-3">
        <CheckCircle2 class="w-8 h-8 text-green-400 shrink-0" />
        <div>
          <span class="text-sm text-gray-400 block mb-0.5">دامنه انتخابی شما</span>
          <span class="text-xl font-bold text-white" dir="ltr">{{ domainModel }}</span>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg glass hover:bg-white/10 transition text-sm text-gray-300 shrink-0"
        @click="changeDomain"
      >
        <Pencil class="w-4 h-4" /> تغییر دامنه
      </button>
    </div>

    <!-- جستجو -->
    <template v-else>
      <div v-if="!manualMode" class="glass-strong rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl">
        <div class="relative flex-1 flex items-center">
          <input
            v-model="query"
            type="text"
            dir="rtl"
            placeholder="نام دامنه مورد نظر خود را وارد کنید..."
            class="w-full px-6 py-4 rounded-xl input-glass text-white placeholder-gray-400 outline-none text-lg text-right"
            @keyup.enter="checkDomain"
          >
        </div>
        <button
          type="button"
          :disabled="status === 'loading'"
          class="px-8 py-4 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          @click="checkDomain"
        >
          <Loader2 v-if="status === 'loading'" class="w-5 h-5 animate-spin" />
          <Search v-else class="w-5 h-5" />
          بررسی دامنه
        </button>
      </div>

      <!-- نتایج -->
      <Transition name="fade-slide">
        <div v-if="status === 'done'" class="mt-4 space-y-3">
          <div
            v-for="r in results"
            :key="r.domain"
            class="p-4 rounded-xl glass flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3">
              <CheckCircle2 v-if="r.available" class="w-5 h-5 text-green-400 shrink-0" />
              <XCircle v-else class="w-5 h-5 text-red-400 shrink-0" />
              <span class="font-medium" dir="ltr">{{ r.domain }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="r.available" class="text-sm text-gray-400 hidden sm:inline">{{ r.price }} تومان/سال</span>
              <span v-else class="text-sm text-red-400">قبلاً ثبت شده</span>
              <button
                v-if="r.available"
                type="button"
                class="text-sm px-4 py-1.5 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition font-medium"
                @click="selectDomain(r.domain)"
              >
                انتخاب
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <div class="text-center mt-5">
        <button type="button" class="text-sm text-gray-400 hover:text-purple-300 transition underline decoration-dotted" @click="manualMode = true">
          دامنه‌ای دارم، فقط می‌خواهم وارد کنم
        </button>
      </div>
    </template>

    <!-- ورود دستی دامنه -->
    <div v-if="manualMode && !domainModel" class="mt-4 glass-card rounded-2xl p-6">
      <label for="manual-domain" class="block text-sm text-gray-300 mb-2">دامنه‌ای که در اختیار دارید</label>
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          id="manual-domain"
          v-model="manualDomain"
          type="text"
          dir="ltr"
          placeholder="example.com"
          class="flex-1 px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none"
          @keyup.enter="confirmManual"
        >
        <button
          type="button"
          class="px-6 py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold flex items-center justify-center gap-2"
          @click="confirmManual"
        >
          تایید <ChevronLeft class="w-4 h-4" />
        </button>
      </div>
      <button type="button" class="text-xs text-gray-500 hover:text-gray-300 transition mt-3" @click="manualMode = false">
        بازگشت به جستجوی دامنه
      </button>
    </div>
  </section>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
