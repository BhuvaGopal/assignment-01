import { useForm } from 'core/form'
import { ports, ShippingBillFormValues } from './model'

export type BillFormContext = ReturnType<typeof useForm<ShippingBillFormValues>>

export type BranchPath =
  | 'exporterBranchId'
  | 'consigneeBranchId'
  | `invoices.${number}.buyerBranchId`
  | `invoices.${number}.thirdPartyBranchId`
  | `invoices.${number}.items.${number}.itemThirdPartyBranchId`

export const portOptions = ports.map((port) => ({ value: port.code, label: `${port.name} · ${port.code}` }))

export const dateType = 'date' as 'text'
