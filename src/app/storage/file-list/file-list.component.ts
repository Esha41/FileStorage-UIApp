import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FileService } from '../file.service';
import { StoredFile, FileListParams } from '../models/file.model';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './file-list.component.html',
  styleUrl: './file-list.component.scss'
})
export class FileListComponent implements OnInit {
  files: StoredFile[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Filters
  filters: FileListParams = {
    name: '',
    tag: '',
    contentType: '',
    dateFrom: '',
    dateTo: ''
  };

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
  this.isLoading = true;
  this.errorMessage = null;

  const params = {
    ...this.filters,
    pageNumber: this.currentPage,
    pageSize: this.pageSize,
    startDate: this.filters.dateFrom ? new Date(this.filters.dateFrom).toISOString() : undefined,
    endDate: this.filters.dateTo ? new Date(this.filters.dateTo).toISOString() : undefined,
  };

  this.fileService.listFiles(params).subscribe({
    next: (res: any) => {
      this.files = res.items.map((f: StoredFile) => this.normalizeFile(f));
      this.totalPages = Math.ceil(res.totalCount / this.pageSize);
      this.isLoading = false;
    },
    error: () => {
      this.errorMessage = 'Failed to load files';
      this.isLoading = false;
    }
  });
}


  applyFilters(): void {
  this.currentPage = 1;

  this.loadFiles();
}

nextPage(): void {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.loadFiles();
    this.toastService.info(`Navigated to page ${this.currentPage}`);
  }
}

previousPage(): void {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.loadFiles();
    this.toastService.info(`Navigated to page ${this.currentPage}`);
  }
}

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  clearFilters(): void {
    this.filters = {
      name: '',
      tag: '',
      contentType: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  downloadFile(file: StoredFile): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toastService.success(`File "${file.originalName}" downloaded successfully`);
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        this.toastService.error(`Failed to download "${file.originalName}". Please try again.`);
      }
    });
  }

  softDelete(file: StoredFile): void {
    if (confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      this.fileService.softDelete(file.id).subscribe({
        next: () => {
          this.toastService.success(`File "${file.originalName}" deleted successfully`);
          this.loadFiles();
        },
        error: (error) => {
          console.error('Error deleting file:', error);
          this.toastService.error(`Failed to delete "${file.originalName}". Please try again.`);
        }
      });
    }
  }

  hardDelete(file: StoredFile): void {
    if (confirm(`Are you sure you want to permanently delete "${file.originalName}"? This action cannot be undone.`)) {
      this.fileService.hardDelete(file.id).subscribe({
        next: () => {
          this.toastService.warning(`File "${file.originalName}" permanently deleted`);
          this.loadFiles();
        },
        error: (error) => {
          console.error('Error hard deleting file:', error);
          this.toastService.error(`Failed to permanently delete "${file.originalName}". Please try again.`);
        }
      });
    }
  }

  private normalizeFile(file: StoredFile): StoredFile {
    if (!file.tags || !Array.isArray(file.tags)) {
      if (typeof file.tags === 'string') {
        file.tags = file.tags ? [file.tags] : [];
      } else {
        file.tags = [];
      }
    }
    return file;
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

  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('zip') || contentType.includes('rar')) return '📦';
    if (contentType.includes('text')) return '📝';
    return '📎';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  goToUpload(): void {
    this.router.navigate(['/storage/upload']);
  }

  previewFile(file: StoredFile): void {
    this.router.navigate(['/storage/preview', file.id]);
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Logged out successfully');
  }
}
