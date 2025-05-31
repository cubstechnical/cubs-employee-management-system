// DEPRECATED: All employee CRUD must use Supabase-backed services/hooks. Do not use AsyncStorage for employee data.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee } from '../services/supabase';

export const updateEmployee = async (updatedEmployee: Employee): Promise<void> => {
  try {
    // Get current employees
    const employeesJson = await AsyncStorage.getItem('employees');
    if (!employeesJson) throw new Error('No employees found');
    
    const employees: Employee[] = JSON.parse(employeesJson);
    
    // Find and update the employee
    const index = employees.findIndex(emp => emp.id === updatedEmployee.id);
    if (index === -1) throw new Error('Employee not found');
    
    employees[index] = updatedEmployee;
    
    // Update storage
    await AsyncStorage.setItem('employees', JSON.stringify(employees));
    
    // Update company indices
    const employeesByCompanyJson = await AsyncStorage.getItem('employeesByCompany');
    const employeesByCompany: Record<string, string[]> = employeesByCompanyJson ? 
      JSON.parse(employeesByCompanyJson) : {};
    
    // Remove from old company if company changed
    const oldCompanyId = employees[index].company_id;
    if (oldCompanyId !== updatedEmployee.company_id) {
      employeesByCompany[oldCompanyId] = employeesByCompany[oldCompanyId]?.filter(
        (id: string) => id !== updatedEmployee.id
      ) || [];
      
      // Add to new company
      if (!employeesByCompany[updatedEmployee.company_id]) {
        employeesByCompany[updatedEmployee.company_id] = [];
      }
      employeesByCompany[updatedEmployee.company_id].push(updatedEmployee.id);
      
      await AsyncStorage.setItem('employeesByCompany', JSON.stringify(employeesByCompany));
    }
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  try {
    // Get current employees
    const employeesJson = await AsyncStorage.getItem('employees');
    if (!employeesJson) throw new Error('No employees found');
    
    const employees: Employee[] = JSON.parse(employeesJson);
    
    // Find employee to delete
    const employeeToDelete = employees.find(emp => emp.id === employeeId);
    if (!employeeToDelete) throw new Error('Employee not found');
    
    // Remove employee
    const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
    await AsyncStorage.setItem('employees', JSON.stringify(updatedEmployees));
    
    // Update company indices
    const employeesByCompanyJson = await AsyncStorage.getItem('employeesByCompany');
    if (employeesByCompanyJson) {
      const employeesByCompany: Record<string, string[]> = JSON.parse(employeesByCompanyJson);
      employeesByCompany[employeeToDelete.company_id] = employeesByCompany[employeeToDelete.company_id]
        ?.filter((id: string) => id !== employeeId) || [];
      await AsyncStorage.setItem('employeesByCompany', JSON.stringify(employeesByCompany));
    }
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
}; 