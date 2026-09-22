<script setup>
defineProps({
  status: { type: String, required: true }
})

const statusMap = {
  active: { label: 'فعال', class: 'bg-green-500/10 text-green-400 border-green-500/30' },
  expiring: { label: 'در حال انقضا', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  suspended: { label: 'معلق', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
  paid: { label: 'پرداخت‌شده', class: 'bg-green-500/10 text-green-400 border-green-500/30' },
  pending: { label: 'در انتظار پرداخت', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  failed: { label: 'ناموفق', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
  open: { label: 'باز', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  answered: { label: 'پاسخ داده‌شده', class: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  closed: { label: 'بسته‌شده', class: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  used: { label: 'استفاده‌شده', class: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  inactive: { label: 'غیرفعال', class: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  incoming: { label: 'ورودی', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  // وضعیت‌های واقعی تراکنش‌های کیف‌پول (wallets/showTransactions → status_text)
  confirmed: { label: 'تأیید شده', class: 'bg-green-500/10 text-green-400 border-green-500/30' },
  canceled: { label: 'لغو شده', class: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  cancelled: { label: 'لغو شده', class: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  rejected: { label: 'رد شده', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
  error: { label: 'خطا', class: 'bg-red-500/10 text-red-400 border-red-500/30' }
}
</script>

<template>
  <span
    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap"
    :class="statusMap[status]?.class || 'bg-gray-500/10 text-gray-400 border-gray-500/30'"
  >
    {{ statusMap[status]?.label || status }}
  </span>
</template>