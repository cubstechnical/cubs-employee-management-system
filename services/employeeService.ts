import { supabase, Employee, Database } from './supabase';

export type CreateEmployeeData = Database['public']['Tables']['employees']['Insert'];
export type UpdateEmployeeData = Database['public']['Tables']['employees']['Update'];

export class EmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  async getEmployeesByCompany(companyId: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees by company:', error);
      throw error;
    }
  }

  async getEmployeesByTrade(trade: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('trade', trade)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees by trade:', error);
      throw error;
    }
  }

  async getEmployeesByCompanyName(companyName: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_name', companyName)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees by company name:', error);
      throw error;
    }
  }

  async getUniqueTrades(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('trade')
        .not('trade', 'is', null)
        .not('trade', 'eq', '');
      
      if (error) throw error;
      
      const uniqueTrades = [...new Set(data.map(item => item.trade))].filter(Boolean).sort();
      return uniqueTrades;
    } catch (error) {
      console.error('Error fetching unique trades:', error);
      return [];
    }
  }

  async getUniqueCompanies(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('company_name')
        .not('company_name', 'is', null)
        .not('company_name', 'eq', '');
      
      if (error) throw error;
      
      const uniqueCompanies = [...new Set(data.map(item => item.company_name))].filter(Boolean).sort();
      return uniqueCompanies;
    } catch (error) {
      console.error('Error fetching unique companies:', error);
      return [];
    }
  }

  async getFilteredEmployees(filters: {
    trade?: string;
    companyName?: string;
    isActive?: boolean;
    visaStatus?: string;
    searchQuery?: string;
  }): Promise<Employee[]> {
    try {
      let query = supabase
        .from('employees')
        .select('*');

      if (filters.trade) {
        query = query.eq('trade', filters.trade);
      }
      
      if (filters.companyName) {
        query = query.eq('company_name', filters.companyName);
      }
      
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      
      if (filters.visaStatus) {
        query = query.eq('visa_status', filters.visaStatus);
      }
      
      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,employee_id.ilike.%${filters.searchQuery}%,email_id.ilike.%${filters.searchQuery}%`);
      }
      
      query = query.order('name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering employees:', error);
      throw error;
    }
  }

  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      console.log('🚀 Creating employee with data:', employeeData);
      
      // Validate required fields
      if (!employeeData.name || !employeeData.email_id) {
        throw new Error('Name and email are required fields');
      }

      // Calculate visa status if visa_expiry_date is provided
      const visaStatus = employeeData.visa_expiry_date
        ? this.calculateVisaStatus(employeeData.visa_expiry_date)
        : 'ACTIVE';

      // Prepare the data for insertion
      const insertData = {
        ...employeeData,
        visa_status: visaStatus,
        is_active: employeeData.is_active ?? true,
        status: employeeData.status || 'Active',
        // Remove created_at and updated_at since columns don't exist in the database
        // created_at: new Date().toISOString(),
        // updated_at: new Date().toISOString(),
      };

      console.log('📝 Inserting employee data:', insertData);

      const { data, error } = await supabase
        .from('employees')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from employee creation');
      }

      console.log('✅ Employee created successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: string, employeeData: UpdateEmployeeData): Promise<Employee> {
    try {
      console.log('🔄 Updating employee with data:', { id, employeeData });
      
      // Validate ID
      if (!id) {
        throw new Error('Employee ID is required for update');
      }

      // First, get the current employee data to see what we're working with
      const { data: currentEmployee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current employee:', fetchError);
        throw new Error(`Employee not found: ${fetchError.message}`);
      }

      if (!currentEmployee) {
        throw new Error('Employee not found');
      }

      console.log('📋 Current employee data:', currentEmployee);

      // Check for duplicate employee_id or email_id (excluding current employee)
      if (employeeData.employee_id && employeeData.employee_id !== currentEmployee.employee_id) {
        const { data: existingByEmployeeId } = await supabase
          .from('employees')
          .select('id, employee_id')
          .eq('employee_id', employeeData.employee_id)
          .neq('id', id)
          .maybeSingle();

        if (existingByEmployeeId) {
          throw new Error(`Employee ID "${employeeData.employee_id}" already exists for another employee`);
        }
      }

      if (employeeData.email_id && employeeData.email_id !== currentEmployee.email_id) {
        const { data: existingByEmail } = await supabase
          .from('employees')
          .select('id, email_id')
          .eq('email_id', employeeData.email_id)
          .neq('id', id)
          .maybeSingle();

        if (existingByEmail) {
          throw new Error(`Email "${employeeData.email_id}" already exists for another employee`);
        }
      }

      // Calculate visa status if visa_expiry_date is being updated
      const visaStatus = employeeData.visa_expiry_date
        ? this.calculateVisaStatus(employeeData.visa_expiry_date)
        : undefined;

      // Create clean update payload - only include fields that are actually changing
      const updatePayload: Record<string, any> = {};

      // Helper function to add field if it's different
      const addFieldIfChanged = (fieldName: string, newValue: any, currentValue: any) => {
        if (newValue !== undefined && newValue !== currentValue) {
          updatePayload[fieldName] = newValue;
          console.log(`📝 Will update ${fieldName}:`, currentValue, '->', newValue);
        }
      };

      // Required string fields
      addFieldIfChanged('name', employeeData.name, currentEmployee.name);
      addFieldIfChanged('employee_id', employeeData.employee_id, currentEmployee.employee_id);
      addFieldIfChanged('trade', employeeData.trade, currentEmployee.trade);
      addFieldIfChanged('nationality', employeeData.nationality, currentEmployee.nationality);
      addFieldIfChanged('email_id', employeeData.email_id, currentEmployee.email_id);
      addFieldIfChanged('company_name', employeeData.company_name, currentEmployee.company_name);
      addFieldIfChanged('mobile_number', employeeData.mobile_number, currentEmployee.mobile_number);
      addFieldIfChanged('status', employeeData.status, currentEmployee.status);
      addFieldIfChanged('is_active', employeeData.is_active, currentEmployee.is_active);
      
      // Date fields
      addFieldIfChanged('date_of_birth', employeeData.date_of_birth, currentEmployee.date_of_birth);
      addFieldIfChanged('join_date', employeeData.join_date, currentEmployee.join_date);
      addFieldIfChanged('visa_expiry_date', employeeData.visa_expiry_date, currentEmployee.visa_expiry_date);
      
      // Optional nullable string fields
      addFieldIfChanged('home_phone_number', employeeData.home_phone_number, currentEmployee.home_phone_number);
      addFieldIfChanged('passport_number', employeeData.passport_number, currentEmployee.passport_number);

      // Add visa status if calculated and different
      if (visaStatus && visaStatus !== currentEmployee.visa_status) {
        updatePayload.visa_status = visaStatus;
        console.log('📝 Will update visa_status:', currentEmployee.visa_status, '->', visaStatus);
      }

      console.log('📝 Final update payload:', updatePayload);

      // If no fields to update, just return current employee
      if (Object.keys(updatePayload).length === 0) {
        console.log('⏸️ No fields to update, returning current employee');
        return currentEmployee;
      }

      // Perform the update using the employee's actual database ID
      const { data, error } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw new Error(`Update failed: ${error.message}${error.details ? ` - ${error.details}` : ''}`);
      }

      if (!data) {
        throw new Error('Update operation returned no data - employee may not exist');
      }

      console.log('✅ Employee updated successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Error updating employee:', error);
      if (error instanceof Error) {
        throw error; // Re-throw the error with its original message
      }
      throw new Error('Failed to update employee: Unknown error occurred');
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(`name.ilike.%${query}%,employee_id.ilike.%${query}%,email_id.ilike.%${query}%`)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  async getEmployeesWithExpiringVisas(daysThreshold: number = 30): Promise<Employee[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .not('visa_expiry_date', 'is', null)
        .lte('visa_expiry_date', thresholdDate.toISOString())
        .order('visa_expiry_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees with expiring visas:', error);
      throw error;
    }
  }

  async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    visaExpiring: number;
    visaExpired: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('is_active, visa_expiry_date');
      
      if (error) throw error;
      
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const stats = {
        total: data.length,
        active: data.filter(emp => emp.is_active).length,
        inactive: data.filter(emp => !emp.is_active).length,
        visaExpiring: 0,
        visaExpired: 0,
      };
      
      data.forEach(emp => {
        if (emp.visa_expiry_date) {
          const expiryDate = new Date(emp.visa_expiry_date);
          if (expiryDate < now) {
            stats.visaExpired++;
          } else if (expiryDate <= thirtyDaysFromNow) {
            stats.visaExpiring++;
          }
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  }

  private calculateVisaStatus(expiryDate: string): string {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= 30) return 'EXPIRING';
    return 'ACTIVE';
  }
}

export const employeeService = new EmployeeService(); 