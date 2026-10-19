import { SavedBill } from './model'

function clean(value?: string) {
  return (value ?? '').replace(/[\^\r\n]+/g, ' ')
}

// Builds the .sb flat file text from a saved bill. Pure function: easy to unit test.
export function generateFlatFileContent(bill: SavedBill): string {
  const v = bill.values
  const port = v.loadingPort || 'INMUN1'
  const lines: string[] = []

  lines.push(`HREC**ZZ*${port}*ZZ*ICEGATE*01*SB*1.0*`)
  lines.push('<TABLE>SHIPPING_BILL')
  lines.push(
    '<F>MESSAGE_TYPE^CHA_ID^JOB_NO^JOB_DATE^EXPORTER_ID^EXPORTER_BRANCH^CONSIGNEE_ID^LOADING_PORT^DEST_PORT^DISCHARGE_PORT^SEAL_TYPE^NATURE_OF_CARGO^GROSS_WEIGHT^NET_WEIGHT^UOM^PACKAGES^MARKS'
  )
  lines.push(
    [
      'F',
      1000,
      v.jobNumber ?? bill.id,
      v.jobDate || '',
      v.exporterId || '',
      v.exporterBranchId || '',
      v.consigneeId || '',
      v.loadingPort || '',
      v.finalDestinationPort || '',
      v.dischargePort ?? v.finalDestinationPort || '',
      v.sealType ?? '',
      v.natureOfCargo || '',
      v.grossWeight ?? '',
      v.netWeight ?? '',
      v.measurementUnit || 'KGS',
      v.totalPackages ?? '',
      clean(v.marksAndNumbers)
    ]
      .join('^')
      .replace(/^/, '<R>')
  )

  if (v.invoices.length > 0) {
    lines.push('<TABLE>INVOICE')
    lines.push('<F>INVOICE_SN^INVOICE_NO^INVOICE_DATE^CURRENCY^CONTRACT_TYPE^BUYER_ID^FREIGHT_AMOUNT^INSURANCE_AMOUNT')
    v.invoices.forEach((inv, idx) => {
      const buyer = inv.buyerSameAsConsignee ? v.consigneeId : inv.buyerId
      lines.push(
        `<R>${idx + 1}^${inv.invoiceNumber}^${inv.invoiceDate || ''}^${inv.currency || 'USD'}^${inv.contractType || '1'}^${buyer || ''}^${inv.freightAmount ?? 0}^${inv.insuranceAmount ?? 0}`
      )
    })

    lines.push('<TABLE>ITEM')
    lines.push('<F>INVOICE_SN^ITEM_SN^RITC_CODE^DESCRIPTION^QUANTITY^UOM^UNIT_PRICE^LINE_TOTAL^SCHEME_CODE')
    v.invoices.forEach((inv, invIdx) => {
      inv.items.forEach((item, itemIdx) => {
        const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        lines.push(
          `<R>${invIdx + 1}^${itemIdx + 1}^${item.ritcCode || ''}^${clean(item.goodsDescription1)}^${item.quantity || ''}^${item.unitOfMeasurement || 'PCS'}^${item.unitPrice || ''}^${total.toFixed(2)}^${item.schemeCode ?? ''}`
        )
      })
    })
  }

  if (v.packingRanges.length > 0) {
    lines.push('<TABLE>PACKING')
    lines.push('<F>FROM_PKG^TO_PKG^PKG_CODE')
    v.packingRanges.forEach((pkg) => {
      lines.push(`<R>${pkg.packingNumberFrom}^${pkg.packingNumberTo}^${pkg.packingCode ?? 'CTN'}`)
    })
  }

  lines.push(`TREC**ZZ*${port}*ZZ*ICEGATE*01*SB*1.0*`)
  return lines.join('\r\n')
}

// Browser-only helper: turns the generated text into a file download.
export function downloadFlatFile(bill: SavedBill) {
  const blob = new Blob([generateFlatFileContent(bill)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `shipping_bill_${bill.values.jobNumber ?? bill.id}.sb`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
