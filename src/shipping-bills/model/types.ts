import type { lineTotal, invoiceTotal } from './calculations'
import type { toShippingBillPayload } from './payload'

export interface Branch {
  id: number
  branchName: string
  address1: string
  address2?: string
  city: string
  state?: string
  pincode?: string
  countryCode: string
  email?: string
  mobile?: string
  gstnId?: string
  adCode?: string
  accountNo?: string
  ifscCode?: string
}

export interface Exporter {
  id: number
  name: string
  iec: string
  class: string
  type: string
  pan?: string
  tan?: string
  aeoNumber?: string
  website?: string
  notes?: string
  disabled?: boolean
  branches: Branch[]
}

export interface Business {
  id: number
  name: string
  iec?: string
  isConsignee: boolean
  isBuyer: boolean
  isNotify: boolean
  isThirdParty: boolean
  branches: Branch[]
}

export interface PortOption {
  code: string
  name: string
  countryCode: string
}

export interface BillItemForm {
  ritcCode: string
  goodsDescription1: string
  goodsDescription2?: string
  goodsDescription3?: string
  accessoriesDescription?: string
  quantity: string
  unitOfMeasurement: string
  unitPrice: string
  schemeCode?: string
  unitOfRate?: string
  presentMarketValue?: string
  numberOfUnits?: string
  lineTotal?: string
  accessoryStatus?: string
  thirdPartyItem?: boolean
  itemThirdPartyId?: string
  itemThirdPartyBranchId?: string
  ar4Number?: string
  ar4Date?: string
  ar4Commissionerate?: string
  ar4Division?: string
  ar4Range?: string
  ar4Remarks?: string
  igstPaymentStatus?: string
  taxableValue?: string
  igstAmount?: string
  mainDbkSerialNumber?: string
  drawbackSerialNumber?: string
  drawbackUnit?: string
  drawbackQuantity?: string
  customRateAdv?: string
  customRateSpec?: string
  totalDbkAmount?: string
  dbkAdv?: string
  dbkRateSpec?: string
  rosctlSerialNumber?: string
  centralTaxLevyDuty?: string
  centralTaxLevyRate?: string
  stateLevyDuty?: string
  stateLevyRate?: string
  rosctlQuantity?: string
  rosctlAmount?: string
  rodtep?: string
  rodtepRate?: string
  rodtepCap?: string
  rodtepQuantity?: string
  rodtepUnit?: string
  rodtepAmount?: string
  cess?: string
  originDistrictCode?: string
  tradeAgreementsCode?: string
  endUseOfItem?: string
  totalPackage?: string
  rewardItem?: boolean
}

export interface BillInvoiceForm {
  invoiceNumber: string
  invoiceDate: string
  currency: string
  contractType: string
  buyerSameAsConsignee: boolean
  buyerId: string
  buyerBranchId: string
  thirdPartyId?: string
  thirdPartyBranchId?: string
  freightRate?: string
  freightAmount?: string
  freightCurrency?: string
  insuranceRate?: string
  insuranceAmount?: string
  insuranceCurrency?: string
  commissionRate?: string
  commissionAmount?: string
  commissionCurrency?: string
  discountRate?: string
  discountAmount?: string
  discountCurrency?: string
  otherDeductionsRate?: string
  otherDeductionsAmount?: string
  otherDeductionsCurrency?: string
  packingCharges?: string
  freightInsuranceIncluded?: string
  contractNumber?: string
  natureOfPayment?: string
  periodOfPayment?: string
  invoiceTotal?: string
  items: BillItemForm[]
}

export interface ContainerForm {
  containerNumber: string
  containerSize?: string
  exciseSealNumber?: string
  sealDate?: string
  sealType?: string
  sealDeviceId?: string
  movementDocumentType?: string
  movementDocumentNumber?: string
  invoiceSerialNumber?: string
  itemSerialNumber?: string
  documentTypeCode?: string
  imageReferenceNumber?: string
}

export interface PackingRangeForm {
  packingNumberFrom: string
  packingNumberTo: string
  packingCode?: string
}

export interface SupportingDocForm {
  documentTypeCode: string
  documentReferenceNumber: string
  invoiceSerialNumber?: string
  itemSerialNumber?: string
  imageReferenceNumber?: string
  documentIssueDate?: string
  documentExpiryDate?: string
  placeOfIssue?: string
  issuingPartyCode?: string
  issuingPartyName?: string
  issuingPartyAddress1?: string
  issuingPartyAddress2?: string
  issuingPartyCity?: string
  issuingPartyPin?: string
  beneficiaryPartyCode?: string
  beneficiaryPartyName?: string
  beneficiaryPartyAddress1?: string
  beneficiaryPartyAddress2?: string
  beneficiaryPartyCity?: string
  beneficiaryPartyPin?: string
  fileType?: string
  icegateId?: string
}

export interface LicenseForm {
  registrationNumber: string
  registrationDate?: string
  invoiceSerialNumber?: string
  itemSerialNumber?: string
  licenseSerialNumber?: string
  itemSerialNumberPartE?: string
  itemSerialNumberPartC?: string
  licenseQuantity?: string
  licenseExportQuantity?: string
  indigenousOrImported?: string
}

export interface ShippingBillFormValues {
  jobNumber?: string
  jobDate: string
  exporterId: string
  exporterBranchId: string
  exporterName?: string
  consigneeId: string
  consigneeBranchId: string
  consigneeName?: string
  loadingPort: string
  finalDestinationPort: string
  dischargePort?: string
  originStateCode?: string
  nfeiCategory?: string
  rbiWaiverNumber?: string
  rbiWaiverDate?: string
  sealType?: string
  numberOfContainers?: string
  natureOfCargo: string
  grossWeight?: string
  netWeight?: string
  measurementUnit: string
  totalPackages?: string
  marksAndNumbers?: string
  loosePackets?: string
  mawbNumber?: string
  hawbNumber?: string
  invoices: BillInvoiceForm[]
  containers: ContainerForm[]
  packingRanges: PackingRangeForm[]
  documents: SupportingDocForm[]
  licenses: LicenseForm[]
  exchangeRate?: string
  chaNumber?: string
  chaName?: string
}

export interface SavedBill {
  id: number
  created: string
  updated: string
  values: ShippingBillFormValues
  payload?: ReturnType<typeof toShippingBillPayload>
}
