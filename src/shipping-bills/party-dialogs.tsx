import { saveBranch, saveBusiness, saveExporter } from '@/shipping-bills/demo-store'
import { Branch, Business, countries, Exporter } from '@/shipping-bills/model'
import { InferType, s, useForm } from 'core/form'
import { Form, SubmitButton } from 'core/form/components'
import { toast } from 'core/toast-manager'
import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Textarea } from 'ui/inputs/text-area'
import { Dialog, DialogContent } from 'ui/interactive/dialog'

type Kind = 'exporter' | 'business'

const partySchema = s.object({
  name: s.string().minVal(2),
  iec: s.string().optional(),
  class: s.string().optional(),
  type: s.string().optional(),
  pan: s.string().optional(),
  tan: s.string().optional(),
  aeoNumber: s.string().optional(),
  website: s.string().optional(),
  notes: s.string().optional(),
  isConsignee: s.boolean().optional(),
  isBuyer: s.boolean().optional(),
  isNotify: s.boolean().optional(),
  isThirdParty: s.boolean().optional(),
  branchName: s.string().optional(),
  address1: s.string().optional(),
  city: s.string().optional(),
  state: s.string().optional(),
  pincode: s.string().optional(),
  countryCode: s.string()
})

type PartyFields = InferType<typeof partySchema>

interface PartyDialogProps {
  kind: Kind
  party?: Exporter | Business
  initialRole?: 'consignee' | 'buyer' | 'thirdParty'
  onClose: () => void
  onSaved?: (party: Exporter | Business) => void
}

export function PartyDialog({ kind, party, initialRole, onClose, onSaved }: PartyDialogProps) {
  const isNew = party == null
  const formCtx = useForm<PartyFields>(partySchema, {
    defaultValues: {
      name: party?.name ?? '',
      iec: party?.iec ?? '',
      class: kind === 'exporter' ? ((party as Exporter | undefined)?.class ?? 'F') : undefined,
      type: kind === 'exporter' ? ((party as Exporter | undefined)?.type ?? 'P') : undefined,
      pan: kind === 'exporter' ? ((party as Exporter | undefined)?.pan ?? '') : undefined,
      tan: kind === 'exporter' ? ((party as Exporter | undefined)?.tan ?? '') : undefined,
      aeoNumber: kind === 'exporter' ? ((party as Exporter | undefined)?.aeoNumber ?? '') : undefined,
      website: kind === 'exporter' ? ((party as Exporter | undefined)?.website ?? '') : undefined,
      notes: kind === 'exporter' ? ((party as Exporter | undefined)?.notes ?? '') : undefined,
      isConsignee:
        kind === 'business' ? ((party as Business | undefined)?.isConsignee ?? initialRole === 'consignee') : false,
      isBuyer: kind === 'business' ? ((party as Business | undefined)?.isBuyer ?? initialRole === 'buyer') : false,
      isNotify: kind === 'business' ? ((party as Business | undefined)?.isNotify ?? false) : false,
      isThirdParty:
        kind === 'business' ? ((party as Business | undefined)?.isThirdParty ?? initialRole === 'thirdParty') : false,
      branchName: '',
      address1: '',
      city: '',
      countryCode: kind === 'exporter' ? 'IN' : ''
    }
  })
  const { register } = formCtx.hooks

  function handleSave(values: PartyFields) {
    const firstBranch = isNew
      ? {
          branchName: values.branchName!,
          address1: values.address1!,
          city: values.city!,
          state: values.state,
          pincode: values.pincode,
          countryCode: values.countryCode
        }
      : undefined
    const saved =
      kind === 'exporter'
        ? saveExporter({
            id: party?.id,
            name: values.name.trim(),
            iec: values.iec?.trim() ?? '',
            class: values.class ?? 'F',
            type: values.type ?? 'P',
            pan: values.pan,
            tan: values.tan,
            aeoNumber: values.aeoNumber,
            website: values.website,
            notes: values.notes,
            firstBranch
          })
        : saveBusiness({
            id: party?.id,
            name: values.name.trim(),
            iec: values.iec,
            isConsignee: !!values.isConsignee,
            isBuyer: !!values.isBuyer,
            isNotify: !!values.isNotify,
            isThirdParty: !!values.isThirdParty,
            firstBranch
          })
    toast.success(`${kind === 'exporter' ? 'Exporter' : 'Business'} saved`)
    onSaved?.(saved)
    onClose()
  }

  return (
    <Dialog open setOpen={(open) => !open && onClose()}>
      <DialogContent center>
        <div className="foreground max-h-[90vh] w-[min(92vw,42rem)] overflow-y-auto rounded-xl border border-gray-200 p-6 shadow-xl">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {isNew ? 'Add' : 'Edit'} {kind}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isNew
                ? 'Add the main details and one address. You can add more branches later.'
                : 'Update the shared master record.'}
            </p>
          </div>
          <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" {...register('name')} wrapClass="sm:col-span-2" />
              <Input label="IEC" {...register('iec')} />
              {kind === 'exporter' ? (
                <>
                  <Select<PartyFields>
                    label="Exporter class"
                    name="class"
                    options={[
                      { value: 'F', label: 'Manufacturer' },
                      { value: 'R', label: 'Merchant' },
                      { value: 'C', label: 'Merchant courier' },
                      { value: 'D', label: 'Manufacturer courier' }
                    ]}
                  />
                  <Select<PartyFields>
                    label="Exporter type"
                    name="type"
                    options={[
                      { value: 'P', label: 'Private' },
                      { value: 'G', label: 'Government' },
                      { value: 'W', label: 'Warehouse' }
                    ]}
                  />
                </>
              ) : (
                <div className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Used as</span>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {(
                      [
                        ['isConsignee', 'Consignee'],
                        ['isBuyer', 'Buyer'],
                        ['isNotify', 'Notify party'],
                        ['isThirdParty', 'Third party']
                      ] as const
                    ).map(([name, label]) => (
                      <label key={name} className="flex items-center gap-2">
                        <Checkbox {...register(name)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {kind === 'exporter' && (
              <details className="rounded-lg border border-gray-200 p-3">
                <summary className="cursor-pointer text-sm font-medium">More exporter details</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="PAN" {...register('pan')} />
                  <Input label="TAN" {...register('tan')} />
                  <Input label="AEO number" {...register('aeoNumber')} />
                  <Input label="Website" {...register('website')} />
                  <Textarea label="Notes" {...register('notes')} wrapClass="sm:col-span-2" />
                </div>
              </details>
            )}
            {isNew && (
              <section className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 font-medium">First branch</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Branch name" {...register('branchName', { required: true })} />
                  <Input label="Address line 1" {...register('address1', { required: true })} />
                  <Input label="City" {...register('city', { required: true })} />
                  <Select<PartyFields>
                    label="Country"
                    name="countryCode"
                    options={countries}
                    placeholder="Select country"
                  />
                  <Input label="State / province" {...register('state')} />
                  <Input label="Postal code" {...register('pincode')} />
                </div>
              </section>
            )}
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton>Save {kind}</SubmitButton>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const branchSchema = s.object({
  branchName: s.string().minVal(2),
  address1: s.string().minVal(2),
  address2: s.string().optional(),
  city: s.string().minVal(2),
  state: s.string().optional(),
  pincode: s.string().optional(),
  countryCode: s.string(),
  email: s.string().optional(),
  mobile: s.string().optional(),
  gstnId: s.string().optional(),
  adCode: s.string().optional(),
  accountNo: s.string().optional(),
  ifscCode: s.string().optional()
})
type BranchFields = InferType<typeof branchSchema>

interface BranchDialogProps {
  kind: Kind
  ownerId: number
  branch?: Branch
  onClose: () => void
  onSaved?: (branch: Branch) => void
}

export function BranchDialog({ kind, ownerId, branch, onClose, onSaved }: BranchDialogProps) {
  const formCtx = useForm<BranchFields>(branchSchema, {
    defaultValues: branch ?? { branchName: '', address1: '', city: '', countryCode: kind === 'exporter' ? 'IN' : '' }
  })
  const { register } = formCtx.hooks

  function handleSave(values: BranchFields) {
    const saved = saveBranch(kind, ownerId, { ...values, id: branch?.id })
    toast.success('Branch saved')
    onSaved?.(saved)
    onClose()
  }

  return (
    <Dialog open setOpen={(open) => !open && onClose()}>
      <DialogContent center>
        <div className="foreground max-h-[90vh] w-[min(92vw,42rem)] overflow-y-auto rounded-xl border border-gray-200 p-6 shadow-xl">
          <h2 className="mb-5 text-lg font-semibold">{branch ? 'Edit' : 'Add'} branch</h2>
          <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Branch name" {...register('branchName')} />
              <Input label="Address line 1" {...register('address1')} />
              <Input label="Address line 2" {...register('address2')} />
              <Input label="City" {...register('city')} />
              <Input label="State / province" {...register('state')} />
              <Input label="Postal code" {...register('pincode')} />
              <Select<BranchFields>
                label="Country"
                name="countryCode"
                options={countries}
                placeholder="Select country"
              />
              <Input label="Email" type="email" {...register('email')} />
              <Input label="Mobile" {...register('mobile')} />
              <Input label="GSTIN / tax ID" {...register('gstnId')} />
            </div>
            {kind === 'exporter' && (
              <details className="rounded-lg border border-gray-200 p-3">
                <summary className="cursor-pointer text-sm font-medium">Bank and customs details</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="AD code" {...register('adCode')} />
                  <Input label="Account number" {...register('accountNo')} />
                  <Input label="IFSC code" {...register('ifscCode')} />
                </div>
              </details>
            )}
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton>Save branch</SubmitButton>
            </div>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
