import { FormField } from "@/components/FormField";
import { ASSET_TYPES } from "@/lib/types";
import { toDateInputValue } from "@/lib/format";
import type { Asset, Site } from "@prisma/client";

export function AssetForm({
  asset,
  sites,
  action,
  submitLabel = "Add asset",
}: {
  asset?: Asset;
  sites?: Site[];
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <FormField label="Type" name="type" defaultValue={asset?.type ?? ASSET_TYPES[0]} options={ASSET_TYPES.map((t) => ({ value: t, label: t }))} />
      <FormField label="Asset number" name="assetNumber" defaultValue={asset?.assetNumber ?? undefined} />
      <FormField label="Location" name="location" defaultValue={asset?.location ?? undefined} />
      {sites && sites.length > 0 && (
        <FormField label="Site" name="siteId" defaultValue={asset?.siteId ?? ""} options={[{ value: "", label: "No specific site" }, ...sites.map((s) => ({ value: String(s.id), label: s.name }))]} />
      )}
      <FormField label="Manufacturer" name="manufacturer" defaultValue={asset?.manufacturer ?? undefined} />
      <FormField label="Model" name="model" defaultValue={asset?.model ?? undefined} />
      <FormField label="Serial number" name="serialNumber" defaultValue={asset?.serialNumber ?? undefined} />
      <FormField label="Installed date" name="installedDate" type="date" defaultValue={toDateInputValue(asset?.installedDate)} />
      <FormField label="Warranty expiry" name="warrantyExpiry" type="date" defaultValue={toDateInputValue(asset?.warrantyExpiry)} />
      <FormField label="Service interval (months)" name="serviceIntervalMonths" type="number" defaultValue={asset?.serviceIntervalMonths ?? undefined} />
      <FormField label="Last service" name="lastServiceDate" type="date" defaultValue={toDateInputValue(asset?.lastServiceDate)} />
      <FormField label="Next service due" name="nextServiceDate" type="date" defaultValue={toDateInputValue(asset?.nextServiceDate)} />
      <div className="col-span-2 sm:col-span-4">
        <FormField label="Notes" name="notes" defaultValue={asset?.notes ?? undefined} />
      </div>
      <div className="col-span-2 sm:col-span-4">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
