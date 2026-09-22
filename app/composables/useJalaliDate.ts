export function useJalaliDate() {
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const toJalaliDate = (
    date: string | Date,
    withTime = true
  ) => {
    if (!date) return ''

    const d = new Date(date)

    if (isNaN(d.getTime())) return ''

    const datePart = formatter.format(d)

    if (!withTime) {
      return datePart
    }

    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    const time = `${hour}:${minute}`.replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])

    return `${datePart} - ${time}`
  }

  return {
    toJalaliDate,
  }
}