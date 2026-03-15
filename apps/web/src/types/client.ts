export type ClientStatus = 'LEAD' | 'PROPOSAL_SENT' | 'ACTIVE' | 'COMPLETED' | 'INACTIVE';

export interface Client {
  id:          string;
  name:        string;
  email:       string;
  phone?:      string;
  company?:    string;
  avatarUrl?:  string;
  status:      ClientStatus;
  tags:        string[];
  healthScore: number;
  portalToken: string;
  notes?:      string;
  createdAt:   string;
  updatedAt:   string;
  _count?: {
    projects: number;
    invoices: number;
    files:    number;
  };
}

export interface CreateClientInput {
  name:     string;
  email:    string;
  phone?:   string;
  company?: string;
  notes?:   string;
  tags?:    string[];
  status?:  ClientStatus;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

export interface ListClientsParams {
  page?:    number;
  limit?:   number;
  search?:  string;
  status?:  ClientStatus;
  sortBy?:  string;
  sortDir?: 'asc' | 'desc';
}