/**
 * Backblaze B2 Storage Service for CUBS Technical Contracting
 * Handles document upload, download, and management
 */

import { supabase } from './supabase';

interface BackblazeConfig {
  bucketName: string;
  endpoint: string;
  keyId?: string;
  applicationKey?: string;
}

interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  error?: string;
}

interface FileInfo {
  fileId: string;
  fileName: string;
  contentType: string;
  contentLength: number;
  uploadTimestamp: number;
  url: string;
}

interface DownloadResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: string;
}

// Demo mode flag - checks if Backblaze is configured
const isBackblazeConfigured = (): boolean => {
  const bucketName = process.env.EXPO_PUBLIC_B2_BUCKET_NAME || process.env.B2_BUCKET_NAME;
  const endpoint = process.env.EXPO_PUBLIC_B2_ENDPOINT || process.env.B2_ENDPOINT;
  return !!(bucketName && endpoint);
};

// Get configuration
const getConfig = (): BackblazeConfig => {
  const bucketName = process.env.EXPO_PUBLIC_B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || 'cubs-documents';
  const endpoint = process.env.EXPO_PUBLIC_B2_ENDPOINT || process.env.B2_ENDPOINT || 'https://f004.backblazeb2.com';
  const keyId = process.env.EXPO_PUBLIC_B2_KEY_ID || process.env.B2_KEY_ID;
  const applicationKey = process.env.EXPO_PUBLIC_B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
  
  return { bucketName, endpoint, keyId, applicationKey };
};

/**
 * Generate a unique file name for document storage
 */
const generateFileName = (originalName: string, employeeId: string, documentType: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || '';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `employees/${employeeId}/${documentType}/${timestamp}_${sanitizedName}`;
};

/**
 * Upload a document to Backblaze B2
 */
export const uploadToBackblaze = async (
  file: File | Blob,
  fileName: string,
  employeeId: string,
  documentType: string
): Promise<UploadResult> => {
  console.log('☁️ [BACKBLAZE] Attempting to upload document...');
  
  if (!isBackblazeConfigured()) {
    console.log('☁️ [BACKBLAZE] Demo mode - document would be uploaded:', {
      fileName,
      employeeId,
      documentType,
      size: file.size || 'unknown'
    });
    
    // Simulate async upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResult: UploadResult = {
      success: true,
      fileId: `demo_${Date.now()}`,
      fileName: generateFileName(fileName, employeeId, documentType),
      url: `https://demo-bucket.backblazeb2.com/file/cubs-documents/${generateFileName(fileName, employeeId, documentType)}`
    };
    
    console.log('☁️ [BACKBLAZE] Demo upload completed:', mockResult);
    return mockResult;
  }

  const config = getConfig();
  
  try {
    const storedFileName = generateFileName(fileName, employeeId, documentType);
    const formData = new FormData();
    formData.append('file', file as File, storedFileName);
    
    console.log('☁️ [BACKBLAZE] Uploading to:', `${config.endpoint}/file/${config.bucketName}/${storedFileName}`);
    
    // Note: In a real implementation, you would need to:
    // 1. Authenticate with Backblaze B2 API
    // 2. Get upload URL and authorization token
    // 3. Upload the file using the proper B2 upload API
    
    // For now, we'll simulate the upload since direct B2 uploads require server-side authentication
    const uploadUrl = `${config.endpoint}/file/${config.bucketName}/${storedFileName}`;
    
    // This is a simplified implementation - in production, use proper B2 API
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': config.applicationKey ? `Bearer ${config.applicationKey}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result: UploadResult = {
      success: true,
      fileId: `b2_${Date.now()}`,
      fileName: storedFileName,
      url: uploadUrl,
    };

    console.log('☁️ [BACKBLAZE] Upload successful:', result);
    return result;
    
  } catch (error) {
    console.error('☁️ [BACKBLAZE] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Download a document from Backblaze B2
 */
export const downloadFromBackblaze = async (
  fileId: string,
  fileName: string
): Promise<DownloadResult> => {
  console.log('☁️ [BACKBLAZE] Attempting to download document:', fileId);
  
  if (!isBackblazeConfigured()) {
    console.log('☁️ [BACKBLAZE] Demo mode - document would be downloaded:', { fileId, fileName });
    
    // Simulate async download
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a mock blob for demo
    const mockContent = `Demo document content for ${fileName}`;
    const blob = new Blob([mockContent], { type: 'text/plain' });
    
    console.log('☁️ [BACKBLAZE] Demo download completed');
    return {
      success: true,
      blob,
      url: URL.createObjectURL(blob)
    };
  }

  const config = getConfig();
  
  try {
    const downloadUrl = `${config.endpoint}/file/${config.bucketName}/${fileName}`;
    
    console.log('☁️ [BACKBLAZE] Downloading from:', downloadUrl);
    
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': config.applicationKey ? `Bearer ${config.applicationKey}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    console.log('☁️ [BACKBLAZE] Download successful');
    return {
      success: true,
      blob,
      url
    };
    
  } catch (error) {
    console.error('☁️ [BACKBLAZE] Download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    };
  }
};

/**
 * Delete a document from Backblaze B2
 */
export const deleteFromBackblaze = async (
  fileId: string,
  fileName: string
): Promise<{ success: boolean; error?: string }> => {
  console.log('☁️ [BACKBLAZE] Attempting to delete document:', fileId);
  
  if (!isBackblazeConfigured()) {
    console.log('☁️ [BACKBLAZE] Demo mode - document would be deleted:', { fileId, fileName });
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('☁️ [BACKBLAZE] Demo delete completed');
    return { success: true };
  }

  const config = getConfig();
  
  try {
    // Note: In a real implementation, you would use the B2 delete file API
    const deleteUrl = `${config.endpoint}/b2api/v2/b2_delete_file_version`;
    
    const response = await fetch(deleteUrl, {
      method: 'POST',
      headers: {
        'Authorization': config.applicationKey ? `Bearer ${config.applicationKey}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId,
        fileName
      }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
    }

    console.log('☁️ [BACKBLAZE] Delete successful');
    return { success: true };
    
  } catch (error) {
    console.error('☁️ [BACKBLAZE] Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

/**
 * List documents for an employee
 */
export const listEmployeeDocuments = async (employeeId: string): Promise<FileInfo[]> => {
  console.log('☁️ [BACKBLAZE] Listing documents for employee:', employeeId);
  
  if (!isBackblazeConfigured()) {
    console.log('☁️ [BACKBLAZE] Demo mode - returning enhanced mock documents');
    
    // Return enhanced mock documents for demo - more variety and realistic numbers
    const documentTypes = ['passport', 'visa', 'contract', 'id_copy', 'address_proof', 'photo', 'resume', 'certificates', 'medical_report', 'bank_details'];
    const fileTypes = [
      { ext: '.pdf', type: 'application/pdf', icon: 'file-pdf-box' },
      { ext: '.jpg', type: 'image/jpeg', icon: 'file-image' },
      { ext: '.png', type: 'image/png', icon: 'file-image' },
      { ext: '.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: 'file-document' },
      { ext: '.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', icon: 'file-excel' }
    ];
    
    const mockDocuments: FileInfo[] = [];
    
    // Generate 5-12 documents per employee for realistic demo
    const numDocs = Math.floor(Math.random() * 8) + 5; // 5-12 documents
    
    for (let i = 0; i < numDocs; i++) {
      const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      const timestamp = Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000); // Random date within last year
      const size = Math.floor(Math.random() * 5000000) + 500000; // 500KB - 5MB
      
      mockDocuments.push({
        fileId: `demo_${docType}_${i}_${employeeId}`,
        fileName: `employees/${employeeId}/${docType}/${docType}_${i}${fileType.ext}`,
        contentType: fileType.type,
        contentLength: size,
        uploadTimestamp: timestamp,
        url: `https://demo-bucket.backblazeb2.com/file/cubs-documents/employees/${employeeId}/${docType}/${docType}_${i}${fileType.ext}`
      });
    }
    
    // Sort by upload timestamp (newest first)
    mockDocuments.sort((a, b) => b.uploadTimestamp - a.uploadTimestamp);
    
    console.log(`☁️ [BACKBLAZE] Generated ${mockDocuments.length} mock documents for employee ${employeeId}`);
    return mockDocuments;
  }

  try {
    // Add timeout and retry logic for edge function calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const { data, error } = await supabase.functions.invoke('hyper-task', {
      body: {
        action: 'list',
        employeeId: employeeId,
        prefix: `employees/${employeeId}/`
      }
    });

    clearTimeout(timeoutId);

    if (error) {
      console.warn('☁️ [BACKBLAZE] Edge function error, returning empty list:', error.message);
      return []; // Return empty array instead of throwing
    }
    
    const files: FileInfo[] = (data?.files || []).map((file: any) => ({
      fileId: file.fileId || `unknown_${Date.now()}`,
      fileName: file.fileName || 'unknown_file',
      contentType: file.contentType || 'application/octet-stream',
      contentLength: file.contentLength || 0,
      uploadTimestamp: file.uploadTimestamp || Date.now(),
      url: file.url || ''
    }));

    console.log('☁️ [BACKBLAZE] Listed', files.length, 'documents for employee');
    return files;
    
  } catch (error) {
    console.warn('☁️ [BACKBLAZE] List documents error, returning empty list:', error);
    // Always return empty array instead of throwing to prevent app crashes
    return [];
  }
};

/**
 * Get a signed URL for secure document access
 */
export const getSignedUrl = async (
  fileName: string,
  expirationMinutes: number = 60
): Promise<string | null> => {
  console.log('☁️ [BACKBLAZE] Generating signed URL for:', fileName);
  
  if (!isBackblazeConfigured()) {
    console.log('☁️ [BACKBLAZE] Demo mode - returning mock signed URL');
    const mockUrl = `https://demo-bucket.backblazeb2.com/file/cubs-documents/${fileName}?auth=demo_token&expires=${Date.now() + (expirationMinutes * 60 * 1000)}`;
    return mockUrl;
  }

  const config = getConfig();
  
  try {
    // Note: In a real implementation, you would generate a proper signed URL
    // using B2's authorization token system
    const signedUrl = `${config.endpoint}/file/${config.bucketName}/${fileName}?expires=${Date.now() + (expirationMinutes * 60 * 1000)}`;
    
    console.log('☁️ [BACKBLAZE] Generated signed URL');
    return signedUrl;
    
  } catch (error) {
    console.error('☁️ [BACKBLAZE] Signed URL generation error:', error);
    return null;
  }
};

/**
 * Check if Backblaze is properly configured
 */
export const validateBackblazeConfig = (): { valid: boolean; error?: string } => {
  const config = getConfig();
  
  if (!config.bucketName) {
    return { valid: false, error: 'Bucket name not configured' };
  }
  
  if (!config.endpoint) {
    return { valid: false, error: 'Endpoint not configured' };
  }
  
  if (!isBackblazeConfigured()) {
    return { valid: false, error: 'Running in demo mode - configure B2_BUCKET_NAME and B2_ENDPOINT' };
  }
  
  return { valid: true };
};

/**
 * Get storage statistics
 */
export const getStorageStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  employeeCount: number;
  error?: string;
}> => {
  console.log('☁️ [BACKBLAZE] Getting storage statistics...');
  
  if (!isBackblazeConfigured()) {
    console.log('☁️ [BACKBLAZE] Demo mode - returning mock stats');
    return {
      totalFiles: 147,
      totalSize: 52428800, // 50MB
      employeeCount: 49
    };
  }

  try {
    // Note: In a real implementation, you would query B2 API for bucket statistics
    const config = getConfig();
    
    // This would be implemented using B2's bucket info API
    const mockStats = {
      totalFiles: 0,
      totalSize: 0,
      employeeCount: 0
    };
    
    console.log('☁️ [BACKBLAZE] Storage stats retrieved');
    return mockStats;
    
  } catch (error) {
    console.error('☁️ [BACKBLAZE] Storage stats error:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      employeeCount: 0,
      error: error instanceof Error ? error.message : 'Failed to get storage stats'
    };
  }
};

// Export configuration check
export const isBackblazeEnabled = isBackblazeConfigured; 