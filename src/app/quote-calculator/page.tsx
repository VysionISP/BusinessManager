import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { breakEvenHourlyRate, businessRunningCosts, labourStats } from "@/lib/calculations";
import { getEmployees, getOverheads } from "@/lib/queries";
import { QuoteCalculator } from "./QuoteCalculator";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const [employees, overheads] = await Promise.all([getEmployees(true), getOverheads(true)]);
  const runningCosts = businessRunningCosts(employees, overheads);
  const labour = labourStats(employees, overheads);
  const breakEvenRate = breakEvenHourlyRate(runningCosts.totalWeeklyCost, labour.totalBillableHours);

  return (
    <div>
      <PageHeader
        title="Quote calculator"
        description="Uses the business's current break-even labour rate. Prices are calculated from profit margin, not markup — they aren't the same thing."
      />
      <Card>
        <QuoteCalculator breakEvenLabourRate={breakEvenRate} />
      </Card>
    </div>
  );
}
