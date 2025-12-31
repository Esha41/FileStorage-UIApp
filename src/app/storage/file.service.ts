import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoredFile, FileUploadResponse, FileListParams } from './models/file.model';
import { API_URLS } from '../core/config/api.config';

export interface UploadProgress {
  progress: number;
  response?: FileUploadResponse;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private apiUrl = API_URLS.files;

  constructor(private http: HttpClient) {}

  /**
   * Upload a file with progress tracking
   * @param file The file to upload
   * @param tags Optional tags for the file
   * @returns Observable with upload progress (0-100) and final response
   */
  upload(file: File, tags?: string[]): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (tags && tags.length > 0) {
      tags.forEach(tag => formData.append('tags', tag));
    }

    return this.http.post<FileUploadResponse>(this.apiUrl, formData, { 
      reportProgress: true, 
      observe: 'events' 
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round((event.loaded / event.total) * 100);
          return { progress };
        } else if (event.type === HttpEventType.Response && event.body) {
          return { progress: 100, response: event.body };
        }
        return { progress: 0 };
      })
    );
  }

  /**
   * Get list of files with optional filtering and pagination
   * @param params Query parameters for filtering and pagination
   * @returns Observable of file array
   */
  listFiles(params?: FileListParams): Observable<StoredFile[]> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.name) httpParams = httpParams.set('name', params.name);
      if (params.tag) httpParams = httpParams.set('tag', params.tag);
      if (params.contentType) httpParams = httpParams.set('contentType', params.contentType);
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<StoredFile[]>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get file by ID
   * @param id File ID
   * @returns Observable of file metadata
   */
  getFile(id: string): Observable<StoredFile> {
    return this.http.get<StoredFile>(API_URLS.fileById(id));
  }

  /**
   * Download a file
   * @param id File ID
   * @returns Observable of file blob
   */
  downloadFile(id: string): Observable<Blob> {
    return this.http.get(API_URLS.fileDownload(id), { responseType: 'blob' });
  }

  /**
   * Preview a file (for images and PDFs)
   * @param id File ID
   * @returns Observable of file blob
   */
  previewFile(id: string): Observable<Blob> {
    return this.http.get(API_URLS.filePreview(id), { 
      responseType: 'blob',
      observe: 'body'
    });
  }

  /**
   * Soft delete a file
   * @param id File ID
   * @returns Observable
   */
  softDelete(id: string): Observable<void> {
    return this.http.delete<void>(API_URLS.fileSoftDelete(id));
  }

  /**
   * Hard delete a file (admin only)
   * @param id File ID
   * @returns Observable
   */
  hardDelete(id: string): Observable<void> {
    return this.http.delete<void>(API_URLS.fileHardDelete(id));
  }
}
