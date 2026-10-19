import { useForm } from 'core/form'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { currencyOptions } from './currency-options'
import { ShippingBillFormValues } from './model'

type BillFormContext = ReturnType<typeof useForm<ShippingBillFormValues>>
type ChargeKey = 'freight' | 'insurance' | 'commission' | 'discount' | 'otherDeductions'

function hasValue(value?: string) {
  return value != null && value !== ''
}

interface ChargeRowProps {
  formCtx: BillFormContext
  index: number
  chargeKey: ChargeKey
  label: string
  currency: string
}

// One charge line: either a % rate or a flat amount (entering one disables the other), plus a currency.
function ChargeRow({ formCtx, index, chargeKey, label, currency }: ChargeRowProps) {
  const { register, watch } = formCtx.hooks
  const rate = watch(`invoices.${index}.${chargeKey}Rate`)
  const amount = watch(`invoices.${index}.${chargeKey}Amount`)

  return (
    <div className="p-2">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <span className="w-28 shrink-0 font-medium text-gray-900">{label}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            {...register(`invoices.${index}.${chargeKey}Rate`)}
            className="text-right"
            disabled={hasValue(amount)}
            placeholder="Rate"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
        <Input
          type="number"
          {...register(`invoices.${index}.${chargeKey}Amount`)}
          className="py-1 text-right"
          disabled={hasValue(rate)}
          placeholder="Amount"
        />
        <Select<ShippingBillFormValues>
          name={`invoices.${index}.${chargeKey}Currency`}
          options={currencyOptions}
          placeholder={currency}
        />
      </div>
    </div>
  )
}

function ChargeRowPair({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">{children}</div>
  )
}

interface InvoiceChargesProps {
  formCtx: BillFormContext
  index: number
  currency: string
}

export function InvoiceCharges({ formCtx, index, currency }: InvoiceChargesProps) {
  const { register } = formCtx.hooks
  const row = { formCtx, index, currency }

  return (
    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
      <ChargeRowPair>
        <ChargeRow {...row} chargeKey="freight" label="Freight" />
        <ChargeRow {...row} chargeKey="insurance" label="Insurance" />
      </ChargeRowPair>
      <ChargeRowPair>
        <ChargeRow {...row} chargeKey="commission" label="Commission" />
        <ChargeRow {...row} chargeKey="discount" label="Discount" />
      </ChargeRowPair>
      <ChargeRowPair>
        <ChargeRow {...row} chargeKey="otherDeductions" label="Other Deductions" />
        <div className="p-2">
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <span className="w-28 shrink-0 font-medium text-gray-900">Packing Charges</span>
            <Input
              type="number"
              {...register(`invoices.${index}.packingCharges`)}
              className="py-1 text-right"
              placeholder="Amount"
            />
            <span className="w-14 text-sm text-gray-500">—</span>
          </div>
        </div>
      </ChargeRowPair>
    </div>
  )
}
