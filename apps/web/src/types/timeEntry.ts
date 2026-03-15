export interface TimeEntry {
  id:          string;
  userId:      string;
  projectId:   string;
  taskId?:     string;
  description?: string;
  startTime:   string;
  endTime?:    string;
  duration?:   number;
  isBillable:  boolean;
  createdAt:   string;
  project?: { id: string; name: string };
  task?:    { id: string; title: string };
}

export interface ActiveTimer extends TimeEntry {
  endTime: undefined;
}

export interface TimeSummary {
  totalSeconds:    number;
  billableSeconds: number;
  totalHours:      number;
  billableHours:   number;
  entryCount:      number;
}

export interface StartTimerInput {
  projectId:    string;
  taskId?:      string;
  description?: string;
  isBillable?:  boolean;
}

export interface CreateTimeEntryInput {
  projectId:    string;
  taskId?:      string;
  description?: string;
  startTime:    string;
  endTime?:     string;
  isBillable?:  boolean;
}

export interface UpdateTimeEntryInput {
  description?: string;
  startTime?:   string;
  endTime?:     string;
  isBillable?:  boolean;
}

export interface ListTimeEntriesParams {
  projectId?: string;
  taskId?:    string;
  page?:      number;
  limit?:     number;
}
