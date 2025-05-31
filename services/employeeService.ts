import { supabase, Employee, Database } from './supabase';

export type CreateEmployeeData = Database['public']['Tables']['employees']['Insert'];
export type UpdateEmployeeData = Database['public']['Tables']['employees']['Update'];

class EmployeeService {
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
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees by company:', error);
      throw error;
    }
  }

  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      // Calculate visa status based on expiry date
      const visaStatus = this.calculateVisaStatus(employeeData.visa_expiry_date);
      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...employeeData,
          visa_status: visaStatus,
          status: employeeData.status || 'Active',
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

  async updateEmployee(id: string, employeeData: UpdateEmployeeData): Promise<Employee> {
    try {
      // Calculate visa status if visa_expiry_date is being updated
      const visaStatus = employeeData.visa_expiry_date
        ? this.calculateVisaStatus(employeeData.visa_expiry_date)
        : undefined;
      const { data, error } = await supabase
        .from('employees')
        .update({
          ...employeeData,
          ...(visaStatus && { visa_status: visaStatus }),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      // First delete related documents
      await supabase
        .from('employee_documents')
        .delete()
        .eq('employee_id', id);
      // Then delete notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', id);
      // Finally delete the employee
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

  async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%,email_id.ilike.%${searchTerm}%,trade.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });
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

  async bulkImportEmployees(employees: CreateEmployeeData[]): Promise<Employee[]> {
    try {
      // Process employees with visa status calculation
      const processedEmployees = employees.map(emp => ({
        ...emp,
        visa_status: this.calculateVisaStatus(emp.visa_expiry_date),
        status: emp.status || 'Active',
      }));
      const { data, error } = await supabase
        .from('employees')
        .insert(processedEmployees)
        .select();
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk importing employees:', error);
      throw error;
    }
  }

  private calculateVisaStatus(visaExpiryDate: string | null): string {
    if (!visaExpiryDate) return 'Active';
    const expiryDate = new Date(visaExpiryDate);
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
    if (expiryDate < currentDate) {
      return 'Expired';
    } else if (expiryDate <= thirtyDaysFromNow) {
      return 'Expiring Soon';
    } else {
      return 'Active';
    }
  }

  // Statistics and analytics
  async getEmployeeStats() {
    try {
      const [totalResult, activeResult, expiringResult, expiredResult, companiesResult] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('visa_status', 'Active'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('visa_status', 'Expiring Soon'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('visa_status', 'Expired'),
        supabase.from('employees').select('company_id', { count: 'exact' }),
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        expiring: expiringResult.count || 0,
        expired: expiredResult.count || 0,
        companiesCount: companiesResult.data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  }
}

export const employeeService = new EmployeeService(); 