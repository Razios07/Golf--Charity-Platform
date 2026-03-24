import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

export function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMonth(monthKey) {
  if (!monthKey) return '—'
  return new Date(`${monthKey}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function getStatusColor(status) {
  const map = {
    active:    'text-green-400 bg-green-400/10 border-green-400/20',
    inactive:  'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
    lapsed:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
    pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    approved:  'text-green-400 bg-green-400/10 border-green-400/20',
    rejected:  'text-red-400 bg-red-400/10 border-red-400/20',
    paid:      'text-blue-400 bg-blue-400/10 border-blue-400/20',
    published: 'text-green-400 bg-green-400/10 border-green-400/20',
    simulated: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  }
  return map[status] || 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20'
}
