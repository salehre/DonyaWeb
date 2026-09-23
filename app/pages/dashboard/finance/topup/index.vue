<script setup>
import { ref } from 'vue'
import { Wallet, CreditCard, Landmark, Plus, ArrowDownLeft, ArrowUpRight, ArrowRight, X, Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

useHead({
  title: 'افزایش موجودی کیف پول | دنیاوب'
})

const router = useRouter()

const { toJalaliDate } = useJalaliDate()

const {
  balance,
  transactions: history,
  transactionsPending,
  ensureLoaded,
  depositViaGateway,
  uploadReceiptImage,
  requestDeposit,
  formatNumber
} = useWallet()

await ensureLoaded()

const transactions = computed(() =>
  history.value.map((t) => ({ ...t, date: toJalaliDate(t.date) }))
)

const toast = useToast()

const quickAmounts = [200000, 500000, 1000000, 2000000]
const amount = ref(null)
const customAmount = ref('')
const method = ref('gateway')
const isSubmitting = ref(false)

// مبلغ نهایی به‌صورت computed تا هم در validate و هم در disabled دکمه استفاده شود
const finalAmount = computed(() =>
  customAmount.value ? numericAmount(customAmount.value) : amount.value
)
const isAmountValid = computed(() => Boolean(finalAmount.value) && finalAmount.value >= 10000)

function toEnglishDigits(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
}

function toPersianAmount(value) {
  return toEnglishDigits(value)
    .replace(/\D/g, '')
    .replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
}

function numericAmount(value) {
  return Number(toEnglishDigits(value)) || 0
}

function selectQuick(a) {
  amount.value = a
  customAmount.value = toPersianAmount(a)
}

function goBack() {
  router.back()
}

// ===== دیالوگ ثبت فیش واریزی =====
const showReceiptDialog = ref(false)
const receiptAmount = ref('')
const receiptTrackingCode = ref('')
const receiptFiles = ref([])
const receiptDate = ref('')
const receiptDescription = ref('')
const isSubmittingReceipt = ref(false)

function openReceiptDialog() {
  method.value = 'card'
  showReceiptDialog.value = true
}

function closeReceiptDialog() {
  if (isSubmittingReceipt.value) return
  showReceiptDialog.value = false
  receiptAmount.value = ''
  receiptTrackingCode.value = ''
  receiptFiles.value = []
  receiptDate.value = ''
  receiptDescription.value = ''
}

async function submitReceipt() {
  const amountValue = numericAmount(receiptAmount.value)
  if (!amountValue) {
    toast.error('مبلغ واریزی الزامی است')
    return
  }
  if (!receiptTrackingCode.value.trim()) {
    toast.error('شماره پیگیری الزامی است')
    return
  }
  if (!receiptDate.value) {
    toast.error('تاریخ سند الزامی است')
    return
  }

  isSubmittingReceipt.value = true
  try {
    let attachmentPath = null
    if (receiptFiles.value.length) {
      attachmentPath = await uploadReceiptImage(receiptFiles.value[0])
    }

    await requestDeposit({
      amount: amountValue,
      trackingCode: receiptTrackingCode.value.trim(),
      documentDate: receiptDate.value,
      description: receiptDescription.value,
      attachment: attachmentPath
    })

    toast.success('فیش واریزی با موفقیت ثبت شد؛ پس از تأیید، مبلغ به کیف پول اضافه می‌شود.')
    closeReceiptDialog()
  } catch (error) {
    console.error('Receipt submit error:', error)
    toast.error(error.message || 'ثبت فیش واریزی ناموفق بود.')
  } finally {
    isSubmittingReceipt.value = false
  }
}

async function handleTopup() {
  if (!isAmountValid.value) {
    toast.error('حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است')
    return
  }

  if (method.value !== 'gateway') {
    toast.error('در حال حاضر فقط پرداخت از طریق درگاه بانکی پشتیبانی می‌شود.')
    return
  }

  isSubmitting.value = true
  try {
    const paymentUrl = await depositViaGateway(finalAmount.value)
    // کاربر به درگاه بانک هدایت می‌شود؛ isSubmitting عمداً true می‌ماند تا دکمه دوباره کلیک نشود
    window.location.replace(paymentUrl)
  } catch (error) {
    // برای دیباگ راحت‌تر (خطاهای شبکه/سرور اینجا مشخص می‌شوند)
    console.error('Topup error:', error)
    toast.error(error.message || 'خطا در اتصال به درگاه پرداخت')
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="glass-card rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
          <Wallet class="w-7 h-7 text-white" />
        </div>
        <div>
          <p class="text-gray-400 text-sm mb-1">موجودی کیف پول</p>
          <p class="text-2xl font-bold">{{ formatNumber(balance) }} <span class="text-sm font-normal text-gray-400">تومان</span></p>
        </div>
      </div>
      <button
          type="button"
          class="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors w-fit"
          @click="goBack"
        >
        بازگشت
         <ArrowRight class="w-4 h-4 rotate-180" />
       </button>
    </div>

    <div class="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
      <h2 class="text-lg font-bold">افزایش موجودی</h2>

      <div>
        <label class="block text-sm text-gray-300 mb-3">مبلغ شارژ (تومان)</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <button
            v-for="a in quickAmounts"
            :key="a"
            type="button"
            class="py-3 rounded-xl text-sm font-medium border transition-all"
            :class="numericAmount(customAmount) === a
              ? 'bg-linear-to-r from-purple-600 to-blue-600 border-transparent shadow-lg shadow-purple-500/30'
              : 'glass border-white/10 text-gray-300 hover:text-white hover:border-purple-500/40'"
            @click="selectQuick(a)"
          >
            {{ formatNumber(a) }}
          </button>
        </div>
        <input
          v-model="customAmount"
          type="text"
          inputmode="numeric"
          dir="ltr"
          min="200000"
          placeholder="یا مبلغ دلخواه را وارد کنید (تومان)"
          class="w-full px-4 py-3 rounded-xl input-glass text-left text-white placeholder:text-right placeholder-gray-500 outline-none"
          @input="customAmount = toPersianAmount(customAmount)"
        >
      </div>

      <div>
        <label class="block text-sm text-gray-300 mb-3">روش پرداخت</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-medium border transition-all"
            :class="method === 'gateway'
              ? 'bg-linear-to-r from-purple-600 to-blue-600 border-transparent shadow-lg shadow-purple-500/30'
              : 'glass border-white/10 text-gray-300 hover:text-white hover:border-purple-500/40'"
            @click="method = 'gateway'"
          >
            <Landmark class="w-4 h-4" />
            درگاه جیبیت
          </button>
          <button
            type="button"
            class="flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-medium border transition-all"
            :class="method === 'card'
              ? 'bg-linear-to-r from-purple-600 to-blue-600 border-transparent shadow-lg shadow-purple-500/30'
              : 'glass border-white/10 text-gray-300 hover:text-white hover:border-purple-500/40'"
            @click="openReceiptDialog"
          >
            <CreditCard class="w-4 h-4" />
            فیش واریز
          </button>
        </div>
      </div>

      <button
        type="button"
        :disabled="isSubmitting || !isAmountValid"
        class="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        @click="handleTopup"
      >
        <Plus class="w-4 h-4" />
        {{ isSubmitting ? 'در حال انتقال به درگاه...' : 'افزایش موجودی' }}
      </button>
      <p v-if="!isAmountValid" class="text-xs text-gray-500 text-center -mt-2">
        برای فعال‌شدن دکمه، مبلغی حداقل ۱۰,۰۰۰ تومان انتخاب یا وارد کنید.
      </p>
    </div>

    <div class="glass-card rounded-3xl overflow-hidden">
      <h2 class="text-lg font-bold p-6 pb-0">تاریخچه تراکنش‌ها</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm mt-4">
          <thead>
            <tr class="border-b border-white/10 text-gray-400 text-right">
              <th class="px-6 py-3 font-medium">شناسه</th>
              <th class="px-6 py-3 font-medium">نوع</th>
              <th class="px-6 py-3 font-medium">مبلغ (تومان)</th>
              <th class="px-6 py-3 font-medium">روش</th>
              <th class="px-6 py-3 font-medium">تاریخ</th>
              <th class="px-6 py-3 font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="transactionsPending">
              <td
                colspan="6"
                class="px-6 py-12 text-center text-gray-500"
              >
                در حال دریافت تراکنش‌ها...
              </td>
            </tr>

            <tr
              v-else-if="transactions.length"
              v-for="t in transactions"
              :key="t.id"
              class="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
            >
              <td class="px-6 py-4 font-medium" dir="ltr">
                {{ t.id }}
              </td>

              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5"
                  :class="{
                    'text-green-400': t.type === 'deposit',
                    'text-red-400': t.type === 'purchase',
                    'text-orange-400': t.type === 'withdraw',
                    'text-blue-400': t.type === 'transfer',
                    'text-yellow-400': t.type === 'award',
                  }"
                >
                  <component
                    :is="
                      t.type === 'deposit'
                        ? ArrowDownLeft
                        : ArrowUpRight
                    "
                    class="w-4 h-4"
                  />

                  {{
                    t.type === 'deposit'
                      ? 'واریز'
                      : t.type === 'purchase'
                      ? 'خرید'
                      : t.type === 'withdraw'
                      ? 'برداشت'
                      : t.type === 'transfer'
                      ? 'انتقال'
                      : t.type === 'award'
                      ? 'پاداش'
                      : t.type
                  }}
                </span>
              </td>

              <td class="px-6 py-4 text-gray-300" dir="ltr">
                {{ formatNumber(Math.abs(t.amount)) }}
              </td>

              <td class="px-6 py-4 text-gray-400">
                {{ t.method }}
              </td>

              <td class="px-6 py-4 text-gray-400">
                {{ t.date }}
              </td>

              <td class="px-6 py-4">
                <DashboardStatusBadge :status="t.status" />
              </td>
            </tr>

            <tr v-else>
              <td
                colspan="6"
                class="px-6 py-12 text-center text-gray-500"
              >
                هنوز تراکنشی ثبت نشده است.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- دیالوگ ثبت فیش واریزی -->
    <Teleport to="body">
      <Transition name="modal-slide-up">
        <div
          v-if="showReceiptDialog"
          class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          @click.self="closeReceiptDialog"
        >
          <div class="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl glass-strong border border-white/10 p-6 shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-bold">ثبت فیش واریزی</h3>
              <button
                type="button"
                class="text-gray-400 hover:text-white transition-colors"
                :disabled="isSubmittingReceipt"
                @click="closeReceiptDialog"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-5">
              <div>
                <label class="block text-sm text-gray-300 mb-2">مبلغ واریزی (تومان)</label>
                <input
                  v-model="receiptAmount"
                  type="text"
                  inputmode="numeric"
                  dir="ltr"
                  placeholder="مبلغ را وارد کنید"
                  class="w-full px-4 py-3 rounded-xl input-glass text-left text-white placeholder:text-right placeholder-gray-500 outline-none"
                  @input="receiptAmount = toPersianAmount(receiptAmount)"
                >
              </div>

              <div>
                <label class="block text-sm text-gray-300 mb-2">شماره پیگیری</label>
                <input
                  v-model="receiptTrackingCode"
                  type="text"
                  dir="ltr"
                  placeholder="شماره پیگیری تراکنش بانکی"
                  class="w-full px-4 py-3 rounded-xl input-glass text-left text-white placeholder:text-right placeholder-gray-500 outline-none"
                >
              </div>

              <div>
                <label class="block text-sm text-gray-300 mb-2">تصویر فیش</label>
                <DashboardFileAttachInput v-model="receiptFiles" :max="1" :max-size-mb="5" />
              </div>

              <div>
                <label class="block text-sm text-gray-300 mb-2">تاریخ</label>
                <DashboardDatePicker v-model="receiptDate" placeholder="انتخاب تاریخ سند" />
              </div>

              <div>
                <label class="block text-sm text-gray-300 mb-2">توضیحات</label>
                <textarea
                  v-model="receiptDescription"
                  rows="3"
                  placeholder="توضیحات (اختیاری)"
                  class="w-full px-4 py-3 rounded-xl input-glass text-white placeholder-gray-500 outline-none resize-none"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 mt-6">
              <button
                type="button"
                :disabled="isSubmittingReceipt"
                class="flex-1 py-3 rounded-xl bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                @click="submitReceipt"
              >
                <Loader2 v-if="isSubmittingReceipt" class="w-4 h-4 animate-spin" />
                {{ isSubmittingReceipt ? 'در حال ثبت...' : 'ثبت فیش' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-slide-up-enter-active,
.modal-slide-up-leave-active {
  transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}
.modal-slide-up-enter-from,
.modal-slide-up-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>