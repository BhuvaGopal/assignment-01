import { getDemoData, saveBill } from '../demo-store'
import { SavedBill, ShippingBillFormValues } from '../model'
import { ServiceError, simulate } from './latency'

// Attach display names so the dashboard can show them without extra lookups.
function withPartyNames(values: ShippingBillFormValues): ShippingBillFormValues {
  const { exporters, businesses } = getDemoData()
  return {
    ...values,
    exporterName: exporters.find((e) => String(e.id) === values.exporterId)?.name ?? values.exporterName,
    consigneeName: businesses.find((b) => String(b.id) === values.consigneeId)?.name ?? values.consigneeName
  }
}

export const billService = {
  list: (): Promise<SavedBill[]> =>
    simulate(() =>
      getDemoData()
        .bills.map((bill) => ({ ...bill, values: withPartyNames(bill.values) }))
        .sort((a, b) => b.updated.localeCompare(a.updated))
    ),

  getById: (id: number): Promise<SavedBill> =>
    simulate(() => {
      const bill = getDemoData().bills.find((item) => item.id === id)
      if (!bill) throw new ServiceError('NOT_FOUND', `Shipping bill #${id} was not found`)
      return bill
    }),

  // Draft save: no validation, used by "Save & Next" while the bill is still incomplete.
  saveDraft: (values: ShippingBillFormValues, id?: number): Promise<SavedBill> =>
    simulate(() => saveBill(withPartyNames(values), id), 150),

  // Final save: a real API would reject these too, whatever the UI did.
  save: (values: ShippingBillFormValues, id?: number): Promise<SavedBill> =>
    simulate(() => {
      if (!values.exporterId || !values.consigneeId) {
        throw new ServiceError('VALIDATION', 'Exporter and consignee are required')
      }
      if (values.invoices.length === 0) throw new ServiceError('VALIDATION', 'At least one invoice is required')
      return saveBill(withPartyNames(values), id)
    }, 400)
}
