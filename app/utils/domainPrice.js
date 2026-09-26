export function truncateDomainPrice(value, domain = '') {
  if (value === null || value === undefined || value === '') return value

  const amount = Number(value)
  if (String(domain).trim().toLowerCase().endsWith('.ir')) return Number.isFinite(amount) ? amount : value
  return Number.isFinite(amount) ? Math.trunc(amount / 10000) * 10000 : value
}