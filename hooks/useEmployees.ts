import { create } from 'zustand';
import { employeeService, CreateEmployeeData, UpdateEmployeeData } from '../services/employeeService';
import { Employee } from '../services/supabase';
import { supabase } from '../services/supabase';

interface EmployeesState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  stats: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    companiesCount: number;
  };
  
  // Actions
  fetchEmployees: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  addEmployee: (employeeData: any) => Promise<Employee>;
  fetchEmployeeById: (employeeId: string) => Promise<Employee | null>;
  fetchEmployeeByDatabaseId: (databaseId: string) => Promise<Employee | null>;
  fetchEmployeesByCompany: (companyName: string) => Promise<Employee[]>;
  createEmployee: (employeeData: CreateEmployeeData) => Promise<Employee>;
  updateEmployee: (employeeId: string, employeeData: UpdateEmployeeData) => Promise<Employee>;
  updateEmployeeByDatabaseId: (databaseId: string, employeeData: UpdateEmployeeData) => Promise<Employee>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  deleteEmployeeByDatabaseId: (databaseId: string) => Promise<void>;
  searchEmployees: (searchTerm: string) => Promise<Employee[]>;
  getEmployeesWithExpiringVisas: (daysThreshold?: number) => Promise<Employee[]>;
  bulkImportEmployees: (employees: CreateEmployeeData[]) => Promise<Employee[]>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
  getEmployeeByEmail: (email: string) => Promise<Employee | null>;
}

export const useEmployees = create<EmployeesState>((set, get) => ({
  employees: [],
  isLoading: false,
  error: null,
  stats: {
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    companiesCount: 0,
  },

  fetchEmployees: async () => {
    try {
      set({ isLoading: true, error: null });
      const employees = await employeeService.getAllEmployees();
      set({ employees, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees';
      console.error('Error fetching employees:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Alias for fetchEmployees to match component expectations
  refreshEmployees: async () => {
    return get().fetchEmployees();
  },

  // Alias for createEmployee to match component expectations
  addEmployee: async (employeeData: any) => {
    return get().createEmployee(employeeData);
  },

  fetchEmployeeById: async (employeeId: string) => {
    try {
      set({ error: null });
      const employee = await employeeService.getEmployeeById(employeeId);
      return employee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employee';
      console.error('Error fetching employee:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  fetchEmployeeByDatabaseId: async (databaseId: string) => {
    try {
      set({ error: null });
      const employee = await employeeService.getEmployeeByDatabaseId(databaseId);
      return employee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employee by database ID';
      console.error('Error fetching employee by database ID:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  fetchEmployeesByCompany: async (companyName: string) => {
    try {
      set({ error: null });
      const employees = await employeeService.getEmployeesByCompany(companyName);
      return employees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees by company';
      console.error('Error fetching employees by company:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  createEmployee: async (employeeData: CreateEmployeeData) => {
    try {
      set({ isLoading: true, error: null });
      const newEmployee = await employeeService.createEmployee(employeeData);
      
      // Update local state
      const currentEmployees = get().employees;
      set({ 
        employees: [newEmployee, ...currentEmployees],
        isLoading: false 
      });
      
      // Refresh stats
      get().fetchStats();
      
      return newEmployee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create employee';
      console.error('Error creating employee:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateEmployee: async (employeeId: string, employeeData: UpdateEmployeeData) => {
    try {
      set({ isLoading: true, error: null });
      const updatedEmployee = await employeeService.updateEmployee(employeeId, employeeData);
      
      // Update local state
      const currentEmployees = get().employees;
      const updatedEmployees = currentEmployees.map(emp => 
        emp.employee_id === employeeId ? updatedEmployee : emp
      );
      set({ 
        employees: updatedEmployees,
        isLoading: false 
      });
      
      // Refresh stats
      get().fetchStats();
      
      return updatedEmployee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
      console.error('Error updating employee:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateEmployeeByDatabaseId: async (databaseId: string, employeeData: UpdateEmployeeData) => {
    try {
      set({ isLoading: true, error: null });
      const updatedEmployee = await employeeService.updateEmployeeByDatabaseId(databaseId, employeeData);
      
      // Update local state
      const currentEmployees = get().employees;
      const updatedEmployees = currentEmployees.map(emp => 
        emp.id === databaseId ? updatedEmployee : emp
      );
      set({ 
        employees: updatedEmployees,
        isLoading: false 
      });
      
      // Refresh stats
      get().fetchStats();
      
      return updatedEmployee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee by database ID';
      console.error('Error updating employee by database ID:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteEmployee: async (employeeId: string) => {
    try {
      set({ isLoading: true, error: null });
      await employeeService.deleteEmployee(employeeId);
      
      // Update local state
      const currentEmployees = get().employees;
      const filteredEmployees = currentEmployees.filter(emp => emp.employee_id !== employeeId);
      set({ 
        employees: filteredEmployees,
        isLoading: false 
      });
      
      // Refresh stats
      get().fetchStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete employee';
      console.error('Error deleting employee:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteEmployeeByDatabaseId: async (databaseId: string) => {
    try {
      set({ isLoading: true, error: null });
      await employeeService.deleteEmployeeByDatabaseId(databaseId);
      
      // Update local state
      const currentEmployees = get().employees;
      const filteredEmployees = currentEmployees.filter(emp => emp.id !== databaseId);
      set({ 
        employees: filteredEmployees,
        isLoading: false 
      });
      
      // Refresh stats
      get().fetchStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete employee by database ID';
      console.error('Error deleting employee by database ID:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  searchEmployees: async (searchTerm: string) => {
    try {
      set({ error: null });
      const employees = await employeeService.searchEmployees(searchTerm);
      return employees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search employees';
      console.error('Error searching employees:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  getEmployeesWithExpiringVisas: async (daysThreshold: number = 30) => {
    try {
      set({ error: null });
      const employees = await employeeService.getEmployeesWithExpiringVisas(daysThreshold);
      return employees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees with expiring visas';
      console.error('Error fetching employees with expiring visas:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  bulkImportEmployees: async (employees: CreateEmployeeData[]) => {
    try {
      set({ isLoading: true, error: null });
      const importedEmployees = await employeeService.bulkImportEmployees(employees);
      
      // Refresh the entire employee list
      await get().fetchEmployees();
      
      // Refresh stats
      get().fetchStats();
      
      return importedEmployees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import employees';
      console.error('Error importing employees:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const stats = await employeeService.getEmployeeStats();
      // Map the service stats to the expected interface
      const mappedStats = {
        total: stats.total,
        active: stats.active,
        expiring: stats.visaExpiring,
        expired: stats.visaExpired,
        companiesCount: 0, // We'll need to calculate this separately if needed
      };
      set({ stats: mappedStats });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      // Don't throw here as stats are not critical
    }
  },

  clearError: () => {
    set({ error: null });
  },

  getEmployeeByEmail: async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email_id', email)
        .single();

      if (error) {
        console.error('Error fetching employee by email:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getEmployeeByEmail:', error);
      return null;
    }
  },
})); 