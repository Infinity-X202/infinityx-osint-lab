const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const keep = Math.min(4, Math.max(1, user.length - 3))
  return `${user.slice(0, keep)}***@${domain}`
}

export function maskPhone(phone: string) {
  return phone.replace(/\d(?=\d{4})/g, '*')
}

export function redactValue(value: string, kind: 'email' | 'phone' | 'generic') {
  if (kind === 'email') return maskEmail(value)
  if (kind === 'phone') return maskPhone(value)
  if (value.length <= 4) return '****'
  return `${value.slice(0, 2)}***${value.slice(-2)}`
}

export function isLikelyEmail(value: string) {
  return EMAIL_RE.test(value)
}

export function sanitizePlain(value: string, max = 240) {
  return value.replace(/[<>]/g, '').slice(0, max).trim()
}
