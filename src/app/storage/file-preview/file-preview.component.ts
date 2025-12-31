import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FileService } from '../file.service';
import { StoredFile } from '../models/file.model';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.scss'
})
export class FilePreviewComponent implements OnInit, OnDestroy {
  file: StoredFile | null = null;
  previewUrl: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  fileId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fileService: FileService
  ) {}

  ngOnInit(): void {
    this.fileId = this.route.snapshot.paramMap.get('id') || '';
    if (this.fileId) {
      this.loadFile();
    } else {
      this.errorMessage = 'File ID not provided';
      this.isLoading = false;
    }
  }

  /**
   * Load file metadata and preview
   */
  loadFile(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Load file metadata
    this.fileService.getFile(this.fileId).subscribe({
      next: (file) => {
        this.file = file;
        this.loadPreview();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load file. Please try again.';
        this.isLoading = false;
        console.error('Error loading file:', error);
      }
    });
  }

  /**
   * Load file preview
   */
  loadPreview(): void {
    if (!this.file) return;

    const isImage = this.file.contentType.startsWith('image/');
    const isPdf = this.file.contentType.includes('pdf');

    if (isImage || isPdf) {
      this.fileService.previewFile(this.fileId).subscribe({
        next: (blob) => {
          this.previewUrl = URL.createObjectURL(blob);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading preview:', error);
          this.errorMessage = 'Failed to load preview.';
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Preview not available for this file type.';
      this.isLoading = false;
    }
  }

  /**
   * Download file
   */
  downloadFile(): void {
    if (!this.file) return;

    this.fileService.downloadFile(this.fileId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.file!.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        alert('Failed to download file. Please try again.');
      }
    });
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
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  }

  /**
   * Go back to file list
   */
  goBack(): void {
    this.router.navigate(['/storage']);
  }

  /**
   * Check if file is image
   */
  get isImage(): boolean {
    return this.file?.contentType.startsWith('image/') || false;
  }

  /**
   * Check if file is PDF
   */
  get isPdf(): boolean {
    return this.file?.contentType.includes('pdf') || false;
  }

  /**
   * Cleanup preview URL on destroy
   */
  ngOnDestroy(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}
