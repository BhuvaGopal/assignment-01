export interface MarksAndNumbersOption {
  value: string
  label: string
}

// Dummy data source. Replace this function's implementation with the API request
// when the exporter marks endpoint is available; the form only depends on this interface.
const marksByExporter: Record<string, MarksAndNumbersOption[]> = {
  '1000': [
    { value: 'AARAV TEXTILES / MADE IN INDIA', label: 'AARAV TEXTILES / MADE IN INDIA' },
    { value: 'ATPL / LOT NO. ______', label: 'ATPL / LOT NO. ______' }
  ],
  '1002': [
    { value: 'BLUE HARBOR EXPORTS / INDIA', label: 'BLUE HARBOR EXPORTS / INDIA' },
    { value: 'BHE / SHIPPING MARKS AS PER INVOICE', label: 'BHE / SHIPPING MARKS AS PER INVOICE' }
  ]
}

export function getMarksAndNumbersOptions(exporterId: string): Promise<MarksAndNumbersOption[]> {
  return Promise.resolve(marksByExporter[exporterId] ?? [])
}
