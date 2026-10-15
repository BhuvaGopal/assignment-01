export const routes = {
  dashboard: '/',
  shippingBillNew: '/shipping-bills/new',
  shippingBillEdit: '/shipping-bills/:id',
  toShippingBillEdit: (id: number) => `/shipping-bills/${id}`
}
