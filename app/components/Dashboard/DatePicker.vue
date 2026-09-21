<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { Calendar } from 'lucide-vue-next'

const props = defineProps({
  // تاریخ میلادی به‌صورت 'YYYY-MM-DD' (همان فرمت birth_date در API)؛ نمایش به‌صورت شمسی است
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'انتخاب تاریخ'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // محدوده‌ی مجاز (میلادی 'YYYY-MM-DD'). پیش‌فرض: از ۱۰۰ سال پیش تا امروز (مناسب تاریخ تولد)
  min: {
    type: String,
    default: ''
  },
  max: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// پکیج تقویم به window وابسته است؛ فقط سمت کلاینت (داخل ClientOnly) لود می‌شود
const PersianDatePicker = defineAsyncComponent(async () => {
  const mod = await import('vue3-persian-datetime-picker')
  return mod.default?.default ?? mod.default ?? mod
})

// شناسه‌ی یکتا برای اتصال تقویم به input با custom-input
const inputId = `date-input-${Math.random().toString(36).slice(2, 9)}`

function toGregorianStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const maxDate = computed(() => props.max || toGregorianStr(new Date()))

const minDate = computed(() => {
  if (props.min) return props.min
  const d = new Date()
  d.setFullYear(d.getFullYear() - 100)
  return toGregorianStr(d)
})

// نمایش شمسیِ تاریخ ذخیره‌شده (میلادی) داخل input
function toJalaliDisplay(gregorianStr) {
  if (!gregorianStr) return ''

  const [y, m, d] = String(gregorianStr).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return ''

  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC'
  }).formatToParts(new Date(Date.UTC(y, m - 1, d)))

  const get = (type) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('relatedYear') || get('year')}/${get('month')}/${get('day')}`
}

const displayValue = computed(() => toJalaliDisplay(props.modelValue))
</script>

<template>
  <ClientOnly>
    <div
      class="relative"
      :class="disabled ? 'pointer-events-none opacity-60' : ''"
    >
      <input
        :id="inputId"
        type="text"
        readonly
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        dir="ltr"
        class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none cursor-pointer text-right"
      >

      <Calendar class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" />

      <PersianDatePicker
        v-if="!disabled"
        :model-value="modelValue"
        type="date"
        locale="fa"
        simple
        color="#a78bfa"
        format="YYYY-MM-DD"
        display-format="jYYYY/jMM/jDD"
        :min="minDate"
        :max="maxDate"
        :custom-input="`#${inputId}`"
        append-to="body"
        @update:model-value="emit('update:modelValue', $event || '')"
        @change="emit('change', $event)"
      />
    </div>

    <template #fallback>
      <div class="relative">
        <input
          type="text"
          disabled
          :value="displayValue"
          :placeholder="placeholder"
          class="w-full pr-12 pl-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none opacity-70"
        >
        <Calendar class="w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" />
      </div>
    </template>
  </ClientOnly>
</template>

<style>
/* تم تیره‌ی تقویم (vue3-persian-datetime-picker) هماهنگ با UI سایت.
   پاپ‌آپ با append-to="body" بیرون از کامپوننت رندر می‌شود، پس این استایل‌ها سراسری‌اند. */
.vpd-content {
  background-color: #12305c !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
  font-family: inherit;
}

.vpd-header {
  background: linear-gradient(to left, #2563eb, #9333ea) !important;
  color: #fff;
}

.vpd-simple-content .vpd-column .vpd-column-header {
  color: #fff;
}

.vpd-addon-list {
  background-color: #12305c !important;
}

.vpd-addon-list-item {
  color: #cbd5e1;
  border-color: transparent !important;
  border-radius: 10px;
}

.vpd-addon-list-item:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: #fff;
}

/* رنگ متن گزینه‌ی انتخاب‌شده از prop color می‌آید */
.vpd-addon-list-item.vpd-selected {
  background-color: rgba(167, 139, 250, 0.18) !important;
}

.vpd-addon-list-item[disabled='true'] {
  color: #64748b !important;
  opacity: 0.6;
}

.vpd-actions button {
  color: #c4b5fd !important;
  border-radius: 10px;
}

.vpd-actions button:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.vpd-simple-content .vpd-column .vpd-column-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
}

.vpd-simple-content .vpd-column .vpd-column-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
</style>