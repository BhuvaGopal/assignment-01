import { getDemoData, saveBranch, saveBusiness, saveExporter } from '../demo-store'
import { Branch, Business, Exporter } from '../model'
import { ServiceError, simulate } from './latency'

const norm = (value: string) => value.trim().toLowerCase()

function filterBranches(branches: Branch[], query: string) {
  const q = norm(query)
  return branches.filter((b) => norm(b.branchName).includes(q) || norm(b.city).includes(q))
}

export const partyService = {
  searchExporters: (query: string): Promise<Exporter[]> =>
    simulate(() =>
      getDemoData().exporters.filter(
        (e) => !e.disabled && (norm(e.name).includes(norm(query)) || norm(e.iec).includes(norm(query)))
      )
    ),

  searchConsignees: (query: string): Promise<Business[]> =>
    simulate(() => getDemoData().businesses.filter((b) => b.isConsignee && norm(b.name).includes(norm(query)))),

  getExporter: (id: string): Promise<Exporter | undefined> =>
    simulate(() => getDemoData().exporters.find((e) => String(e.id) === id), 100),

  getBusiness: (id: string): Promise<Business | undefined> =>
    simulate(() => getDemoData().businesses.find((b) => String(b.id) === id), 100),

  searchExporterBranches: (exporterId: string, query: string): Promise<Branch[]> =>
    simulate(() => {
      const owner = getDemoData().exporters.find((e) => String(e.id) === exporterId)
      return owner ? filterBranches(owner.branches, query) : []
    }),

  searchBusinessBranches: (businessId: string, query: string): Promise<Branch[]> =>
    simulate(() => {
      const owner = getDemoData().businesses.find((b) => String(b.id) === businessId)
      return owner ? filterBranches(owner.branches, query) : []
    }),

  createExporter: (input: Parameters<typeof saveExporter>[0]) => simulate(() => saveExporter(input)),
  createBusiness: (input: Parameters<typeof saveBusiness>[0]) => simulate(() => saveBusiness(input)),

  saveBranch: (kind: 'exporter' | 'business', ownerId: number, branch: Omit<Branch, 'id'> & { id?: number }) =>
    simulate(() => {
      const list = kind === 'exporter' ? getDemoData().exporters : getDemoData().businesses
      if (!list.some((owner) => owner.id === ownerId)) throw new ServiceError('NOT_FOUND', 'Party no longer exists')
      return saveBranch(kind, ownerId, branch)
    })
}
