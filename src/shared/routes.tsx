import ListDashboard from '@/dashboard/list-dashboard'
import { ApplicationLayout } from '@/shared/application-layout'
import { Route, RouteObject } from 'core/routing/route-utils'
import { routes } from './route-paths'

const homeWrapper = <ApplicationLayout />

export const routeObjects: RouteObject[] = [
  Route(routes.dashboard, <ListDashboard />, 'Shipping Bills', homeWrapper),
  Route('/shipping-bills/new', () => import('@/shipping-bills/shipping-bill-form'), 'New Shipping Bill', homeWrapper),
  Route('/shipping-bills/:id', () => import('@/shipping-bills/shipping-bill-form'), 'Shipping Bill', homeWrapper),
  // Misc
  Route('*', () => import('core/components/404-page'), 'Not Found')
]
