export type ProposalStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'DECLINED';
export type ContractStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'CANCELLED';
export type PaymentSchedule = 'UPFRONT' | 'SPLIT_50_50' | 'MILESTONE' | 'CUSTOM';

export interface LineItem {
  description: string;
  quantity:    number;
  unitPrice:   number;
  amount:      number;
}

export interface PaymentMilestone {
  label:   string;
  percent: number;
  dueOn?:  string;
}

export interface Proposal {
  id:             string;
  clientId:       string;
  projectId?:     string;
  proposalNumber: string;
  title:          string;
  introduction?:  string;
  scope?:         string;
  terms?:         string;
  lineItems:      LineItem[];
  subtotal:       number;
  total:          number;
  currency:       string;
  validUntil?:    string;
  notes?:         string;
  status:         ProposalStatus;
  sentAt?:        string;
  createdAt:      string;
  client: {
    id:       string;
    name:     string;
    email:    string;
    company?: string;
  };
}

export interface Contract {
  id:             string;
  clientId:       string;
  projectId?:     string;
  proposalId?:    string;
  contractNumber: string;
  signToken:      string;
  title:          string;
  body:           string;
  currency:       string;
  value?:         number;
  startDate?:     string;
  endDate?:       string;
  status:         ContractStatus;
  paymentSchedule?:   PaymentSchedule;
  depositPercent?:    number;
  paymentMilestones?: PaymentMilestone[];
  signatureName?: string;
  signatureDate?: string;
  signedAt?:      string;
  sentAt?:        string;
  createdAt:      string;
  client: {
    id:       string;
    name:     string;
    email:    string;
    company?: string;
  };
}

export interface CreateProposalInput {
  clientId:      string;
  projectId?:    string;
  title:         string;
  introduction?: string;
  scope?:        string;
  terms?:        string;
  lineItems:     LineItem[];
  currency?:     string;
  validUntil?:   string;
  notes?:        string;
}

export interface CreateContractInput {
  clientId:           string;
  projectId?:         string;
  proposalId?:        string;
  title:              string;
  body:               string;
  currency?:          string;
  value?:             number;
  startDate?:         string;
  endDate?:           string;
  paymentSchedule?:   PaymentSchedule;
  depositPercent?:    number;
  paymentMilestones?: PaymentMilestone[];
}