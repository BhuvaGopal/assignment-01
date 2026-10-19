import { useQuery } from 'core/react-query'
import { useEffect } from 'react'
import { Branch } from './model'
import { partyService } from './services'
import { BillFormContext, BranchPath } from './form-types'
import { AsyncPartySelect } from './async-select'

export function PartyFields({
  formCtx,
  ownerName,
  branchName,
  label,
  kind,
  required = true,
  onAddBranch,
  onQuickAdd
}: {
  formCtx: BillFormContext
  ownerName:
    | 'exporterId'
    | 'consigneeId'
    | `invoices.${number}.buyerId`
    | `invoices.${number}.thirdPartyId`
    | `invoices.${number}.items.${number}.itemThirdPartyId`
  branchName: BranchPath
  label: string
  kind: 'exporter' | 'business'
  required?: boolean
  onAddBranch: (ownerId: number) => void
  onQuickAdd: () => void
}) {
  const ownerId = formCtx.hooks.watch(ownerName)
  const { data: ownerData } = useQuery({
    queryKey: ['party', kind, String(ownerId)],
    queryFn: async () =>
      (kind === 'exporter'
        ? await partyService.getExporter(String(ownerId))
        : await partyService.getBusiness(String(ownerId))) ?? null,
    enabled: Boolean(ownerId),
    staleTime: 0,
    retry: false
  })
  const owner = ownerData ?? undefined

  useEffect(() => {
    const selectedBranch = formCtx.hooks.getValues(branchName)
    if (
      selectedBranch &&
      owner &&
      owner.branches.length > 0 &&
      !owner.branches.some((branch) => String(branch.id) === selectedBranch)
    ) {
      formCtx.hooks.setValue(branchName, '', { shouldValidate: true })
    }
  }, [branchName, formCtx.hooks, owner])

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label}</span>
          <button type="button" className="text-primary-700 text-xs font-medium hover:underline" onClick={onQuickAdd}>
            + Add new
          </button>
        </div>
        <AsyncPartySelect
          name={ownerName}
          placeholder={`Search & select ${kind}...`}
          rules={{ required }}
          fetchOptions={async (query) => {
            if (kind === 'exporter') {
              const res = await partyService.searchExporters(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name,
                sublabel: item.iec ? `IEC: ${item.iec}` : undefined
              }))
            } else {
              const res = await partyService.searchConsignees(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name
              }))
            }
          }}
          getInitialLabel={async (id) => {
            if (kind === 'exporter') {
              const item = await partyService.getExporter(id)
              return item ? item.name : ''
            } else {
              const item = await partyService.getBusiness(id)
              return item ? item.name : ''
            }
          }}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Branch / address</span>
          {owner && (
            <button
              type="button"
              className="text-primary-700 text-xs font-medium hover:underline"
              onClick={() => onAddBranch(owner.id)}>
              + Add branch
            </button>
          )}
        </div>
        <AsyncPartySelect
          name={branchName}
          placeholder={ownerId ? 'Search & select branch...' : `Choose ${kind} first`}
          disabled={!ownerId}
          rules={{ required: required || !!ownerId }}
          deps={[ownerId]}
          fetchOptions={async (query) => {
            if (!ownerId) return []
            if (kind === 'exporter') {
              const res = await partyService.searchExporterBranches(ownerId, query)
              return res.map((branch) => ({
                value: String(branch.id),
                label: `${branch.branchName} · ${branch.city}`,
                sublabel: branch.address1
              }))
            } else {
              const res = await partyService.searchBusinessBranches(ownerId, query)
              return res.map((branch) => ({
                value: String(branch.id),
                label: `${branch.branchName} · ${branch.city}`,
                sublabel: branch.address1
              }))
            }
          }}
          getInitialLabel={async (id) => {
            if (!ownerId) return ''
            const branches =
              kind === 'exporter'
                ? await partyService.searchExporterBranches(ownerId, '')
                : await partyService.searchBusinessBranches(ownerId, '')
            const branch = branches.find((b) => String(b.id) === id)
            return branch ? `${branch.branchName} · ${branch.city}` : ''
          }}
        />
      </div>
    </div>
  )
}
