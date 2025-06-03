import { supabase, EmployeeDocument, Database } from './supabase';
import * as FileSystem from 'expo-file-system';

export type CreateEmployeeDocumentData = Database['public']['Tables']['employee_documents']['Insert'];
export type UpdateEmployeeDocumentData = Database['public']['Tables']['employee_documents']['Update'];

interface UploadDocumentParams {
  employeeId: string;
  documentType: string;
  fileName: string;
  fileUri: string;
  uploadedBy: string;
  expiryDate?: string;
  notes?: string;
  documentNumber?: string;
  issuingAuthority?: string;
}

interface B2UploadResponse {
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface DocumentUploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
  fileSize?: number;
  fileType?: string;
}

export interface DocumentValidation {
  isValid: boolean;
  errors: string[];
  fileSize: number;
  fileType: string;
  fileName: string;
}

// ENHANCED: File size and type constraints
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ALLOWED_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx'
];

// ENHANCED: Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ENHANCED: Get file extension
const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
};

// ENHANCED: Validate file before upload
export const validateFile = (file: File): DocumentValidation => {
  const errors: string[] = [];
  const fileSize = file.size;
  const fileType = file.type;
  const fileName = file.name;
  const fileExtension = getFileExtension(fileName);

  // Check file size (2MB limit)
  if (fileSize > MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(fileSize)}) exceeds the 2MB limit. Please compress or choose a smaller file.`);
  }

  // Check file type
  const isValidType = ALLOWED_FILE_TYPES.includes(fileType) || ALLOWED_EXTENSIONS.includes(fileExtension);
  if (!isValidType) {
    errors.push(`File type "${fileType || fileExtension}" is not supported. Allowed formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX`);
  }

  // Check file name
  if (!fileName || fileName.trim() === '') {
    errors.push('File name is required');
  }

  // Check for potentially malicious files
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  if (suspiciousExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
    errors.push('This file type is not allowed for security reasons');
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileSize,
    fileType,
    fileName
  };
};

// ENHANCED: Generate unique file name
const generateUniqueFileName = (originalName: string, employeeId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
  
  return `documents/${employeeId}/${timestamp}_${randomString}_${baseName}${extension}`;
};

// ENHANCED: Upload document with validation and progress
export const uploadDocument = async (
  file: File,
  employeeId: string,
  documentType: string,
  onProgress?: (progress: number) => void
): Promise<DocumentUploadResult> => {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join('; '),
        fileSize: validation.fileSize,
        fileType: validation.fileType
      };
    }

    // Generate unique file name
    const fileName = generateUniqueFileName(file.name, employeeId);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Upload error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Duplicate')) {
        return {
          success: false,
          error: 'A file with this name already exists. Please rename the file and try again.',
          fileSize: file.size,
          fileType: file.type
        };
      } else if (error.message.includes('size')) {
        return {
          success: false,
          error: 'File size exceeds the allowed limit (2MB). Please compress the file and try again.',
          fileSize: file.size,
          fileType: file.type
        };
      } else {
        return {
          success: false,
          error: `Upload failed: ${error.message}`,
          fileSize: file.size,
          fileType: file.type
        };
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(fileName);

    // Save document metadata to database
    const { error: dbError } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type: documentType,
        file_name: file.name,
        file_path: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('employee-documents')
        .remove([fileName]);

      return {
        success: false,
        error: `Failed to save document information: ${dbError.message}`,
        fileSize: file.size,
        fileType: file.type
      };
    }

    // Simulate progress for better UX
    onProgress?.(100);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      fileType: file.type
    };

  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
      fileSize: file.size,
      fileType: file.type
    };
  }
};

// ENHANCED: Get storage usage statistics
export const getStorageStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  usedPercentage: number;
  freeSpace: number;
  freeSpaceFormatted: string;
}> => {
  try {
    const { data: files, error } = await supabase
      .from('employee_documents')
      .select('file_size');

    if (error) throw error;

    const totalFiles = files?.length || 0;
    const totalSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
    
    // Free tier limit: 10GB
    const freeLimit = 10 * 1024 * 1024 * 1024; // 10GB in bytes
    const usedPercentage = (totalSize / freeLimit) * 100;
    const freeSpace = freeLimit - totalSize;

    return {
      totalFiles,
      totalSize,
      usedPercentage: Math.min(usedPercentage, 100),
      freeSpace: Math.max(freeSpace, 0),
      freeSpaceFormatted: formatFileSize(Math.max(freeSpace, 0))
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      usedPercentage: 0,
      freeSpace: 0,
      freeSpaceFormatted: '0 Bytes'
    };
  }
};

// ENHANCED: Delete document with cleanup
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    // Get document info first
    const { data: document, error: fetchError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return false;
    }

    // Delete from storage
    if (document?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('employee-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Don't return false here, continue to delete DB record
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting document:', error);
    return false;
  }
};

// ENHANCED: Get employee documents
export const getEmployeeDocuments = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    return [];
  }
};

// ENHANCED: Download document
export const downloadDocument = async (filePath: string, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .download(filePath);

    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading document:', error);
    return false;
  }
};

class DocumentService {
  private readonly B2_API_URL = process.env.EXPO_PUBLIC_B2_API_URL || 'your-b2-api-url';
  private readonly B2_BUCKET_NAME = process.env.EXPO_PUBLIC_B2_BUCKET_NAME || 'your-bucket-name';

  async getAllDocuments(): Promise<EmployeeDocument[]> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async getDocumentsByEmployee(employeeId: string): Promise<EmployeeDocument[]> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      throw error;
    }
  }

  async getDocumentById(id: string): Promise<EmployeeDocument | null> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  async updateDocument(id: string, documentData: UpdateEmployeeDocumentData): Promise<EmployeeDocument> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .update({ ...documentData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async searchDocuments(searchTerm: string): Promise<EmployeeDocument[]> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .or(`file_name.ilike.%${searchTerm}%,document_type.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,issuing_authority.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  async getDocumentsByType(documentType: string): Promise<EmployeeDocument[]> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('document_type', documentType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents by type:', error);
      throw error;
    }
  }

  // Private methods for Backblaze B2 integration
  private async uploadToB2(fileUri: string, fileName: string): Promise<B2UploadResponse> {
    try {
      // For now, this is a mock implementation
      // In a real app, you would implement the actual B2 upload logic
      // or use a serverless function/Edge Function to handle the upload
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Mock upload to B2 (replace with actual B2 API call)
      const mockFileUrl = `${this.B2_API_URL}/${this.B2_BUCKET_NAME}/${Date.now()}_${fileName}`;
      
      // In a real implementation, you would:
      // 1. Get B2 upload authorization
      // 2. Upload file to B2
      // 3. Return the actual file URL and metadata

      return {
        fileUrl: mockFileUrl,
        fileSize: fileInfo.size || 0,
        mimeType: this.getMimeType(fileName),
      };
    } catch (error) {
      console.error('Error uploading to B2:', error);
      throw error;
    }
  }

  private async deleteFromB2(fileUrl: string): Promise<void> {
    try {
      // Mock deletion from B2
      console.log(`Deleting file from B2: ${fileUrl}`);
      
      // In a real implementation, you would:
      // 1. Extract file ID from URL
      // 2. Get B2 delete authorization
      // 3. Delete file from B2
    } catch (error) {
      console.error('Error deleting from B2:', error);
      throw error;
    }
  }

  private async generateSignedDownloadUrl(fileUrl: string): Promise<string> {
    try {
      // Mock signed URL generation
      // In a real implementation, you would generate a time-limited signed URL
      return `${fileUrl}?signed=${Date.now()}`;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      txt: 'text/plain',
      csv: 'text/csv',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  // Statistics and analytics
  async getDocumentStats() {
    try {
      const [totalResult, passportResult, visaResult, contractResult, otherResult] = await Promise.all([
        supabase.from('employee_documents').select('id', { count: 'exact', head: true }),
        supabase.from('employee_documents').select('id', { count: 'exact', head: true }).eq('document_type', 'passport'),
        supabase.from('employee_documents').select('id', { count: 'exact', head: true }).eq('document_type', 'visa'),
        supabase.from('employee_documents').select('id', { count: 'exact', head: true }).eq('document_type', 'contract'),
        supabase.from('employee_documents').select('id', { count: 'exact', head: true }).eq('document_type', 'other'),
      ]);

      // Calculate total storage used
      const { data: storageData } = await supabase
        .from('employee_documents')
        .select('file_size');

      const totalStorage = storageData?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;

      return {
        total: totalResult.count || 0,
        passport: passportResult.count || 0,
        visa: visaResult.count || 0,
        contract: contractResult.count || 0,
        other: otherResult.count || 0,
        totalStorageBytes: totalStorage,
        totalStorageMB: Math.round(totalStorage / (1024 * 1024) * 100) / 100,
      };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService(); 