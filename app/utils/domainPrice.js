export function roundDomainPrice(value) {
  if (value === null || value === undefined || value === '') return value

  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount / 10000) * 10000 : value
}