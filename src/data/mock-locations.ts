export interface Location {
  id: string;
  name: string;
  city: string;
  sector: string;
  annualBudget: number;
}

export const mockLocations: Location[] = [
  { id: "loc-001", name: "VlietStad", city: "Amsterdam", sector: "GGZ", annualBudget: 3000000 },
  { id: "loc-002", name: "De VeldKeur", city: "Achterhoek", sector: "Elderly Care & Somatic", annualBudget: 2000000 },
  { id: "loc-003", name: "'t Hoge Hof", city: "Veluwe", sector: "Dementia & Alzheimer", annualBudget: 3000000 },
];
