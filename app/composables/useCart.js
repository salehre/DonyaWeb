// app/composables/useCart.js
// سبد خرید مشترک بین چک‌اوت‌های دامنه/هاست/VPS. آیتم‌ها به‌صورت state ماژولی
// (برای واکنش‌گرایی آنی بین صفحات در طول یک نشست) + sessionStorage (برای ماندگاری
// در برابر رفرش کامل مرورگر) نگه‌داری می‌شوند. بعداً باید با سبد خرید سمت سرور
// (وابسته به حساب کاربری) جایگزین شود.

import { reactive, computed } from 'vue'
import { truncateDomainPrice } from '~/utils/domainPrice'

const CART_STORAGE_KEY = 'donyaweb_cart_v1'

const cartItems = reactive([])
let hydrated = false

function hydrate() {
  if (hydrated || !import.meta.client) return
  hydrated = true
  try {
    const stored = JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) || '[]')
    if (Array.isArray(stored)) {
      cartItems.push(...stored.map((item) => item.type === 'domain'
        ? { ...item, amount: truncateDomainPrice(item.amount, item.identifier || item.title) }
        : item))
    }
  } catch {
    // سبد ذخیره‌شده خراب یا در دسترس نیست — نادیده گرفته می‌شود
  }
}

function persist() {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  } catch {
    // مثلاً حالت خصوصی مرورگر — بی‌صدا رد می‌شویم
  }
}

const TYPE_PREFIX = { vps: 'VPS', hosting: 'CLD', domain: 'DOM' }

function generateCartId(type) {
  const prefix = TYPE_PREFIX[type] || 'ITEM'
  const rand = Math.floor(100 + Math.random() * 900)
  return `cart-${prefix}-${Date.now().toString().slice(-6)}${rand}`
}

export function useCart() {
  hydrate()

  // افزودن یک محصول (VPS/هاست/دامنه) پیکربندی‌شده به سبد
  function addItem(item) {
    const normalizedItem = item.type === 'domain'
      ? { ...item, amount: truncateDomainPrice(item.amount, item.identifier || item.title) }
      : item
    const cartItem = {
      cartId: generateCartId(item.type),
      addedAt: new Date().toISOString(),
      ...normalizedItem
    }
    cartItems.push(cartItem)
    persist()
    return cartItem
  }

  function removeItem(cartId) {
    const idx = cartItems.findIndex((i) => i.cartId === cartId)
    if (idx > -1) cartItems.splice(idx, 1)
    persist()
    return idx > -1
  }

  function clearCart() {
    cartItems.splice(0, cartItems.length)
    persist()
  }

  const itemCount = computed(() => cartItems.length)
  const totalAmount = computed(() => cartItems.reduce((sum, i) => sum + i.amount, 0))

  return {
    cartItems,
    addItem,
    removeItem,
    clearCart,
    itemCount,
    totalAmount
  }
}
