import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService, UploadProgress } from '../file.service';
import { FileUploadResponse } from '../models/file.model';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';

interface FileUploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  response?: FileUploadResponse;
  subscription?: any;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent implements OnInit {
  files: FileUploadItem[] = [];
  tags: string = '';
  isDragging = false;
  maxFileSize = 200 * 1024 * 1024; // 200MB default

  constructor(
    private fileService: FileService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handle drop event
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  /**
   * Handle file input change
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  /**
   * Process selected files
   */
  private handleFiles(files: File[]): void {
    files.forEach(file => {
      // Validate file size
      if (file.size > this.maxFileSize) {
        this.files.push({
          file,
          progress: 0,
          status: 'error',
          error: `File size exceeds ${this.formatFileSize(this.maxFileSize)}`
        });
        return;
      }

      // Add file to upload queue
      const uploadItem: FileUploadItem = {
        file,
        progress: 0,
        status: 'pending'
      };
      this.files.push(uploadItem);

      // Start upload
      this.uploadFile(uploadItem);
    });
  }

  /**
   * Upload a single file
   */
  private uploadFile(uploadItem: FileUploadItem): void {
    uploadItem.status = 'uploading';
    uploadItem.progress = 0;

    const tagsArray = this.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const subscription = this.fileService.upload(uploadItem.file, tagsArray).subscribe({
      next: (result: UploadProgress) => {
        uploadItem.progress = result.progress;
        
        if (result.response) {
          uploadItem.status = 'success';
          uploadItem.response = result.response;
          uploadItem.subscription = undefined;
          this.toastService.success(`File "${uploadItem.file.name}" uploaded successfully`);
        }
      },
      error: (error) => {
        uploadItem.status = 'error';
        uploadItem.error = error.error?.title || error.message || 'Upload failed';
        uploadItem.progress = 0;
        uploadItem.subscription = undefined;
        this.toastService.error(`Failed to upload "${uploadItem.file.name}": ${uploadItem.error}`);
      }
    });

    uploadItem.subscription = subscription;
  }

  /**
   * Remove file from list
   */
  removeFile(index: number): void {
    const uploadItem = this.files[index];
    if (uploadItem.subscription) {
      uploadItem.subscription.unsubscribe();
    }
    this.files.splice(index, 1);
  }

  /**
   * Clear all completed uploads
   */
  clearCompleted(): void {
    this.files = this.files.filter(item => item.status === 'uploading' || item.status === 'pending');
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on content type
   */
  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('zip') || contentType.includes('rar')) return '📦';
    if (contentType.includes('text')) return '📝';
    return '📎';
  }

  /**
   * Navigate to file list
   */
  goToFileList(): void {
    this.router.navigate(['/storage']);
  }

  /**
   * Check if all uploads are complete
   */
  get allUploadsComplete(): boolean {
    return this.files.length > 0 && this.files.every(f => f.status === 'success' || f.status === 'error');
  }

  /**
   * Get upload statistics
   */
  get uploadStats() {
    return {
      total: this.files.length,
      success: this.files.filter(f => f.status === 'success').length,
      error: this.files.filter(f => f.status === 'error').length,
      uploading: this.files.filter(f => f.status === 'uploading').length,
      pending: this.files.filter(f => f.status === 'pending').length
    };
  }
}
