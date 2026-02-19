export interface Supplier {
  id: string;
  name: string;
  category: string;
  website: string;
  approved: boolean;
}

export const mockSuppliers: Supplier[] = [
  { id: "sup-001", name: "ABENA Healthcare BV", category: "Medical supplies", website: "abena.nl", approved: true },
  { id: "sup-002", name: "Lyreco Nederland bv", category: "Office supplies", website: "lyreco.com", approved: true },
  { id: "sup-003", name: "Mediq Nederland BV", category: "Medical supplies", website: "mediq.nl", approved: true },
  { id: "sup-004", name: "Technische Unie BV", category: "Technical materials", website: "technischeunie.nl", approved: true },
];
