export type MilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'COMPLETED';

export interface Milestone {
  id:          string;
  projectId:   string;
  title:       string;
  description?: string;
  dueDate?:    string;
  status:      MilestoneStatus;
  order:       number;
  createdAt:   string;
  tasks?:      { id: string; status: string }[];
  _count?: {
    tasks:    number;
    invoices: number;
  };
}

export interface CreateMilestoneInput {
  projectId:    string;
  title:        string;
  description?: string;
  dueDate?:     string;
  order?:       number;
}

export interface UpdateMilestoneInput extends Partial<Omit<CreateMilestoneInput, 'projectId'>> {}

export interface ReorderMilestoneItem {
  id:    string;
  order: number;
}
