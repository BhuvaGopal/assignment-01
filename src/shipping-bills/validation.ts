import { portCountry } from './model'

// Pure rule functions: return an error message, or undefined when the value is fine.
function toNumber(value?: string) {
  return value == null || value.trim() === '' ? undefined : Number(value)
}

export function netWeightError(net?: string, gross?: string): string | undefined {
  const n = toNumber(net)
  const g = toNumber(gross)
  if (n !== undefined && g !== undefined && n > g) return 'Net weight cannot exceed gross weight'
  return undefined
}

export function loadingPortError(port?: string): string | undefined {
  if (port && portCountry(port) !== 'IN') return 'Port of loading must be an Indian port'
  return undefined
}

export function destinationPortError(destination?: string, loading?: string): string | undefined {
  if (destination && loading && destination === loading) return 'Destination must differ from the port of loading'
  return undefined
}

// ISO yyyy-mm-dd strings compare correctly as plain strings.
export function invoiceDateError(invoiceDate?: string, jobDate?: string): string | undefined {
  if (invoiceDate && jobDate && invoiceDate > jobDate) return 'Invoice date cannot be after the job date'
  return undefined
}

export function rbiWaiverDateError(date?: string, waiverNumber?: string): string | undefined {
  if (waiverNumber?.trim() && !date) return 'Required when an RBI waiver number is entered'
  return undefined
}

export function packingRangeError(from?: string, to?: string): string | undefined {
  const f = toNumber(from)
  const t = toNumber(to)
  if (f !== undefined && t !== undefined && f > t) return '"To" must be greater than or equal to "From"'
  return undefined
}
