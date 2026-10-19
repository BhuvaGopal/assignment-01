import { documentCodes } from '@/data/e-sanchit-codes'
import { getMarksAndNumbersOptions, MarksAndNumbersOption } from '../marks-and-numbers-source'
import { countries, loadingPorts, PortOption, ports } from '../model'
import { simulate } from './latency'

interface LabelledOption {
  value: string
  label: string
}

const fileTypes: LabelledOption[] = [{ value: 'pdf', label: 'PDF' }]

function matchesPort(port: PortOption, query: string) {
  const q = query.trim().toLowerCase()
  return port.name.toLowerCase().includes(q) || port.code.toLowerCase().includes(q)
}

function matchesOption(option: LabelledOption, query: string) {
  const q = query.trim().toLowerCase()
  return option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q)
}

function labelFor(options: LabelledOption[], value: string) {
  return options.find((option) => option.value === value || option.label === value)?.label ?? value
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

  searchDocumentTypes: (query: string): Promise<LabelledOption[]> =>
    simulate(() =>
      documentCodes.filter((doc) => matchesOption(doc, query)).map((doc) => ({ value: doc.value, label: doc.label }))
    ),

  getDocumentTypeLabel: (value: string): Promise<string> => simulate(() => labelFor(documentCodes, value), 100),

  searchFileTypes: (query: string): Promise<LabelledOption[]> =>
    simulate(() => fileTypes.filter((type) => matchesOption(type, query))),

  getFileTypeLabel: (value: string): Promise<string> => simulate(() => labelFor(fileTypes, value), 100),

  async getMarksAndNumbers(exporterId: string): Promise<MarksAndNumbersOption[]> {
    await simulate(() => undefined)
    return getMarksAndNumbersOptions(exporterId)
  }
}
