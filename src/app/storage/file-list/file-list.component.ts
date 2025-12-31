import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FileService } from '../file.service';
import { StoredFile, FileListParams } from '../models/file.model';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './file-list.component.html',
  styleUrl: './file-list.component.scss'
})
export class FileListComponent implements OnInit {
  files: StoredFile[] = [];
  filteredFiles: StoredFile[] = [];
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
    startDate: '',
    endDate: ''
  };

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  /**
   * Load files from API
   */
  loadFiles(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.fileService.listFiles(this.filters).subscribe({
      next: (response) => {
        // Handle different response formats
        let files: StoredFile[] = [];
        
        if (Array.isArray(response)) {
          files = response;
        } else if (response && Array.isArray((response as any).data)) {
          files = (response as any).data;
        } else if (response && typeof response === 'object') {
          // If response is an object, try to extract array from common properties
          files = (response as any).items || (response as any).results || [];
        } else {
          // If response is null, undefined, or unexpected format
          console.warn('Unexpected API response format:', response);
          files = [];
        }
        
        // Ensure we have an array and filter out deleted files
        // Also normalize tags to ensure they're always arrays
        this.files = Array.isArray(files) 
          ? files
              .filter(f => f && !f.deletedAtUtc)
              .map(f => this.normalizeFile(f))
          : [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load files. Please try again.';
        this.isLoading = false;
        console.error('Error loading files:', error);
        this.files = [];
        this.filteredFiles = [];
      }
    });
  }

  /**
   * Apply filters to files
   */
  applyFilters(): void {
    // Ensure files is always an array
    if (!Array.isArray(this.files)) {
      this.files = [];
    }
    
    let filtered = [...this.files];

    // Filter by name
    if (this.filters.name) {
      const nameLower = this.filters.name.toLowerCase();
      filtered = filtered.filter(f => 
        f.originalName.toLowerCase().includes(nameLower)
      );
    }

    // Filter by tag
    if (this.filters.tag) {
      const tagLower = this.filters.tag.toLowerCase();
      filtered = filtered.filter(f => {
        if (!f.tags || !Array.isArray(f.tags)) return false;
        return f.tags.some(tag => 
          typeof tag === 'string' && tag.toLowerCase().includes(tagLower)
        );
      });
    }

    // Filter by content type
    if (this.filters.contentType) {
      filtered = filtered.filter(f => 
        f.contentType.includes(this.filters.contentType!)
      );
    }

    // Filter by date range
    if (this.filters.startDate) {
      const startDate = new Date(this.filters.startDate);
      filtered = filtered.filter(f => 
        new Date(f.createdAtUtc) >= startDate
      );
    }

    if (this.filters.endDate) {
      const endDate = new Date(this.filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(f => 
        new Date(f.createdAtUtc) <= endDate
      );
    }

    this.filteredFiles = filtered;
    this.totalPages = Math.ceil(this.filteredFiles.length / this.pageSize);
    this.currentPage = 1; // Reset to first page when filtering
  }

  /**
   * Get paginated files
   */
  get paginatedFiles(): StoredFile[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredFiles.slice(start, end);
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      name: '',
      tag: '',
      contentType: '',
      startDate: '',
      endDate: ''
    };
    this.applyFilters();
  }

  /**
   * Download a file
   */
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
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        alert('Failed to download file. Please try again.');
      }
    });
  }

  /**
   * Soft delete a file
   */
  softDelete(file: StoredFile): void {
    if (confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      this.fileService.softDelete(file.id).subscribe({
        next: () => {
          this.loadFiles();
        },
        error: (error) => {
          console.error('Error deleting file:', error);
          alert('Failed to delete file. Please try again.');
        }
      });
    }
  }

  /**
   * Hard delete a file (admin only)
   */
  hardDelete(file: StoredFile): void {
    if (confirm(`Are you sure you want to permanently delete "${file.originalName}"? This action cannot be undone.`)) {
      this.fileService.hardDelete(file.id).subscribe({
        next: () => {
          this.loadFiles();
        },
        error: (error) => {
          console.error('Error hard deleting file:', error);
          alert('Failed to delete file. Please try again.');
        }
      });
    }
  }

  /**
   * Normalize file object to ensure tags is always an array
   */
  private normalizeFile(file: StoredFile): StoredFile {
    if (!file.tags || !Array.isArray(file.tags)) {
      // If tags is a string, try to parse it or convert to array
      if (typeof file.tags === 'string') {
        file.tags = file.tags ? [file.tags] : [];
      } else {
        file.tags = [];
      }
    }
    return file;
  }

  /**
   * Format tags for display
   */
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

  /**
   * Check if file has tags
   */
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
   * Get file icon
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
   * Check if user is admin
   */
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * Navigate to upload page
   */
  goToUpload(): void {
    this.router.navigate(['/storage/upload']);
  }

  /**
   * Navigate to preview page
   */
  previewFile(file: StoredFile): void {
    this.router.navigate(['/storage/preview', file.id]);
  }
}
