import { BillItemForm, BillInvoiceForm } from './types'
import { ports } from './reference-data'

export function portCountry(code?: string) {
  return ports.find((port) => port.code === code)?.countryCode ?? code?.match(/^[A-Z]{2}/)?.[0] ?? ''
}

export function lineTotal(item: BillItemForm) {
  if (item.lineTotal != null && item.lineTotal.trim() !== '') return Number(item.lineTotal)
  return Number(item.quantity) * Number(item.unitPrice)
}

export function invoiceTotal(invoice: BillInvoiceForm) {
  return invoice.items.reduce((sum, item) => sum + lineTotal(item), 0)
}
