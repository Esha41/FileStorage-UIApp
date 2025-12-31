/**
 * API Configuration
 * Update this file to change the API base URL
 */
export const API_CONFIG = {
  baseUrl: 'https://localhost:44356/api',
  filesEndpoint: '/files'
} as const;

export const API_URLS = {
  files: `${API_CONFIG.baseUrl}${API_CONFIG.filesEndpoint}`,
  fileById: (id: string) => `${API_CONFIG.baseUrl}${API_CONFIG.filesEndpoint}/${id}`,
  fileDownload: (id: string) => `${API_CONFIG.baseUrl}${API_CONFIG.filesEndpoint}/${id}/download`,
  filePreview: (id: string) => `${API_CONFIG.baseUrl}${API_CONFIG.filesEndpoint}/${id}/preview`,
  fileSoftDelete: (id: string) => `${API_CONFIG.baseUrl}${API_CONFIG.filesEndpoint}/${id}`,
  fileHardDelete: (id: string) => `${API_CONFIG.baseUrl}${API_CONFIG.filesEndpoint}/${id}/hard`
} as const;

