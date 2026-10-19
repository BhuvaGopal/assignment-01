import { stateOptions } from '@/data/states'
import { cargoOptions, sealTypes, weightUnits } from '@/data/types'
import { routes } from '@/shared/route-paths'
import { s, useFieldArray, useForm } from 'core/form'
import { Form } from 'core/form/components'
import { queryClient, useQuery } from 'core/react-query'
import { navigate, useParams } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { MarksAndNumbersOption } from './marks-and-numbers-source'
import { Branch, Business, emptyBill, emptyDocument, emptyInvoice, Exporter, invoiceTotal, portCountry, SavedBill, ShippingBillFormValues } from './model'
import { BranchDialog, PartyDialog } from './party-dialogs'
import { billService, billsQueryKey, referenceDataService, ServiceError } from './services'
import { destinationPortError, invoiceDateError, loadingPortError, netWeightError, packingRangeError, rbiWaiverDateError } from './validation'
import { workflowSteps } from './workflow'
import { BranchPath, dateType, portOptions } from './form-types'
import { Advanced, SectionHeading } from './form-primitives'
import { AsyncPartySelect } from './async-select'
import { PartyFields } from './party-fields'
import { InvoiceEditor } from './invoice-editor'
import { DocumentItem } from './document-item'

const positive = s.string().refine((value) => (Number(value) > 0 ? undefined : 'Enter a number above zero'))

// Leaf names are deliberate: fe-zen-arch resolves nested RHF field rules by their final path segment.
const billSchema = s.object({
  jobNumber: s.string().optional(),
  jobDate: s.string(),
  exporterId: s.string(),
  exporterBranchId: s.string(),
  consigneeId: s.string(),
  consigneeBranchId: s.string(),
  loadingPort: s.string().refine((value) => loadingPortError(value)),
  finalDestinationPort: s.string().refine((value, form) => destinationPortError(value, form?.loadingPort)),
  dischargePort: s.string().optional(),
  originStateCode: s.string().optional(),
  nfeiCategory: s.string().optional(),
  rbiWaiverNumber: s.string().optional(),
  rbiWaiverDate: s
    .string()
    .optional()
    .refine((value, form) => rbiWaiverDateError(value, form?.rbiWaiverNumber)),
  sealType: s.string().optional(),
  numberOfContainers: s.string().optional(),
  natureOfCargo: s.string().optional(),
  grossWeight: s.string().optional(),
  netWeight: s
    .string()
    .optional()
    .refine((value, form) => netWeightError(value, form?.grossWeight)),
  measurementUnit: s.string().optional(),
  totalPackages: s.string().optional(),
  marksAndNumbers: s.string().optional(),
  loosePackets: s.string().optional(),
  mawbNumber: s.string().optional(),
  hawbNumber: s.string().optional(),
  invoiceNumber: s.string(),
  invoiceDate: s.string().refine((value, form) => invoiceDateError(value, form?.jobDate)),
  currency: s.string(),
  invoiceTotal: s
    .string()
    .refine((value) => (!value || Number(value) >= 0 ? undefined : 'Total cannot be negative'))
    .optional(),
  contractType: s.string(),
  buyerId: s.string().optional(),
  buyerBranchId: s.string().optional(),
  thirdPartyId: s.string().optional(),
  thirdPartyBranchId: s.string().optional(),
  ritcCode: s.string().matches(/^\d{8}$/, 'Enter an 8-digit RITC / HS code'),
  goodsDescription1: s.string(),
  quantity: positive,
  unitOfMeasurement: s.string(),
  unitPrice: positive,
  containerNumber: s
    .string()
    .optional()
    .matches(/^[A-Za-z]{4}\d{7}$/, 'Use 4 letters + 7 digits, e.g. MSKU1234567'),
  packingNumberFrom: s.string().optional(),
  packingNumberTo: s.string().optional(),
  documentTypeCode: s.string().optional(),
  documentReferenceNumber: s.string().optional(),
  registrationNumber: s.string().optional()
})

interface QuickAdd {
  kind: 'exporter' | 'business'
  role?: 'consignee' | 'buyer' | 'thirdParty' | 'itemThirdParty'
  invoiceIndex?: number
  itemIndex?: number
}

interface QuickBranch {
  kind: 'exporter' | 'business'
  ownerId: number
  branchName: BranchPath
}

interface PersistentTabProps {
  value: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

// Keep fields registered while another tab is open so RHF validates the entire bill on submit.
function PersistentTab({ value, activeTab, children, className }: PersistentTabProps) {
  return (
    <div role="tabpanel" hidden={activeTab !== value} className={`mt-3 ${className}`}>
      {children}
    </div>
  )
}

function BillEditor({ bill }: { bill?: SavedBill }) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, { defaultValues: bill?.values ?? emptyBill() })
  const { register, control, setValue, formState } = formCtx.hooks
  const values = formCtx.hooks.watch()
  const { fields: invoices, append: addInvoice, remove: removeInvoice } = useFieldArray({ control, name: 'invoices' })
  const {
    fields: containers,
    append: addContainer,
    remove: removeContainer
  } = useFieldArray({ control, name: 'containers' })
  const {
    fields: packingRanges,
    append: addPackingRange,
    remove: removePackingRange
  } = useFieldArray({ control, name: 'packingRanges' })
  const {
    fields: documents,
    append: addDocument,
    remove: removeDocument
  } = useFieldArray({ control, name: 'documents' })
  const { fields: licenses, append: addLicense, remove: removeLicense } = useFieldArray({ control, name: 'licenses' })
  const [activeTab, setActiveTab] = useState('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null)
  const [quickBranch, setQuickBranch] = useState<QuickBranch | null>(null)
  const [marksAndNumbersOptions, setMarksAndNumbersOptions] = useState<MarksAndNumbersOption[]>([])
  const [marksAndNumbersLoading, setMarksAndNumbersLoading] = useState(false)
  const previousExporterId = useRef(values.exporterId)

  useEffect(() => {
    const exporterId = values.exporterId
    if (previousExporterId.current !== exporterId) {
      previousExporterId.current = exporterId
      setValue('marksAndNumbers', '', { shouldValidate: true })
    }

    let cancelled = false
    setMarksAndNumbersOptions([])
    setMarksAndNumbersLoading(Boolean(exporterId))
    if (exporterId) {
      void referenceDataService
        .getMarksAndNumbers(exporterId)
        .then((options) => {
          if (cancelled) return
          setMarksAndNumbersOptions(options)
          setMarksAndNumbersLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setMarksAndNumbersOptions([])
          setMarksAndNumbersLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [setValue, values.exporterId])

  useEffect(() => {
    if (!formState.submitCount || !Object.keys(formState.errors).length) return
    console.log('Form validation errors on submit:', formState.errors)
    toast.error('Please check the required fields')
    if (
      [
        'jobDate',
        'exporterId',
        'exporterBranchId',
        'consigneeId',
        'consigneeBranchId',
        'loadingPort',
        'finalDestinationPort',
        'netWeight',
        'rbiWaiverDate'
      ].some((field) => field in formState.errors)
    )
      setActiveTab('details')
    else if (formState.errors.invoices) setActiveTab('invoices')
    else if (
      formState.errors.containers ||
      formState.errors.packingRanges ||
      formState.errors.documents ||
      formState.errors.licenses
    )
      setActiveTab('documents')
    // else: keep user on whichever tab they submitted from
  }, [formState.submitCount, formState.errors])

  async function handleSave(data: ShippingBillFormValues) {
    try {
      const saved = await billService.save(data, draftId)
      setDraftId(saved.id)
      await queryClient.invalidateQueries({ queryKey: billsQueryKey })
      toast.success(bill ? 'Shipping bill updated' : 'Shipping bill created')
      navigate(routes.toShippingBillEdit(saved.id))
    } catch (err) {
      toast.error(err instanceof ServiceError ? err.message : 'Failed to save shipping bill')
    }
  }

  // Saves the in-progress bill without validation. Returns false (and tells the user) on failure.
  async function saveDraft() {
    try {
      const saved = await billService.saveDraft(formCtx.hooks.getValues(), draftId)
      setDraftId(saved.id)
      void queryClient.invalidateQueries({ queryKey: billsQueryKey })
      return true
    } catch (err) {
      toast.error(err instanceof ServiceError ? err.message : 'Could not save draft')
      return false
    }
  }

  function handleQuickSaved(party: Exporter | Business) {
    const branchId = party.branches[0]?.id
    if (!quickAdd || !branchId) return
    if (quickAdd.kind === 'exporter') {
      setValue('exporterId', String(party.id), { shouldValidate: true })
      setValue('exporterBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'consignee') {
      setValue('consigneeId', String(party.id), { shouldValidate: true })
      setValue('consigneeBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'itemThirdParty' && quickAdd.invoiceIndex != null && quickAdd.itemIndex != null) {
      setValue(`invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyId`, String(party.id), {
        shouldValidate: true
      })
      setValue(
        `invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyBranchId`,
        String(branchId),
        { shouldValidate: true }
      )
    } else if (quickAdd.invoiceIndex != null) {
      const field = quickAdd.role === 'buyer' ? 'buyer' : 'thirdParty'
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}Id`, String(party.id), { shouldValidate: true })
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}BranchId`, String(branchId), { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="mb-2 text-sm text-gray-500 hover:underline" onClick={() => navigate(routes.dashboard)}>
            ← Shipping bills
          </button>
          <h1 className="text-2xl font-semibold text-gray-950">
            {bill ? `Edit shipping bill #${bill.id}` : 'New shipping bill'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the everyday details first. Open advanced sections only when needed.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {workflowSteps.map((step, index) => {
          const isShippingBill = step.id === 'shipping-bill'
          return (
            <div
              key={step.id}
              className={`rounded-lg border p-3 ${
                isShippingBill ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-gray-50'
              }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs">
                  {index + 1}
                </span>
                {step.title}
              </div>
              <p className="ml-8 text-xs text-gray-500">{step.description}</p>
            </div>
          )
        })}
      </div>
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
          <TabsList className="flex w-full justify-start overflow-x-auto">
            <TabsTrigger value="details">1. Details</TabsTrigger>
            <TabsTrigger value="invoices">2. Invoices & goods</TabsTrigger>
            <TabsTrigger value="documents">3. Others</TabsTrigger>
          </TabsList>

          <PersistentTab value="details" activeTab={activeTab} className="space-y-4">
            <Card>
              <CardHeader title="Shipment basics" description="Parties and route are the core details for this bill." />
              <CardContent className="space-y-5">
                <PartyFields
                  formCtx={formCtx}
                  ownerName="exporterId"
                  branchName="exporterBranchId"
                  label="Exporter"
                  kind="exporter"
                  onQuickAdd={() => setQuickAdd({ kind: 'exporter' })}
                  onAddBranch={(ownerId) =>
                    setQuickBranch({ kind: 'exporter', ownerId, branchName: 'exporterBranchId' })
                  }
                />
                <PartyFields
                  formCtx={formCtx}
                  ownerName="consigneeId"
                  branchName="consigneeBranchId"
                  label="Consignee"
                  kind="business"
                  onQuickAdd={() => setQuickAdd({ kind: 'business', role: 'consignee' })}
                  onAddBranch={(ownerId) =>
                    setQuickBranch({ kind: 'business', ownerId, branchName: 'consigneeBranchId' })
                  }
                />

                <div className="border-t border-gray-200 pt-5">
                  <SectionHeading title="Route" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="mb-1 block text-sm font-medium">Port of loading</span>
                      <AsyncPartySelect
                        name="loadingPort"
                        placeholder="Select Indian port"
                        rules={{ required: true }}
                        fetchOptions={async (query) => {
                          const res = await referenceDataService.searchLoadingPorts(query)
                          return res.map((port) => ({
                            value: port.code,
                            label: `${port.name} · ${port.code}`,
                            sublabel: `Country: ${port.countryCode}`
                          }))
                        }}
                        getInitialLabel={async (code) => {
                          const port = await referenceDataService.getPort(code)
                          return port ? `${port.name} · ${port.code}` : code
                        }}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-sm font-medium">Final destination port</span>
                      <AsyncPartySelect
                        name="finalDestinationPort"
                        placeholder="Select destination"
                        rules={{ required: true }}
                        fetchOptions={async (query) => {
                          const res = await referenceDataService.searchDestinationPorts(query)
                          return res.map((port) => ({
                            value: port.code,
                            label: `${port.name} · ${port.code}`,
                            sublabel: `Country: ${port.countryCode}`
                          }))
                        }}
                        getInitialLabel={async (code) => {
                          const port = await referenceDataService.getPort(code)
                          return port ? `${port.name} · ${port.code}` : code
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Countries are derived from the port codes when saved: {portCountry(values.loadingPort) || '—'} →{' '}
                    {portCountry(values.finalDestinationPort) || '—'}.
                  </p>
                </div>
                <Advanced title="Regulatory and route exceptions">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Select<ShippingBillFormValues>
                      label="Discharge port"
                      name="dischargePort"
                      options={portOptions}
                      placeholder="Defaults to destination"
                    />
                    <Select<ShippingBillFormValues>
                      label="Origin state"
                      name="originStateCode"
                      options={stateOptions}
                      placeholder="Defaults to Branch State Code"
                    />
                    <div></div>
                    <Select<ShippingBillFormValues>
                      label="NFEI category"
                      name="nfeiCategory"
                      options={[
                        ['01', 'Free trade sample'],
                        ['02', 'Diplomatic goods'],
                        ['03', 'Warranty replacement'],
                        ['07', 'Gift parcel'],
                        ['08', 'Other']
                      ].map(([value, label]) => ({ value, label }))}
                      placeholder="Not applicable"
                    />
                    <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
                    <Input label="RBI waiver date" type={dateType} {...register('rbiWaiverDate')} />
                  </div>
                </Advanced>

                <div className="border-t border-gray-200 pt-5">
                  <SectionHeading title="Package Detail" />
                  <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Select<ShippingBillFormValues>
                      label="Nature of cargo"
                      name="natureOfCargo"
                      options={cargoOptions}
                    />
                    <Input label="Gross weight" type="number" {...register('grossWeight')} />
                    <Input label="Net weight" type="number" {...register('netWeight')} />
                    <Select<ShippingBillFormValues> label="Weight unit" name="measurementUnit" options={weightUnits} />
                    <Input label="Total packages" type="number" {...register('totalPackages')} />
                    <Select<ShippingBillFormValues>
                      label="Marks and numbers"
                      name="marksAndNumbers"
                      options={marksAndNumbersOptions}
                      placeholder={
                        !values.exporterId
                          ? 'Select exporter first'
                          : marksAndNumbersLoading
                            ? 'Loading marks and numbers...'
                            : 'Select marks and numbers'
                      }
                      disabled={!values.exporterId || marksAndNumbersLoading || !marksAndNumbersOptions.length}
                      wrapClass="sm:col-span-3"
                    />
                  </div>
                  <Advanced title="Additional Details">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Select<ShippingBillFormValues>
                        label="Seal type"
                        name="sealType"
                        options={sealTypes}
                        placeholder="Select if relevant"
                      />
                      {containers.length === 0 && (
                        <Input label="Number of containers" type="number" {...register('numberOfContainers')} />
                      )}
                      <Input label="Loose packets" type="number" {...register('loosePackets')} />
                      <Input label="MAWB number" {...register('mawbNumber')} />
                      <Input label="HAWB number" {...register('hawbNumber')} />
                    </div>
                  </Advanced>
                </div>
              </CardContent>
            </Card>
          </PersistentTab>

          <PersistentTab value="invoices" activeTab={activeTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Invoices & goods</h2>
                <p className="text-sm text-gray-500">One invoice and one item are ready to fill in.</p>
              </div>
              <Button variant="outline" onClick={() => addInvoice(emptyInvoice())}>
                + Add invoice
              </Button>
            </div>
            {invoices.map((field, index) => (
              <InvoiceEditor
                key={field.id}
                formCtx={formCtx}
                index={index}
                invoice={values.invoices[index] ?? emptyInvoice()}
                onQuickAdd={(role, invoiceIndex, itemIndex) =>
                  setQuickAdd({ kind: 'business', role, invoiceIndex, itemIndex })
                }
                onAddBranch={(ownerId, branchName) => setQuickBranch({ kind: 'business', ownerId, branchName })}
                onRemove={() => removeInvoice(index)}
                canRemove={invoices.length > 1}
              />
            ))}
          </PersistentTab>

          <PersistentTab value="documents" activeTab={activeTab} className="space-y-4">
            <Card>
              <CardHeader title="Cargo & Package Detail" />
              <CardContent className="space-y-5">
                <div className="mb-3 flex items-center justify-between">
                  <SectionHeading
                    title={`Containers (${containers.length})`}
                    description="Add only when the cargo is containerized."
                  />
                  <Button size="sm" variant="outline" onClick={() => addContainer({ containerNumber: '' })}>
                    + Add container
                  </Button>
                </div>
                <div className="space-y-3">
                  {containers.map((field, index) => (
                    <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex justify-between">
                        <h3 className="text-sm font-semibold">Container {index + 1}</h3>
                        <Button size="sm" variant="ghost" onClick={() => removeContainer(index)}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Input label="Container number" {...register(`containers.${index}.containerNumber`)} />
                        <Select<ShippingBillFormValues>
                          label="Size"
                          name={`containers.${index}.containerSize`}
                          options={[
                            { value: '20', label: '20 ft' },
                            { value: '40', label: '40 ft' },
                            { value: '45', label: '45 ft' }
                          ]}
                          placeholder="Select size"
                        />
                        <Input label="Seal number" {...register(`containers.${index}.exciseSealNumber`)} />
                        <Input label="Seal date" type={dateType} {...register(`containers.${index}.sealDate`)} />
                        <Select<ShippingBillFormValues>
                          label="Seal type"
                          name={`containers.${index}.sealType`}
                          options={[
                            { value: 1, label: 'BTSL - Bottle Seal' },
                            { value: 2, label: 'ESEAL - Electronic Seal' },
                            { value: 3, label: 'RFID - Radio Frequency Identifier' }
                          ]}
                          placeholder="Select if needed"
                        />
                        <Input label="Seal device ID" {...register(`containers.${index}.sealDeviceId`)} />
                        <Input
                          label="Movement document type"
                          {...register(`containers.${index}.movementDocumentType`)}
                        />
                        <Input
                          label="Movement document number"
                          {...register(`containers.${index}.movementDocumentNumber`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Advanced title={`Packing list ranges (${packingRanges.length})`}>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addPackingRange({ packingNumberFrom: '', packingNumberTo: '' })}>
                      + Add packing range
                    </Button>
                    {packingRanges.map((field, index) => (
                      <div key={field.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-medium">Range {index + 1}</span>
                          <Button size="sm" variant="ghost" onClick={() => removePackingRange(index)}>
                            Remove
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <Input
                            label="Package from"
                            type="number"
                            {...register(`packingRanges.${index}.packingNumberFrom`)}
                          />
                          <Input
                            label="Package to"
                            type="number"
                            {...register(`packingRanges.${index}.packingNumberTo`, {
                              validate: (value, form) =>
                                packingRangeError(form.packingRanges[index]?.packingNumberFrom, value)
                            })}
                          />
                          <Input label="Packing code" {...register(`packingRanges.${index}.packingCode`)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Advanced>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-950">Supporting documents</h3>
                  <p className="mt-1 text-sm text-gray-500">Add references when required for this shipment.</p>
                </div>
                {documents.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
                    + Add document
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {documents.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => addDocument(emptyDocument())}>
                    + Add document
                  </Button>
                )}
                {documents.map((field, index) => (
                  <DocumentItem key={field.id} formCtx={formCtx} index={index} onRemove={() => removeDocument(index)} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-950">Licences</h3>
                  <p className="mt-1 text-sm text-gray-500">Only enter these for schemes that require a licence.</p>
                </div>
                {licenses.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => addLicense({ registrationNumber: '' })}>
                    + Add licence
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {licenses.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => addLicense({ registrationNumber: '' })}>
                    + Add licence
                  </Button>
                )}
                {licenses.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex justify-between">
                      <h3 className="text-sm font-semibold">Licence {index + 1}</h3>
                      <Button size="sm" variant="ghost" onClick={() => removeLicense(index)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Input label="Registration number" {...register(`licenses.${index}.registrationNumber`)} />
                      <Input
                        label="Registration date"
                        type={dateType}
                        {...register(`licenses.${index}.registrationDate`)}
                      />
                      <Input
                        label="Invoice serial number"
                        type="number"
                        {...register(`licenses.${index}.invoiceSerialNumber`)}
                      />
                      <Input
                        label="Item serial number"
                        type="number"
                        {...register(`licenses.${index}.itemSerialNumber`)}
                      />
                      <Input
                        label="Licence serial number"
                        type="number"
                        {...register(`licenses.${index}.licenseSerialNumber`)}
                      />
                      <Input label="Item serial, Part E" {...register(`licenses.${index}.itemSerialNumberPartE`)} />
                      <Input label="Item serial, Part C" {...register(`licenses.${index}.itemSerialNumberPartC`)} />
                      <Input
                        label="Licence quantity"
                        type="number"
                        {...register(`licenses.${index}.licenseQuantity`)}
                      />
                      <Input
                        label="Export quantity"
                        type="number"
                        {...register(`licenses.${index}.licenseExportQuantity`)}
                      />
                      <Select<ShippingBillFormValues>
                        label="Goods source"
                        name={`licenses.${index}.indigenousOrImported`}
                        options={[
                          { value: 'I', label: 'Imported' },
                          { value: 'D', label: 'Indigenous' }
                        ]}
                        placeholder="Select if needed"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </PersistentTab>
        </Tabs>
        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-4">
          <Button variant="outline" type="button" onClick={() => navigate(routes.dashboard)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {activeTab !== 'details' && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  void saveDraft().then((ok) => {
                    if (ok) setActiveTab(activeTab === 'documents' ? 'invoices' : 'details')
                  })
                }}>
                Previous
              </Button>
            )}
            {activeTab !== 'documents' ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  void saveDraft().then((ok) => {
                    if (!ok) return
                    toast.success('Details saved')
                    setActiveTab(activeTab === 'details' ? 'invoices' : 'documents')
                  })
                }}>
                Save & Next
              </Button>
            ) : (
              <Button type="submit">Save changes</Button>
            )}
          </div>
        </div>
      </Form>
      {quickAdd && (
        <PartyDialog
          key={`${quickAdd.kind}-${quickAdd.role ?? 'exporter'}-${quickAdd.invoiceIndex ?? 0}`}
          kind={quickAdd.kind}
          initialRole={quickAdd.role === 'itemThirdParty' ? 'thirdParty' : quickAdd.role}
          onClose={() => setQuickAdd(null)}
          onSaved={handleQuickSaved}
        />
      )}
      {quickBranch && (
        <BranchDialog
          key={`${quickBranch.kind}-${quickBranch.ownerId}`}
          kind={quickBranch.kind}
          ownerId={quickBranch.ownerId}
          onClose={() => setQuickBranch(null)}
          onSaved={async (branch: Branch) => {
            await queryClient.invalidateQueries({ queryKey: ['party'] })
            setValue(quickBranch.branchName, String(branch.id), { shouldValidate: true })
          }}
        />
      )}
    </div>
  )
}

export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const {
    data: bill,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => billService.getById(Number(id)),
    enabled: Boolean(id),
    staleTime: 0,
    retry: false
  })

  if (!id) return <BillEditor key="new" />
  if (isLoading) return <div className="p-10 text-center text-sm text-gray-500">Loading shipping bill...</div>
  if (error || !bill) {
    const notFound = error instanceof ServiceError && error.code === 'NOT_FOUND'
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">
          {notFound ? 'Shipping bill not found' : 'Could not load shipping bill'}
        </h1>
        {!notFound && <p className="text-sm text-gray-500">{error instanceof Error ? error.message : ''}</p>}
        <div className="flex gap-2">
          {!notFound && (
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          )}
          <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
        </div>
      </div>
    )
  }
  return <BillEditor key={id} bill={bill} />
}
