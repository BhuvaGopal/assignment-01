import { routes } from '@/shared/route-paths'

// Later workflow parts can add a route here when their screens are available.
export interface WorkflowStep {
  id: string
  title: string
  description: string
  route?: (billId: number) => string
}

export const workflowSteps: WorkflowStep[] = [
  {
    id: 'shipping-bill',
    title: 'Shipping bill',
    description: 'Current step',
    route: routes.toShippingBillEdit
  },
  { id: 'document-review', title: 'Document review', description: 'Planned' },
  { id: 'customs-filing', title: 'Customs filing', description: 'Planned' },
  { id: 'shipment-tracking', title: 'Shipment tracking', description: 'Planned' }
]
