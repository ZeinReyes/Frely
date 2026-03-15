export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus    = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority      = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id:          string;
  clientId:    string;
  name:        string;
  description?: string;
  status:      ProjectStatus;
  startDate?:  string;
  endDate?:    string;
  budget?:     number;
  createdAt:   string;
  updatedAt:   string;
  client: {
    id:        string;
    name:      string;
    avatarUrl?: string;
  };
  milestones?: Milestone[];
  _count?: {
    tasks:       number;
    files:       number;
    timeEntries: number;
  };
}

export interface Milestone {
  id:          string;
  projectId:   string;
  title:       string;
  description?: string;
  dueDate?:    string;
  status:      'PENDING' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'APPROVED' | 'COMPLETED';
  order:       number;
  createdAt:   string;
}

export interface Task {
  id:              string;
  projectId:       string;
  milestoneId?:    string;
  parentId?:       string;
  title:           string;
  description?:    string;
  status:          TaskStatus;
  priority:        Priority;
  dueDate?:        string;
  position:        number;
  isClientVisible: boolean;
  createdAt:       string;
  updatedAt:       string;
  subtasks?:       SubTask[];
  milestone?:      { id: string; title: string };
  _count?: {
    comments: number;
    subtasks: number;
  };
}

export interface SubTask {
  id:     string;
  title:  string;
  status: TaskStatus;
}

export interface Comment {
  id:        string;
  taskId:    string;
  authorId?: string;
  clientId?: string;
  content:   string;
  createdAt: string;
}

export interface KanbanBoard {
  TODO:        Task[];
  IN_PROGRESS: Task[];
  REVIEW:      Task[];
  DONE:        Task[];
}

export interface CreateProjectInput {
  clientId:    string;
  name:        string;
  description?: string;
  status?:     ProjectStatus;
  startDate?:  string;
  endDate?:    string;
  budget?:     number;
}

export interface UpdateProjectInput extends Partial<Omit<CreateProjectInput, 'clientId'>> {}

export interface CreateTaskInput {
  projectId:        string;
  title:            string;
  description?:     string;
  status?:          TaskStatus;
  priority?:        Priority;
  dueDate?:         string;
  milestoneId?:     string;
  parentId?:        string;
  isClientVisible?: boolean;
}

export interface UpdateTaskInput extends Partial<Omit<CreateTaskInput, 'projectId'>> {}

export interface MoveTaskInput {
  status:   TaskStatus;
  position: number;
}

export interface ListProjectsParams {
  page?:     number;
  limit?:    number;
  search?:   string;
  status?:   ProjectStatus;
  clientId?: string;
  sortBy?:   string;
  sortDir?:  'asc' | 'desc';
}
