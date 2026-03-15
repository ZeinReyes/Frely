export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface LineItem {
  description: string;
  quantity:    number;
  unitPrice:   number;
  amount:      number;
}

export interface Invoice {
  id:              string;
  clientId:        string;
  projectId?:      string;
  milestoneId?:    string;
  invoiceNumber:   string;
  title:           string;
  lineItems:       LineItem[];
  subtotal:        number;
  taxRate:         number;
  taxAmount:       number;
  discount:        number;
  total:           number;
  currency:        string;
  status:          InvoiceStatus;
  dueDate?:        string;
  paidAt?:         string;
  stripePaymentUrl?: string;
  notes?:          string;
  createdAt:       string;
  client: {
    id:       string;
    name:     string;
    email:    string;
    company?: string;
  };
  project?: { id: string; name: string };
  milestone?: { id: string; title: string };
}

export interface InvoiceStats {
  total:        number;
  draft:        number;
  sent:         number;
  paid:         number;
  overdue:      number;
  totalPaid:    number;
  totalPending: number;
}

export interface CreateInvoiceInput {
  clientId:    string;
  projectId?:  string;
  milestoneId?: string;
  title:       string;
  lineItems:   LineItem[];
  currency?:   string;
  taxRate?:    number;
  discount?:   number;
  dueDate?:    string;
  notes?:      string;
}
