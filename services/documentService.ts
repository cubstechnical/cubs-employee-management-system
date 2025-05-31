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

  async uploadDocument(params: UploadDocumentParams): Promise<EmployeeDocument> {
    try {
      // First, upload file to Backblaze B2
      const uploadResult = await this.uploadToB2(params.fileUri, params.fileName);

      // Then save document metadata to Supabase
      const documentData: CreateEmployeeDocumentData = {
        employee_id: params.employeeId,
        document_type: params.documentType,
        file_name: params.fileName,
        file_url: uploadResult.fileUrl,
        file_size: uploadResult.fileSize,
        mime_type: uploadResult.mimeType,
        uploaded_by: params.uploadedBy,
        expiry_date: params.expiryDate || null,
        notes: params.notes || null,
        document_number: params.documentNumber || '',
        issuing_authority: params.issuingAuthority || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('employee_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
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

  async deleteDocument(id: string): Promise<void> {
    try {
      // First get the document to get the file URL
      const document = await this.getDocumentById(id);
      
      if (document) {
        // Delete file from Backblaze B2
        await this.deleteFromB2(document.file_url);
      }

      // Then delete document record from Supabase
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async downloadDocument(document: EmployeeDocument): Promise<string> {
    try {
      // Generate a signed URL for secure download
      const signedUrl = await this.generateSignedDownloadUrl(document.file_url);
      
      // Log the download for audit purposes
      console.log(`Document downloaded: ${document.file_name} by user at ${new Date().toISOString()}`);
      
      return signedUrl;
    } catch (error) {
      console.error('Error downloading document:', error);
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