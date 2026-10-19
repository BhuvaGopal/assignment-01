import { routes } from '@/shared/route-paths'
import { downloadFlatFile } from '@/shipping-bills/flat-file'
import { invoiceTotal, SavedBill } from '@/shipping-bills/model'
import { billService, billsQueryKey, ServiceError } from '@/shipping-bills/services'
import { useQuery } from 'core/react-query'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useState } from 'react'
import { Badge } from 'ui/basic/badge'
import { Button } from 'ui/basic/button'
import { Card, CardContent } from 'ui/basic/card'
import { Table } from 'ui/basic/table'
import { Input } from 'ui/inputs/input'

function formatDate(value?: string) {
  const date = value ? new Date(value) : undefined
  return date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '—'
}

function matchesSearch(bill: SavedBill, search: string) {
  const { values } = bill
  return [
    bill.id,
    values.jobNumber,
    values.exporterName,
    values.consigneeName,
    ...values.invoices.map((i) => i.invoiceNumber)
  ]
    .join(' ')
    .toLowerCase()
    .includes(search.toLowerCase())
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function ListDashboard() {
  const [search, setSearch] = useState('')
  // staleTime 0: always refetch on mount so bills saved in the form show up (the app default is Infinity).
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: billsQueryKey,
    queryFn: billService.list,
    staleTime: 0,
    retry: false
  })

  const bills = data ?? []
  const filtered = bills.filter((bill) => matchesSearch(bill, search))
  const countDistinct = (pick: (bill: SavedBill) => string | undefined) => new Set(bills.map(pick).filter(Boolean)).size

  function handleDownload(bill: SavedBill) {
    try {
      downloadFlatFile(bill)
      toast.success(`Flat file generated for #${bill.values.jobNumber || bill.id}`)
    } catch {
      toast.error('Failed to generate flat file')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Shipping bills</h1>
          <p className="mt-1 text-sm text-gray-500">Create and continue the shipping bill step of each export job.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => navigate(routes.shippingBillNew)}>+ New shipping bill</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Shipping bills" value={bills.length} />
        <StatCard label="Exporters" value={countDistinct((b) => b.values.exporterName)} />
        <StatCard label="Consignees" value={countDistinct((b) => b.values.consigneeName)} />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-full max-w-sm">
              <Input
                label="Search bills"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Job, invoice, exporter or consignee"
              />
            </div>
            <span className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'bill' : 'bills'}
            </span>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">Loading shipping bills...</div>
          ) : isError ? (
            <div className="rounded-lg border border-dashed border-red-300 p-10 text-center">
              <p className="font-medium">Could not load shipping bills</p>
              <p className="mt-1 text-sm text-gray-500">
                {error instanceof ServiceError ? error.message : 'Something went wrong.'}
              </p>
              <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : filtered.length ? (
            <Table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Exporter → Consignee</th>
                  <th>Route</th>
                  <th>Invoices</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => {
                  const total = bill.values.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
                  return (
                    <tr key={bill.id}>
                      <td className="font-medium">
                        {bill.values.jobNumber ? `#${bill.values.jobNumber}` : `Bill #${bill.id}`}
                        <span className="block text-xs font-normal text-gray-500">{bill.values.jobDate}</span>
                      </td>
                      <td>
                        {bill.values.exporterName || '—'}
                        <span className="block text-xs text-gray-500">to {bill.values.consigneeName || '—'}</span>
                      </td>
                      <td>
                        {bill.values.loadingPort || '—'} → {bill.values.finalDestinationPort || '—'}
                      </td>
                      <td>
                        {bill.values.invoices.length}
                        <span className="block text-xs text-gray-500">
                          {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} across items
                        </span>
                      </td>
                      <td>
                        <Badge variant="secondary">Draft</Badge>
                      </td>
                      <td>{formatDate(bill.updated)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownload(bill)}>
                            Flat File
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(routes.toShippingBillEdit(bill.id))}>
                            Open
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
              <p className="font-medium">{search ? 'No matching shipping bills' : 'No shipping bills yet'}</p>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'Try another job number or party name.' : 'Create a bill to start an export job.'}
              </p>
              {!search && (
                <Button className="mt-4" onClick={() => navigate(routes.shippingBillNew)}>
                  Create shipping bill
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
