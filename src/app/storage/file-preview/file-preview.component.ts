import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  safePreviewUrl: SafeResourceUrl | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  fileId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fileService: FileService,
    private sanitizer: DomSanitizer
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

  loadFile(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.fileService.listFiles().subscribe({
      next: (response) => {
        let files: StoredFile[] = [];
        
        if (Array.isArray(response)) {
          files = response;
        } else if (response && Array.isArray((response as any).data)) {
          files = (response as any).data;
        } else if (response && typeof response === 'object') {
          files = (response as any).items || (response as any).results || [];
        }

        const file = files.find(f => f.id === this.fileId);
        
        if (file) {
          this.file = file;
          this.loadPreview();
        } else {
          this.errorMessage = 'File not found.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load file. Please try again.';
        this.isLoading = false;
        console.error('Error loading file:', error);
      }
    });
  }

  loadPreview(): void {
    if (!this.file) return;

    const isImage = this.file.contentType.startsWith('image/');
    const isPdf = this.file.contentType.includes('pdf');

    if (isImage || isPdf) {
      this.fileService.previewFile(this.fileId).subscribe({
        next: (blob) => {
          try {
            if (blob && blob.size > 0) {
              this.previewUrl = URL.createObjectURL(blob);
              this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
              console.log('Preview URL created:', this.previewUrl, 'Blob size:', blob.size, 'Content type:', blob.type);
              this.isLoading = false;
            } else {
              console.warn('Preview blob is empty');
              this.errorMessage = 'Preview file is empty.';
              this.isLoading = false;
            }
          } catch (error) {
            console.error('Error creating preview URL:', error);
            this.errorMessage = 'Failed to create preview.';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error loading preview:', error);
          this.errorMessage = error.error?.title || error.message || 'Failed to load preview.';
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  }

  goBack(): void {
    this.router.navigate(['/storage']);
  }

  get isImage(): boolean {
    return this.file?.contentType.startsWith('image/') || false;
  }

  get isPdf(): boolean {
    return this.file?.contentType.includes('pdf') || false;
  }

  formatTags(tags: any): string {
    if (!tags) return '';
    if (Array.isArray(tags)) {
      return tags.join(', ');
    }
    if (typeof tags === 'string') {
      return tags;
    }
    return '';
  }

  hasTags(file: StoredFile): boolean {
    if (!file.tags) return false;
    if (Array.isArray(file.tags)) {
      return file.tags.length > 0;
    }
    if (typeof file.tags === 'string') {
      return (file.tags as string).trim().length > 0;
    }
    return false;
  }

  ngOnDestroy(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}
