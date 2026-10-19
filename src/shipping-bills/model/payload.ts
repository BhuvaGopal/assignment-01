import { ShippingBillFormValues } from './types'
import { portCountry, lineTotal, invoiceTotal } from './calculations'

function optionalNumber(value?: any) {
  if (typeof value === 'number') return value
  return value != null && String(value).trim() !== '' ? Number(value) : undefined
}

// Form values contain only editable fields. Resolve references and calculated values at the save boundary.
export function toShippingBillPayload(values: ShippingBillFormValues) {
  const dischargePort =
    typeof values.dischargePort === 'string' && values.dischargePort.trim()
      ? values.dischargePort
      : values.finalDestinationPort
  return {
    shipping_bill: {
      job_number: optionalNumber(values.jobNumber),
      job_date: values.jobDate,
      exporter: Number(values.exporterId),
      exporter_branch: Number(values.exporterBranchId),
      consignee: Number(values.consigneeId),
      consignee_address: Number(values.consigneeBranchId),
      loading_port: values.loadingPort,
      loading_port_code: values.loadingPort,
      loading_country_code: portCountry(values.loadingPort),
      final_destination_port: values.finalDestinationPort,
      final_destination_country_code: portCountry(values.finalDestinationPort),
      discharge_port: dischargePort,
      discharge_country_code: portCountry(dischargePort),
      origin_state_code: optionalNumber(values.originStateCode),
      nfei_category: optionalNumber(values.nfeiCategory),
      rbi_waiver_number: values.rbiWaiverNumber,
      rbi_waiver_date: values.rbiWaiverDate,
      sealtype: values.sealType,
      natureofcargo: values.natureOfCargo,
      grossweight: optionalNumber(values.grossWeight),
      netweight: optionalNumber(values.netWeight),
      measurement_unit: values.measurementUnit,
      total_packages: optionalNumber(values.totalPackages),
      marks_and_numbers: values.marksAndNumbers,
      loose_packets: optionalNumber(values.loosePackets),
      number_of_containers:
        values.containers.length > 0 ? values.containers.length : (optionalNumber(values.numberOfContainers) ?? 0),
      mawb_number: values.mawbNumber,
      hawb_number: values.hawbNumber
    },
    invoices: values.invoices.map((invoice, index) => ({
      serial_number: index + 1,
      invoicenumber: invoice.invoiceNumber,
      date: invoice.invoiceDate,
      currency: invoice.currency,
      contract_type: invoice.contractType,
      buyer: Number(invoice.buyerSameAsConsignee ? values.consigneeId : invoice.buyerId),
      buyer_address: Number(invoice.buyerSameAsConsignee ? values.consigneeBranchId : invoice.buyerBranchId),
      third_party: optionalNumber(invoice.thirdPartyId),
      third_party_address: optionalNumber(invoice.thirdPartyBranchId),
      freight_rate: optionalNumber(invoice.freightRate),
      freight_amount: optionalNumber(invoice.freightAmount),
      freight_currency: invoice.freightCurrency?.trim() ? invoice.freightCurrency : invoice.currency,
      insurance_rate: optionalNumber(invoice.insuranceRate),
      insurance_amount: optionalNumber(invoice.insuranceAmount),
      insurance_currency: invoice.insuranceCurrency?.trim() ? invoice.insuranceCurrency : invoice.currency,
      commission_rate: optionalNumber(invoice.commissionRate),
      commission_amount: optionalNumber(invoice.commissionAmount),
      commission_currency: invoice.commissionCurrency?.trim() ? invoice.commissionCurrency : invoice.currency,
      discount_rate: optionalNumber(invoice.discountRate),
      discount_amount: optionalNumber(invoice.discountAmount),
      discount_currency: invoice.discountCurrency?.trim() ? invoice.discountCurrency : invoice.currency,
      other_deductions_rate: optionalNumber(invoice.otherDeductionsRate),
      other_deductions_amount: optionalNumber(invoice.otherDeductionsAmount),
      other_deductions_currency: invoice.otherDeductionsCurrency?.trim()
        ? invoice.otherDeductionsCurrency
        : invoice.currency,
      packing_charges: optionalNumber(invoice.packingCharges),
      freight_insaurance_included: invoice.freightInsuranceIncluded,
      contract_number: invoice.contractNumber,
      nature_of_payment: invoice.natureOfPayment,
      period_of_payment: optionalNumber(invoice.periodOfPayment),
      invoice_total:
        invoice.invoiceTotal != null && invoice.invoiceTotal.trim() !== ''
          ? Number(invoice.invoiceTotal)
          : invoiceTotal(invoice),
      items: invoice.items.map((item, itemIndex) => ({
        item_serial_number: itemIndex + 1,
        ritc_code: item.ritcCode,
        goods_description_1: item.goodsDescription1,
        goods_description_2: item.goodsDescription2,
        goods_description_3: item.goodsDescription3,
        accessories_description: item.accessoriesDescription,
        scheme_code: item.schemeCode,
        quantity: Number(item.quantity),
        unit_of_measurement: item.unitOfMeasurement,
        unit_price: Number(item.unitPrice),
        unit_of_rate: item.unitOfRate?.trim() ? item.unitOfRate : item.unitOfMeasurement,
        line_total: lineTotal(item),
        present_market_value: optionalNumber(item.presentMarketValue),
        no_of_units: optionalNumber(item.numberOfUnits),
        accessory_status: item.accessoryStatus,
        third_party: item.thirdPartyItem,
        igst_payment_status: item.igstPaymentStatus,
        taxable_value: item.igstPaymentStatus === 'P' ? optionalNumber(item.taxableValue) : undefined,
        igst_amount: item.igstPaymentStatus === 'P' ? optionalNumber(item.igstAmount) : undefined,
        drawback_serial_number: item.drawbackSerialNumber,
        drawback_quantity: optionalNumber(item.drawbackQuantity),
        rodtep: optionalNumber(item.rodtep),
        cess: optionalNumber(item.cess),
        origin_district_code: optionalNumber(item.originDistrictCode),
        trade_agreements_code: item.tradeAgreementsCode,
        end_use_of_item: item.endUseOfItem,
        total_package: optionalNumber(item.totalPackage),
        reward_item: item.rewardItem
      }))
    })),
    invoice_item_third_parties: values.invoices.flatMap((invoice, invoiceIndex) =>
      invoice.items.flatMap((item, itemIndex) =>
        item.thirdPartyItem && item.itemThirdPartyId
          ? [
              {
                invoice_serial_number: invoiceIndex + 1,
                item_serial_number: itemIndex + 1,
                third_party: Number(item.itemThirdPartyId),
                third_party_address: optionalNumber(item.itemThirdPartyBranchId)
              }
            ]
          : []
      )
    ),
    ar4_details: values.invoices.flatMap((invoice, invoiceIndex) =>
      invoice.items.flatMap((item, itemIndex) =>
        item.ar4Number
          ? [
              {
                invoice_serial_number: invoiceIndex + 1,
                item_serial_number: itemIndex + 1,
                ar4_number: item.ar4Number,
                ar4_date: item.ar4Date,
                commissionerate: item.ar4Commissionerate,
                division: item.ar4Division,
                range: item.ar4Range,
                remarks: item.ar4Remarks
              }
            ]
          : []
      )
    ),
    container_details: values.containers.map((container) => ({
      container_number: container.containerNumber,
      container_size: optionalNumber(container.containerSize),
      excise_seal_number: container.exciseSealNumber,
      seal_date: container.sealDate,
      seal_type: container.sealType,
      seal_device_id: container.sealDeviceId,
      movement_document_type: container.movementDocumentType,
      movement_document_number: container.movementDocumentNumber
    })),
    packging_list: values.packingRanges.map((range) => ({
      packing_number_from: optionalNumber(range.packingNumberFrom),
      packing_number_to: optionalNumber(range.packingNumberTo),
      packing_code: range.packingCode
    })),
    supporting_docs: values.documents.map((document, index) => ({
      serial_number: index + 1,
      invoice_serial_number: optionalNumber(document.invoiceSerialNumber),
      item_serial_number: optionalNumber(document.itemSerialNumber),
      document_type_code: document.documentTypeCode,
      document_reference_number: document.documentReferenceNumber,
      image_reference_number: document.imageReferenceNumber,
      document_issue_date: document.documentIssueDate
        ? Math.floor(new Date(document.documentIssueDate).getTime() / 86400000)
        : undefined,
      document_expiry_date: document.documentExpiryDate,
      place_of_issue: document.placeOfIssue,
      issuing_party_code: document.issuingPartyCode,
      issue_party_name: document.issuingPartyName,
      issuing_party_name_addr1: document.issuingPartyAddress1,
      issuing_party_name_addr2: document.issuingPartyAddress2,
      issuing_party_name_city: document.issuingPartyCity,
      issuing_party_name_pin: document.issuingPartyPin,
      beneficiary_party_code: document.beneficiaryPartyCode,
      beneficiary_party_name: document.beneficiaryPartyName,
      beneficiary_party_name_addr1: document.beneficiaryPartyAddress1,
      beneficiary_party_name_addr2: document.beneficiaryPartyAddress2,
      beneficiary_party_name_city: document.beneficiaryPartyCity,
      beneficiary_party_name_pin: document.beneficiaryPartyPin,
      file_type: document.fileType,
      icegate_id: document.icegateId
    })),
    licenses: values.licenses.map((license) => ({
      registration_number: license.registrationNumber,
      registration_date: license.registrationDate,
      invoice_serial_number: optionalNumber(license.invoiceSerialNumber),
      item_serial_number: optionalNumber(license.itemSerialNumber),
      licence_serial_number: optionalNumber(license.licenseSerialNumber),
      item_serial_number_part_e: license.itemSerialNumberPartE,
      item_serial_number_part_c: license.itemSerialNumberPartC,
      quantity: optionalNumber(license.licenseQuantity),
      export_quantity: optionalNumber(license.licenseExportQuantity),
      indigenous_or_imported: license.indigenousOrImported
    }))
  }
}
