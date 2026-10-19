import { quantityCodes } from '@/data/quantity-code'
import schemeCodes from '@/data/scheme-codes'
import { Trades } from '@/data/trade-agrements'
import { contractTypes, paymentTypes, priceInclusionTypes } from '@/data/types'
import { s, useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { currencyOptions } from './currency-options'
import { InvoiceCharges } from './invoice-charges'
import { BillInvoiceForm, emptyItem, invoiceTotal, lineTotal, ShippingBillFormValues } from './model'
import { BillFormContext, BranchPath, dateType } from './form-types'
import { Advanced, SectionHeading } from './form-primitives'
import { PartyFields } from './party-fields'

export function InvoiceEditor({
  formCtx,
  index,
  invoice,
  onQuickAdd,
  onAddBranch,
  onRemove,
  canRemove
}: {
  formCtx: BillFormContext
  index: number
  invoice: BillInvoiceForm
  onQuickAdd: (role: 'buyer' | 'thirdParty' | 'itemThirdParty', invoiceIndex: number, itemIndex?: number) => void
  onAddBranch: (ownerId: number, branchName: BranchPath) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const { register, control } = formCtx.hooks
  const {
    fields: items,
    append: addItem,
    remove: removeItem
  } = useFieldArray({ control, name: `invoices.${index}.items` })
  const buyerSame = formCtx.hooks.watch(`invoices.${index}.buyerSameAsConsignee`)

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Invoice {index + 1}</h3>
        </div>
        {canRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove invoice
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Invoice number" {...register(`invoices.${index}.invoiceNumber`)} />
          <Input label="Invoice date" type={dateType} {...register(`invoices.${index}.invoiceDate`)} />
          <div className="flex gap-2">
            <div className="w-[100px] shrink-0">
              <Select<ShippingBillFormValues>
                label="Currency"
                name={`invoices.${index}.currency`}
                options={currencyOptions}
                rules={{ required: true }}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Total"
                type="number"
                min={0}
                {...register(`invoices.${index}.invoiceTotal`)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Select<ShippingBillFormValues>
            label="Contract"
            name={`invoices.${index}.contractType`}
            options={contractTypes}
            rules={{ required: true }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox {...register(`invoices.${index}.buyerSameAsConsignee`)} />
          Buyer & consignee are same
        </label>
        {!buyerSame && (
          <PartyFields
            formCtx={formCtx}
            ownerName={`invoices.${index}.buyerId`}
            branchName={`invoices.${index}.buyerBranchId`}
            label="Buyer"
            kind="business"
            onQuickAdd={() => onQuickAdd('buyer', index)}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.buyerBranchId`)}
          />
        )}

        <div className="space-y-4">
          <InvoiceCharges formCtx={formCtx} index={index} currency={invoice.currency} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues>
              label="Price includes"
              name={`invoices.${index}.freightInsuranceIncluded`}
              options={priceInclusionTypes}
              placeholder="Select if applicable"
            />
            <Input label="Contract / order number" {...register(`invoices.${index}.contractNumber`)} />
            <Select<ShippingBillFormValues>
              label="Payment type"
              name={`invoices.${index}.natureOfPayment`}
              options={paymentTypes}
              placeholder="Select if applicable"
            />
            <Input label="Payment period (days)" type="number" {...register(`invoices.${index}.periodOfPayment`)} />
          </div>
          <PartyFields
            formCtx={formCtx}
            ownerName={`invoices.${index}.thirdPartyId`}
            branchName={`invoices.${index}.thirdPartyBranchId`}
            label="Third party (optional)"
            kind="business"
            required={false}
            onQuickAdd={() => onQuickAdd('thirdParty', index)}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.thirdPartyBranchId`)}
          />
        </div>

        <div className="border-t border-gray-200 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionHeading title="Goods" />
            <Button size="sm" variant="outline" onClick={() => addItem(emptyItem())}>
              + Add item
            </Button>
          </div>
          <div className="space-y-4">
            {items.map((field, itemIndex) => {
              const item = invoice.items[itemIndex] ?? emptyItem()
              return (
                <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Item {itemIndex + 1}</h4>
                    {items.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeItem(itemIndex)}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    <Input
                      label="RITC / HS code"
                      {...register(`invoices.${index}.items.${itemIndex}.ritcCode`)}
                      placeholder="e.g. 61091000"
                    />
                    <Select<ShippingBillFormValues>
                      label="Scheme code"
                      name={`invoices.${index}.items.${itemIndex}.schemeCode`}
                      options={schemeCodes}
                      placeholder="Select scheme"
                    />
                    <Input
                      label="Goods description"
                      {...register(`invoices.${index}.items.${itemIndex}.goodsDescription1`)}
                      wrapClass="lg:col-span-4"
                      placeholder="e.g. Cotton T-shirts"
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      {...register(`invoices.${index}.items.${itemIndex}.quantity`)}
                    />
                    <Select<ShippingBillFormValues>
                      label="Unit"
                      name={`invoices.${index}.items.${itemIndex}.unitOfMeasurement`}
                      options={quantityCodes}
                      rules={{ required: true }}
                    />
                    <Input
                      label={`Unit price (${invoice.currency || 'currency'})`}
                      type="number"
                      {...register(`invoices.${index}.items.${itemIndex}.unitPrice`)}
                    />
                    <Input
                      label="Item Total"
                      type="number"
                      placeholder={`${invoice.currency} ${lineTotal(item).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}

                      {...register(`invoices.${index}.items.${itemIndex}.lineTotal`)}
                    />
                    <Select<ShippingBillFormValues>
                      label="IGST payment"
                      name={`invoices.${index}.items.${itemIndex}.igstPaymentStatus`}
                      options={[
                        { value: 'NA', label: 'Not applicable' },
                        { value: 'LUT', label: 'Under LUT / bond' },
                        { value: 'P', label: 'Against payment' }
                      ]}
                      placeholder="Select if applicable"
                    />
                  </div>
                  {/* Row 3: drawback inputs (conditional) + checkboxes */}
                  <div className="mb-3 flex flex-wrap items-end gap-4">
                    {(() => {
                      const selectedScheme = schemeCodes.find((s) => s.value === item.schemeCode)
                      const showDrawback =
                        selectedScheme && (selectedScheme.drawback || selectedScheme.RODTEP || selectedScheme.ROSCTL)
                      return showDrawback ? (
                        <>
                          <div className="w-36">
                            <Input
                              label="Drawback Serial no."
                              {...register(`invoices.${index}.items.${itemIndex}.drawbackSerialNumber`)}
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              label="Drawback Unit"
                              {...register(`invoices.${index}.items.${itemIndex}.drawbackUnit`)}
                            />
                          </div>
                          <div className="w-36">
                            <Input
                              label="Drawback Quantity"
                              type="number"
                              {...register(`invoices.${index}.items.${itemIndex}.drawbackQuantity`)}
                            />
                          </div>
                        </>
                      ) : null
                    })()}
                    <label className="flex items-center gap-2 pb-1 text-sm">
                      <Checkbox {...register(`invoices.${index}.items.${itemIndex}.rewardItem`)} />
                      Claim reward
                    </label>
                    <label className="flex items-center gap-2 pb-1 text-sm">
                      <Checkbox {...register(`invoices.${index}.items.${itemIndex}.thirdPartyItem`)} />
                      Third-party item
                    </label>
                  </div>
                  {item.thirdPartyItem && (
                    <div className="my-4">
                      <PartyFields
                        formCtx={formCtx}
                        ownerName={`invoices.${index}.items.${itemIndex}.itemThirdPartyId`}
                        branchName={`invoices.${index}.items.${itemIndex}.itemThirdPartyBranchId`}
                        label="Item third party"
                        kind="business"
                        onQuickAdd={() => onQuickAdd('itemThirdParty', index, itemIndex)}
                        onAddBranch={(ownerId) =>
                          onAddBranch(ownerId, `invoices.${index}.items.${itemIndex}.itemThirdPartyBranchId`)
                        }
                      />
                    </div>
                  )}
                  <Advanced title="Item customs, taxes and incentives">
                    <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Select<ShippingBillFormValues>
                        label="Unit of rate"
                        {...register(`invoices.${index}.items.${itemIndex}.unitOfRate`)}
                        options={quantityCodes}
                        placeholder={invoice.items[itemIndex].unitOfMeasurement}
                      />
                      <Input
                        label="Per Unit (Rate)"
                        type="number"
                        placeholder="1"
                        {...register(`invoices.${index}.items.${itemIndex}.numberOfUnits`)}
                      />
                      <Input
                        label="Present market value"
                        type="number"
                        {...register(`invoices.${index}.items.${itemIndex}.presentMarketValue`)}
                      />
                      <Input label="GCess" type="number" {...register(`invoices.${index}.items.${itemIndex}.cess`)} />
                      <Input
                        label="Accessories description"
                        wrapClass="lg:col-span-3"
                        {...register(`invoices.${index}.items.${itemIndex}.accessoriesDescription`)}
                      />
                      <Select<ShippingBillFormValues>
                        label="Accessory status"
                        name={`invoices.${index}.items.${itemIndex}.accessoryStatus`}
                        options={[
                          { value: '0', label: 'No accessory' },
                          { value: '1', label: 'Included free of cost' },
                          { value: '2', label: 'Entered separately' }
                        ]}
                        placeholder="Select if relevant"
                      />
                      {item.igstPaymentStatus === 'P' && (
                        <>
                          <Input
                            label="Taxable value"
                            type="number"
                            {...register(`invoices.${index}.items.${itemIndex}.taxableValue`)}
                          />
                          <Input
                            label="IGST amount"
                            type="number"
                            {...register(`invoices.${index}.items.${itemIndex}.igstAmount`)}
                          />
                        </>
                      )}

                      <Input
                        label="Origin district code"
                        {...register(`invoices.${index}.items.${itemIndex}.originDistrictCode`)}
                      />
                      <Select<ShippingBillFormValues>
                        label="Trade agreement code"
                        name={`invoices.${index}.items.${itemIndex}.tradeAgreementsCode`}
                        options={Trades}
                        placeholder="NCPTI"
                      />
                      <Input label="End use code" {...register(`invoices.${index}.items.${itemIndex}.endUseOfItem`)} />
                      <Input
                        label="Packages for item"
                        type="number"
                        {...register(`invoices.${index}.items.${itemIndex}.totalPackage`)}
                      />
                    </div>
                    <Advanced title="AR4 / excise details">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Input label="AR4 number" {...register(`invoices.${index}.items.${itemIndex}.ar4Number`)} />
                        <Input
                          label="AR4 date"
                          type={dateType}
                          {...register(`invoices.${index}.items.${itemIndex}.ar4Date`)}
                        />
                      </div>
                    </Advanced>
                  </Advanced>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-right text-sm font-semibold">
          Invoice total: {invoice.currency}{' '}
          {invoiceTotal(invoice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  )
}
