import { supabase, Employee, Database } from './supabase';

export type CreateEmployeeData = Database['public']['Tables']['employee_table']['Insert'];
export type UpdateEmployeeData = Database['public']['Tables']['employee_table']['Update'];

class EmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  async getEmployeeByDatabaseId(databaseId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .eq('id', databaseId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching employee by database ID:', error);
      throw error;
    }
  }

  async getEmployeesByCompany(companyName: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .eq('company_name', companyName)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees by company:', error);
      throw error;
    }
  }

  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      // Calculate visa status if visa_expiry_date is provided
      const visaStatus = employeeData.visa_expiry_date
        ? this.calculateVisaStatus(employeeData.visa_expiry_date)
        : 'ACTIVE';

      const { data, error } = await supabase
        .from('employee_table')
        .insert({
          ...employeeData,
          visa_status: visaStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(employeeId: string, employeeData: UpdateEmployeeData): Promise<Employee> {
    try {
      // Calculate visa status if visa_expiry_date is being updated
      const visaStatus = employeeData.visa_expiry_date
        ? this.calculateVisaStatus(employeeData.visa_expiry_date)
        : undefined;

      // Create update payload with proper validation
      const updatePayload = {
        ...employeeData,
        updated_at: new Date().toISOString(),
        ...(visaStatus && { visa_status: visaStatus }),
      };

      console.log('🔄 Updating employee with payload:', { employeeId, updatePayload });

      const { data, error } = await supabase
        .from('employee_table')
        .update(updatePayload)
        .eq('employee_id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Employee not found or update failed');
      }

      console.log('✅ Employee updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      throw error;
    }
  }

  async updateEmployeeByDatabaseId(databaseId: string, employeeData: UpdateEmployeeData): Promise<Employee> {
    try {
      // Calculate visa status if visa_expiry_date is being updated
      const visaStatus = employeeData.visa_expiry_date
        ? this.calculateVisaStatus(employeeData.visa_expiry_date)
        : undefined;

      // Create update payload with proper validation
      const updatePayload = {
        ...employeeData,
        updated_at: new Date().toISOString(),
        ...(visaStatus && { visa_status: visaStatus }),
      };

      console.log('🔄 Updating employee by database ID with payload:', { databaseId, updatePayload });

      const { data, error } = await supabase
        .from('employee_table')
        .update(updatePayload)
        .eq('id', databaseId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Employee not found or update failed');
      }

      console.log('✅ Employee updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      throw error;
    }
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_table')
        .delete()
        .eq('employee_id', employeeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  async deleteEmployeeByDatabaseId(databaseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_table')
        .delete()
        .eq('id', databaseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee by database ID:', error);
      throw error;
    }
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .or(`name.ilike.%${query}%,employee_id.ilike.%${query}%,company_name.ilike.%${query}%,trade.ilike.%${query}%`)
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
        .from('employee_table')
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

  async bulkImportEmployees(employees: CreateEmployeeData[]): Promise<Employee[]> {
    try {
      // Process employees with visa status calculation
      const processedEmployees = employees.map(emp => ({
        ...emp,
        visa_status: this.calculateVisaStatus(emp.visa_expiry_date),
        status: emp.status || 'Active',
      }));
      const { data, error } = await supabase
        .from('employee_table')
        .insert(processedEmployees)
        .select();
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk importing employees:', error);
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
        .from('employee_table')
        .select('leave_date, visa_expiry_date');
      
      if (error) throw error;
      
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const stats = {
        total: data.length,
        active: data.filter(emp => !emp.leave_date).length, // Active if no leave_date
        inactive: data.filter(emp => emp.leave_date).length, // Inactive if has leave_date
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