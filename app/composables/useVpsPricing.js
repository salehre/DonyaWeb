// نرخ‌های واحد قیمت‌گذاری VPS (ماهانه، تومان) — منبع مشترک بین کارت‌های پلن
// (VpsPlans) و صفحه‌ی سفارش سفارشی (checkout-vps)، برگرفته از vps-configurator.html
// ⚠️ برای تغییر قیمت‌ها فقط همین مقادیر رو ویرایش کن، همه‌جای سایت خودکار آپدیت می‌شه

export const VPS_PRICE_CPU = 150000   // به ازای هر vCPU
export const VPS_PRICE_RAM = 120000   // به ازای هر گیگابایت رم
export const VPS_PRICE_DISK = 4000    // به ازای هر گیگابایت فضای ذخیره‌سازی
export const VPS_PRICE_IP = 100000    // به ازای هر IPv4 اضافه (اولین IP رایگان است)

// محدوده‌ی مجاز اسلایدرها (دقیقاً مطابق vps-configurator.html)
export const VPS_LIMITS = {
  cpu: { min: 1, max: 64, step: 1 },
  ram: { min: 2, max: 128, step: 2 },
  storage: { min: 20, max: 2040, step: 10 },
  ip: { min: 1, max: 6, step: 1 }
}

export function calcVpsPrice({ cpu = 0, ram = 0, storage = 0, ip = 1 } = {}) {
  const extraIps = Math.max(0, ip - 1)
  return (
    cpu * VPS_PRICE_CPU +
    ram * VPS_PRICE_RAM +
    storage * VPS_PRICE_DISK +
    extraIps * VPS_PRICE_IP
  )
}

export function formatVpsPrice(value) {
  return Math.round(Number(value) || 0).toLocaleString('fa-IR')
}

export function formatVpsStorage(gb) {
  return gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${gb} GB`
}