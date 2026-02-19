export interface SubLedger {
  id: string;
  code: number;
  name: string;
  budget: number;
  spent: number;
}

export interface LedgerCategory {
  id: string;
  code: string;
  name: string;
  totalBudget: number;
  subLedgers: SubLedger[];
}

export const mockLedger: LedgerCategory[] = [
  {
    id: "cat-002",
    code: "1",
    name: "1. FOOD, BEVERAGES & KITCHEN",
    totalBudget: 1800000,
    subLedgers: [
      { id: "sl-010", code: 4110, name: "Nutrition", budget: 900000, spent: 680000 },
      { id: "sl-011", code: 4120, name: "Meals provided by third parties", budget: 550000, spent: 420000 },
      { id: "sl-012", code: 4130, name: "Beverages & Snacks", budget: 350000, spent: 210000 },
    ],
  },
  {
    id: "cat-001",
    code: "3",
    name: "3. CARE & TREATMENT",
    totalBudget: 3500000,
    subLedgers: [
      { id: "sl-001", code: 4310, name: "Incontinence Materials", budget: 1200000, spent: 1100000 },
      { id: "sl-003", code: 4330, name: "Medical Aids", budget: 800000, spent: 750000 },
      { id: "sl-004", code: 4340, name: "Recreation (Activities & Wellbeing)", budget: 500000, spent: 625000 },
    ],
  },
];
