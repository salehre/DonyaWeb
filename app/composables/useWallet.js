// app/composables/useWallet.js
// state مشترکِ کیف‌پول (موجودی + تاریخچه تراکنش‌ها) بین تمام صفحات/کامپوننت‌ها.
// از useState استفاده شده (نه یک متغیر ماژولی ساده) چون در SSR هر کاربر باید
// نسخه‌ی جدا و ایزوله‌ی خودش از این state رو داشته باشه.
// با فراخوانی fetchBalance/fetchTransactions فقط یک‌بار per session به API واقعی
// زده می‌شه و نتیجه بین همه‌ی مصرف‌کننده‌ها به اشتراک گذاشته می‌شه (بدون درخواست تکراری).
//
// موجودی مطابق منطق پروژه‌ی مرجع: wallets/getBalance → response.Wallets و انتخاب
// کیف‌پولی که currency_id آن برابر currencyId است (پیش‌فرض ۱، مثل currencyCode در مرجع).

export function useWallet(currencyId = 1) {
  const config = useRuntimeConfig()
  const headers = useApiHeaders()
  const toast = useToast()

  // پاسخ خام API
  const wallets = useState('wallet-wallets', () => [])
  const rawTransactions = useState('wallet-transactions', () => [])

  const balancePending = useState('wallet-balance-pending', () => false)
  const transactionsPending = useState('wallet-transactions-pending', () => false)

  const balanceLoaded = useState('wallet-balance-loaded', () => false)
  const transactionsLoaded = useState('wallet-transactions-loaded', () => false)

  // کیف‌پول ارز اصلی (currency_id = 1)
  const wallet = computed(
    () => wallets.value.find((w) => Number(w.currency_id) === Number(currencyId)) ?? null
  )
  const balance = computed(() => Number(wallet.value?.balance ?? 0))

  // تاریخچه‌ی خام همه‌ی تراکنش‌ها (همه‌ی وضعیت‌ها) با قالب یکسان
  const allTransactions = computed(() =>
    rawTransactions.value.map((t) => ({
      id: t.wallet_transactions_id,
      type: t.kind_text,
      amount: Number(t.amount),
      method: t.payment_procedure_title || t.gateway_title || '-',
      date: t.document_date,
      status: t.status_text,
      statusCode: Number(t.status),
      trackingCode: t.tracking_code
    }))
  )

  // تاریخچه‌ی اصلی: فقط تراکنش‌های تأیید‌شده (status === 2)
  const transactions = computed(() => allTransactions.value.filter((t) => t.statusCode === 2))

  // بقیه‌ی وضعیت‌ها (در انتظار / لغو‌شده / رد‌شده / خطا) → بخش «درخواست‌های در انتظار»
  const pendingItems = computed(() => allTransactions.value.filter((t) => t.statusCode !== 2))

  const totalDeposited = computed(() =>
    transactions.value
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )
  const totalSpent = computed(() =>
    transactions.value
      .filter((t) => t.type === 'purchase')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )

  function formatNumber(n) {
    return (Number(n) || 0).toLocaleString('fa-IR')
  }

  // دریافت موجودی از API — با force=true دوباره از سرور می‌گیرد، در غیر این‌صورت
  // در صورت وجود داده‌ی کش‌شده، از درخواست مجدد صرف‌نظر می‌کند.
  async function fetchBalance(force = false) {
    if (balanceLoaded.value && !force) return
    balancePending.value = true
    try {
      const response = await $fetch(`${config.public.apiBase}/wallets/getBalance`, {
        method: 'POST',
        headers: headers.value
      })

      if (!Array.isArray(response?.Wallets)) {
        console.warn('wallets/getBalance unexpected response:', response)
      }

      wallets.value = response?.Wallets ?? []
      balanceLoaded.value = true
    } catch (error) {
      console.error('Wallet balance fetch error:', error, error?.data)
      if (import.meta.client) {
        toast.error('دریافت موجودی کیف پول ناموفق بود.')
      }
    } finally {
      balancePending.value = false
    }
  }

  async function fetchTransactions(force = false) {
    if (transactionsLoaded.value && !force) return
    transactionsPending.value = true
    try {
      const response = await $fetch(`${config.public.apiBase}/wallets/showTransactions`, {
        method: 'POST',
        headers: headers.value,
        body: { currency_id: currencyId }
      })

      if (response?.success === false || response?.code === 2001) {
        // کیف‌پولی برای این ارز هنوز برای کاربر ساخته نشده (wallet_not_found)؛
        // یعنی کاربر هنوز هیچ تراکنشی نداشته — خطا نیست، فقط لیست خالیه.
        rawTransactions.value = []
        transactionsLoaded.value = true
        return
      }

      if (!Array.isArray(response?.WalletTransactions)) {
        console.warn('wallets/showTransactions unexpected response:', response)
      }

      rawTransactions.value = response?.WalletTransactions ?? []
      transactionsLoaded.value = true
    } catch (error) {
      console.error('Wallet transactions fetch error:', error, error?.data)
      if (import.meta.client) {
        toast.error('دریافت تاریخچه تراکنش‌ها ناموفق بود.')
      }
    } finally {
      transactionsPending.value = false
    }
  }

  // بارگذاری اولیه‌ی هر دو (فقط اگر قبلاً بارگذاری نشده باشند)
  async function ensureLoaded() {
    await Promise.all([fetchBalance(), fetchTransactions()])
  }

  // به‌روزرسانی اجباری هر دو (بعد از تراکنش جدید مثل شارژ/برداشت)
  async function refresh() {
    await Promise.all([fetchBalance(true), fetchTransactions(true)])
  }

  function hasEnoughBalance(amount) {
    return balance.value >= Number(amount || 0)
  }

  // ثبت درخواست برداشت وجه از کیف‌پول و رفرش خودکار موجودی/تاریخچه
  async function requestWithdraw(amount, destination) {
    let response
    try {
      response = await $fetch(`${config.public.apiBase}/wallets/createTransactionsRequest`, {
        method: 'POST',
        headers: headers.value,
        body: {
          amount,
          dynamic_column_01: destination,
          kind: 2
        }
      })
    } catch (error) {
      console.error('Wallet withdraw request error:', error, error?.data)
      throw new Error(error?.data?.message || error?.data?.msg || 'ثبت درخواست برداشت ناموفق بود.')
    }

    if (response?.code !== 2000) {
      throw new Error(response?.message || response?.msg || 'ثبت درخواست برداشت ناموفق بود.')
    }

    await refresh()
    return response
  }

  const depositPending = useState('wallet-deposit-pending', () => false)

  // گرفتن اولین درگاه آنلاین فعال (مطابق منطق پروژه‌ی مرجع)
  async function getOnlineGateway() {
    const response = await $fetch(`${config.public.apiBase}/options/indexPaymentProcedure`, {
      method: 'POST',
      headers: headers.value,
      body: { language_id: 1, currency_id: currencyId }
    })

    const onlineProcedure = (response?.PaymentProcedure || []).find(
      (p) => p.dynamic_column_01 === 'onlinePayment' && p.gateways?.length
    )

    if (!onlineProcedure) {
      throw new Error('درگاه پرداخت آنلاینی یافت نشد.')
    }

    return {
      procedureId: onlineProcedure.id,
      gatewayId: onlineProcedure.gateways[0].id,
      gatewayTitle: onlineProcedure.gateways[0].title
    }
  }

  // شارژ کیف پول از طریق درگاه بانکی؛ در صورت موفقیت آدرس درگاه برمی‌گردد تا کاربر ریدایرکت شود
  async function depositViaGateway(amount) {
    depositPending.value = true
    try {
      const { procedureId, gatewayId, gatewayTitle } = await getOnlineGateway()

      const response = await $fetch(`${config.public.apiBase}/wallets/increaseBalance`, {
        method: 'POST',
        headers: headers.value,
        body: {
          currency_id: currencyId,
          selectedPaymentProcedure: procedureId,
          selectedGateway: gatewayId,
          amount
        }
      })

      if (response?.code !== 2000) {
        throw new Error(response?.msg || response?.error || 'خطا در ایجاد تراکنش واریز')
      }

      if (!['jibit', 'zibal', 'zarinpal', 'saman'].includes(gatewayTitle)) {
        throw new Error('این درگاه پرداخت پشتیبانی نمی‌شود.')
      }

      const paymentUrl =
        response.GatewayResult?.payment_url ||
        response.GatewayResult?.data?.payment_url ||
        response.GatewayResult?.url

      if (!paymentUrl) {
        throw new Error('آدرس درگاه پرداخت یافت نشد.')
      }

      return paymentUrl
    } finally {
      depositPending.value = false
    }
  }

  return {
    // state
    balance,
    transactions,
    pendingItems,
    totalDeposited,
    totalSpent,
    balancePending,
    transactionsPending,
    // actions
    fetchBalance,
    fetchTransactions,
    ensureLoaded,
    refresh,
    requestWithdraw,
    depositViaGateway,
    depositPending,
    hasEnoughBalance,
    // helpers
    formatNumber
  }
}