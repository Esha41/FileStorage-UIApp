export interface StoredFile {
  id: string;
  key: string;
  originalName: string;
  sizeBytes: number;
  contentType: string;
  checksum: string;
  tags: string[];
  createdAtUtc: string;
  deletedAtUtc: string | null;
  version: number | null;
  createdByUserId: string;
}

export interface FileUploadResponse {
  id: string;
  key: string;
  originalName: string;
  sizeBytes: number;
  contentType: string;
  checksum: string;
  tags: string[];
  createdAtUtc: string;
  version: number | null;
}

export interface FileListParams {
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  name?: string;
  tag?: string;
  contentType?: string;
  startDate?: string;
  endDate?: string;
}

