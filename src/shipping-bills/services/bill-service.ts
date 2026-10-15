import { getDemoData, saveBill } from '../demo-store'
import { SavedBill, ShippingBillFormValues } from '../model'
import { ServiceError, simulate } from './latency'

export const billService = {
  list: (): Promise<SavedBill[]> =>
    simulate(() => [...getDemoData().bills].sort((a, b) => b.updated.localeCompare(a.updated))),

  getById: (id: number): Promise<SavedBill> =>
    simulate(() => {
      const bill = getDemoData().bills.find((item) => item.id === id)
      if (!bill) throw new ServiceError('NOT_FOUND', `Shipping bill #${id} was not found`)
      return bill
    }),

  save: (values: ShippingBillFormValues, id?: number): Promise<SavedBill> =>
    simulate(() => {
      // Server-side checks: a real API would reject these too, whatever the UI did.
      if (!values.exporterId || !values.consigneeId) {
        throw new ServiceError('VALIDATION', 'Exporter and consignee are required')
      }
      if (values.invoices.length === 0) throw new ServiceError('VALIDATION', 'At least one invoice is required')

      const { exporters, businesses } = getDemoData()
      const exporterName = exporters.find((e) => String(e.id) === values.exporterId)?.name
      const consigneeName = businesses.find((b) => String(b.id) === values.consigneeId)?.name
      return saveBill({ ...values, exporterName, consigneeName }, id)
    }, 400)
}
