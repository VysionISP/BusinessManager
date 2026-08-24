import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button, FormActions, FormField } from "@/components/FormField";
import { getSettings } from "@/lib/queries";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHeader title="Settings" description="Business-wide defaults used across the break-even, quoting, dashboard and cashflow calculations." />
      <Card>
        <form action={updateSettings} className="max-w-xl space-y-5">
          <FormField label="Business name" name="businessName" defaultValue={settings.businessName} required />
          <FormField
            label="Target profit margin (%)"
            name="targetMarginPercent"
            type="number"
            step="0.5"
            defaultValue={settings.targetMarginPercent}
            hint="Used as the default quoting margin and job margin alert threshold."
          />
          <FormField
            label="Target labour utilisation (%)"
            name="targetUtilisationPercent"
            type="number"
            step="1"
            defaultValue={settings.targetUtilisationPercent}
            hint="Billable hours as a percentage of available hours."
          />
          <FormField
            label="Current bank balance ($)"
            name="openingBankBalance"
            type="number"
            step="0.01"
            defaultValue={settings.openingBankBalance}
            hint="Update this to today's actual balance — it's the starting point for the cashflow forecast."
          />
          <FormActions>
            <Button>Save settings</Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
