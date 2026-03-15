export interface VyrnFile {
  id:              string;
  projectId?:      string;
  clientId?:       string;
  name:            string;
  cloudinaryId:    string;
  cloudinaryUrl:   string;
  mimeType:        string;
  size:            number;
  uploadedBy:      string;
  version:         number;
  isClientVisible: boolean;
  createdAt:       string;
}

export interface UpdateFileInput {
  name?:            string;
  isClientVisible?: boolean;
}
