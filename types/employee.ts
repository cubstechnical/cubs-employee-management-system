export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  trade: string;
  nationality: string;
  date_of_birth: string;
  mobile_number: string;
  home_phone_number: string | null;
  email_id: string;
  company_id: string;
  company_name: string;
  join_date: string;
  visa_expiry_date: string;
  visa_status: string;
  passport_no: string;
  status: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeFormData {
  name: string;
  trade: string;
  nationality: string;
  date_of_birth: string;
  mobile_number: string;
  home_phone_number?: string | null;
  email_id: string;
  company_id: string;
  company_name: string;
  join_date: string;
  visa_expiry_date: string;
  passport_no: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  expiry_date?: string | null;
  notes?: string | null;
  document_number?: string;
  issuing_authority?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
} 