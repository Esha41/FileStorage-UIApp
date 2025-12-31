import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./file-list/file-list.component').then(m => m.FileListComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./file-upload/file-upload.component').then(m => m.FileUploadComponent)
  },
  {
    path: 'preview/:id',
    loadComponent: () => import('./file-preview/file-preview.component').then(m => m.FilePreviewComponent)
  }
];

