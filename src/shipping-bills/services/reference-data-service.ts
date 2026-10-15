import { getMarksAndNumbersOptions, MarksAndNumbersOption } from '../marks-and-numbers-source'
import { countries, loadingPorts, PortOption, ports } from '../model'
import { simulate } from './latency'

function matchesPort(port: PortOption, query: string) {
  const q = query.trim().toLowerCase()
  return port.name.toLowerCase().includes(q) || port.code.toLowerCase().includes(q)
}

export const referenceDataService = {
  searchLoadingPorts: (query: string): Promise<PortOption[]> =>
    simulate(() => loadingPorts.filter((port) => matchesPort(port, query))),

  searchDestinationPorts: (query: string): Promise<PortOption[]> =>
    simulate(() => ports.filter((port) => matchesPort(port, query))),

  // Looks in both lists so Indian loading ports resolve to a label too.
  getPort: (code: string): Promise<PortOption | undefined> =>
    simulate(() => [...loadingPorts, ...ports].find((port) => port.code === code), 100),

  listCountries: () => simulate(() => countries, 100),

  async getMarksAndNumbers(exporterId: string): Promise<MarksAndNumbersOption[]> {
    await simulate(() => undefined)
    return getMarksAndNumbersOptions(exporterId)
  }
}
