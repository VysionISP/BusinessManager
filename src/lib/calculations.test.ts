import { describe, expect, it } from "vitest";
import {
  actualCostsByCategory,
  applyApprovedVariations,
  breakEvenHourlyRate,
  businessRunningCosts,
  committedCost,
  daysOverdue,
  employeeTrueCost,
  invoiceOutstanding,
  jobExpectedMarginPercent,
  jobForecast,
  jobWip,
  markupFromPrice,
  priceForMargin,
  purchaseOrderTotal,
  quoteAtMargins,
  quoteDirectCost,
  variationProfit,
  variationSellPrice,
} from "./calculations";

describe("employeeTrueCost", () => {
  it("adds super and on-costs on top of gross wage for hourly employees", () => {
    const cost = employeeTrueCost({
      payType: "HOURLY",
      baseHourlyRate: 40,
      annualSalary: null,
      ordinaryHoursPerWeek: 38,
      overtimeHoursPerWeek: 0,
      overtimeMultiplier: 1.5,
      weeklyAllowances: 0,
      superRatePercent: 11.5,
      onCostPercent: 15,
      expectedBillableHoursPerWeek: 32,
      chargeOutRate: 110,
    });
    expect(cost.grossWage).toBeCloseTo(1520);
    expect(cost.super).toBeCloseTo(174.8);
    expect(cost.onCosts).toBeCloseTo(228);
    expect(cost.totalCost).toBeCloseTo(1922.8);
    expect(cost.costPerBillableHour).toBeCloseTo(1922.8 / 32);
  });
});

describe("break-even & margin", () => {
  it("matches the worked example from the spec: $14,000 / 120hrs = $116.67", () => {
    const breakEven = breakEvenHourlyRate(14000, 120);
    expect(breakEven).toBeCloseTo(116.67, 2);
  });

  it("matches the worked example: 20% margin on $116.67 => $145.84", () => {
    const rate = priceForMargin(116.6667, 20);
    expect(rate).toBeCloseTo(145.83, 1);
  });

  it("margin and markup diverge for the same price", () => {
    const cost = 100;
    const price = priceForMargin(cost, 20); // 125
    expect(price).toBeCloseTo(125);
    // 20% margin on $125 sale ($25 profit / $125 price) is a 25% markup ($25/$100 cost).
    expect(markupFromPrice(cost, price)).toBeCloseTo(25);
  });
});

describe("businessRunningCosts", () => {
  it("sums wages, super, on-costs and overheads into weekly/monthly/annual totals", () => {
    const employees = [
      {
        payType: "HOURLY",
        baseHourlyRate: 40,
        annualSalary: null,
        ordinaryHoursPerWeek: 38,
        overtimeHoursPerWeek: 0,
        overtimeMultiplier: 1.5,
        weeklyAllowances: 0,
        superRatePercent: 11.5,
        onCostPercent: 15,
        expectedBillableHoursPerWeek: 32,
        chargeOutRate: 110,
      },
    ];
    const overheads = [{ amount: 5200, frequency: "ANNUAL" }]; // $100/week
    const result = businessRunningCosts(employees, overheads);
    expect(result.weeklyOverheads).toBeCloseTo(100);
    expect(result.totalWeeklyCost).toBeCloseTo(1922.8 + 100, 1);
    expect(result.annualCost).toBeCloseTo(result.totalWeeklyCost * 52);
    expect(result.monthlyCost).toBeCloseTo((result.totalWeeklyCost * 52) / 12);
  });
});

describe("quote calculator", () => {
  it("builds direct job cost from labour + all direct expenses", () => {
    const breakdown = quoteDirectCost(
      {
        estimatedHours: 40,
        materialCost: 2000,
        subcontractorCost: 500,
        equipmentHire: 100,
        travel: 50,
        accommodation: 0,
        otherDirectExpenses: 0,
      },
      116.67,
    );
    expect(breakdown.labourCost).toBeCloseTo(4666.8, 1);
    expect(breakdown.directJobCost).toBeCloseTo(4666.8 + 2650, 1);
  });

  it("produces increasing prices for increasing margin presets", () => {
    const quotes = quoteAtMargins(10000, [10, 15, 20, 25, 30]);
    const prices = quotes.map((q) => q.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1]);
    }
    expect(quotes[2].price).toBeCloseTo(12500); // 20% margin
  });
});

describe("job forecast & WIP", () => {
  const job = {
    quoteAmount: 50000,
    budgetLabourHours: 200,
    budgetLabourCost: 20000,
    budgetMaterials: 15000,
    budgetSubcontractors: 0,
    budgetOtherDirectCosts: 0,
    percentComplete: 60,
  };

  it("computes expected margin from the original budget", () => {
    expect(jobExpectedMarginPercent(job)).toBeCloseTo(30);
  });

  it("extrapolates forecast final cost using percent complete as a run rate", () => {
    const entries = [
      { category: "LABOUR", amount: 12000, hours: 120 },
      { category: "MATERIALS", amount: 9000 },
    ];
    const forecast = jobForecast(job, entries);
    expect(forecast.actualTotalCost).toBe(21000);
    expect(forecast.forecastFinalCost).toBeCloseTo(35000); // 21000 / 0.6
    expect(forecast.forecastProfit).toBeCloseTo(15000);
  });

  it("calculates management WIP as earned value less invoiced amount, per the spec example", () => {
    const wipJob = { ...job, quoteAmount: 50000, percentComplete: 60 };
    const wip = jobWip(wipJob, 10000);
    expect(wip.earnedValue).toBeCloseTo(30000);
    expect(wip.managementWip).toBeCloseTo(20000);
  });
});

describe("actualCostsByCategory", () => {
  it("groups job cost entries by category and sums labour hours", () => {
    const result = actualCostsByCategory([
      { category: "LABOUR", amount: 1000, hours: 20 },
      { category: "LABOUR", amount: 500, hours: 10 },
      { category: "MATERIALS", amount: 300 },
      { category: "OTHER", amount: 50 },
    ]);
    expect(result.labour).toBe(1500);
    expect(result.labourHours).toBe(30);
    expect(result.materials).toBe(300);
    expect(result.other).toBe(50);
    expect(result.total).toBe(1850);
  });
});

describe("invoicing", () => {
  it("computes outstanding amount and days overdue", () => {
    const outstanding = invoiceOutstanding(5000, [{ amount: 2000 }]);
    expect(outstanding).toBe(3000);

    const overdue = daysOverdue(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), outstanding);
    expect(overdue).toBeGreaterThanOrEqual(4);

    expect(daysOverdue(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 0)).toBe(0);
  });
});

describe("variations", () => {
  it("prices a variation cost-plus-markup, not margin", () => {
    const v = { labourAllowance: 800, materialAllowance: 200, subcontractorAllowance: 0, otherAllowance: 0, markupPercent: 25, status: "APPROVED" };
    expect(variationSellPrice(v)).toBeCloseTo(1250); // 1000 * 1.25
    expect(variationProfit(v)).toBeCloseTo(250);
  });

  it("respects a manual sell price override", () => {
    const v = { labourAllowance: 800, materialAllowance: 200, subcontractorAllowance: 0, otherAllowance: 0, markupPercent: 25, sellPriceOverride: 1500, status: "APPROVED" };
    expect(variationSellPrice(v)).toBe(1500);
  });

  it("only folds APPROVED variations into the job's contract value and budget, never the original", () => {
    const job = {
      quoteAmount: 20000,
      budgetLabourHours: 100,
      budgetLabourCost: 8000,
      budgetMaterials: 6000,
      budgetSubcontractors: 0,
      budgetOtherDirectCosts: 0,
      percentComplete: 50,
    };
    const variations = [
      { labourAllowance: 400, materialAllowance: 100, subcontractorAllowance: 0, otherAllowance: 0, markupPercent: 20, status: "APPROVED" }, // sell = 600
      { labourAllowance: 1000, materialAllowance: 0, subcontractorAllowance: 0, otherAllowance: 0, markupPercent: 20, status: "PENDING" }, // not yet approved
    ];
    const effective = applyApprovedVariations(job, variations);
    expect(effective.quoteAmount).toBeCloseTo(20600); // only the approved variation counted
    expect(effective.budgetLabourCost).toBeCloseTo(8400);
    expect(job.quoteAmount).toBe(20000); // original untouched
  });
});

describe("purchasing / committed cost", () => {
  const pos = [
    { status: "SENT", lines: [{ quantity: 10, unitCost: 25 }, { quantity: 2, unitCost: 50 }] }, // 350, open
    { status: "CLOSED", lines: [{ quantity: 5, unitCost: 100 }] }, // 500, closed — not committed
  ];

  it("totals a purchase order from its lines", () => {
    expect(purchaseOrderTotal(pos[0])).toBe(350);
  });

  it("only counts open-status POs as committed cost", () => {
    expect(committedCost(pos, ["DRAFT", "SENT", "APPROVED"])).toBe(350);
  });
});

describe("jobForecast with committed cost", () => {
  it("adds committed cost on top of actual and the remaining budget estimate", () => {
    const job = {
      quoteAmount: 50000,
      budgetLabourHours: 200,
      budgetLabourCost: 20000,
      budgetMaterials: 15000,
      budgetSubcontractors: 0,
      budgetOtherDirectCosts: 0,
      percentComplete: 50, // remaining estimate = 35000 * 0.5 = 17500
    };
    const entries = [{ category: "LABOUR", amount: 10000, hours: 100 }];
    const forecast = jobForecast(job, entries, 5000); // 5000 committed via open POs
    expect(forecast.actualTotalCost).toBe(10000);
    expect(forecast.committedCost).toBe(5000);
    expect(forecast.forecastFinalCost).toBeCloseTo(10000 + 5000 + 17500);
  });
});
