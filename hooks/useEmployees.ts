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
    inactive: number;
    visaExpiring: number;
    visaExpired: number;
    companiesCount: number;
  };
  
  // NEW: Filter data
  availableTrades: string[];
  availableCompanies: string[];
  
  // Actions
  fetchEmployees: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  addEmployee: (employeeData: any) => Promise<Employee>;
  fetchEmployeeById: (id: string) => Promise<Employee | null>;
  fetchEmployeesByCompany: (companyId: string) => Promise<Employee[]>;
  createEmployee: (employeeData: CreateEmployeeData) => Promise<Employee>;
  updateEmployee: (id: string, employeeData: UpdateEmployeeData) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  searchEmployees: (searchTerm: string) => Promise<Employee[]>;
  getEmployeesWithExpiringVisas: (daysThreshold?: number) => Promise<Employee[]>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
  getEmployeeByEmail: (email: string) => Promise<Employee | null>;
  
  // NEW: Filter methods
  fetchEmployeesByTrade: (trade: string) => Promise<Employee[]>;
  fetchEmployeesByCompanyName: (companyName: string) => Promise<Employee[]>;
  fetchFilteredEmployees: (filters: {
    trade?: string;
    companyName?: string;
    isActive?: boolean;
    visaStatus?: string;
    searchQuery?: string;
  }) => Promise<Employee[]>;
  loadFilterOptions: () => Promise<void>;
}

export const useEmployees = create<EmployeesState>((set, get) => ({
  employees: [],
  isLoading: false,
  error: null,
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    visaExpiring: 0,
    visaExpired: 0,
    companiesCount: 0,
  },
  availableTrades: [],
  availableCompanies: [],

  fetchEmployees: async () => {
    set({ isLoading: true, error: null });
    try {
      const employees = await employeeService.getAllEmployees();
      set({ employees, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch employees',
        isLoading: false 
      });
    }
  },

  refreshEmployees: async () => {
    const { fetchEmployees, fetchStats, loadFilterOptions } = get();
    await Promise.all([
      fetchEmployees(),
      fetchStats(),
      loadFilterOptions()
    ]);
  },

  addEmployee: async (employeeData: any) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🎯 Hook: Adding employee with data:', employeeData);
      
      // Validate required fields
      if (!employeeData.name || !employeeData.email_id) {
        throw new Error('Name and email are required fields');
      }

      // Check for duplicate employee ID or email
      const { employees } = get();
      const duplicateId = employees.find(emp => emp.employee_id === employeeData.employee_id);
      const duplicateEmail = employees.find(emp => emp.email_id === employeeData.email_id);
      
      if (duplicateId) {
        throw new Error(`Employee ID "${employeeData.employee_id}" already exists`);
      }
      
      if (duplicateEmail) {
        throw new Error(`Email "${employeeData.email_id}" already exists`);
      }

      const newEmployee = await employeeService.createEmployee(employeeData);
      
      set(state => ({ 
        employees: [newEmployee, ...state.employees],
        isLoading: false 
      }));
      
      // Refresh stats and filter options
      get().fetchStats();
      get().loadFilterOptions();
      
      console.log('✅ Hook: Employee added successfully');
      return newEmployee;
    } catch (error) {
      console.error('❌ Hook: Error adding employee:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add employee',
        isLoading: false 
      });
      throw error;
    }
  },

  fetchEmployeeById: async (id: string) => {
    try {
      return await employeeService.getEmployeeById(id);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch employee' });
      return null;
    }
  },

  fetchEmployeesByCompany: async (companyId: string) => {
    try {
      return await employeeService.getEmployeesByCompany(companyId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch employees' });
      return [];
    }
  },

  createEmployee: async (employeeData: CreateEmployeeData) => {
    set({ isLoading: true, error: null });
    try {
      const newEmployee = await employeeService.createEmployee(employeeData);
      set(state => ({ 
        employees: [newEmployee, ...state.employees],
        isLoading: false 
      }));
      
      // Refresh stats and filter options
      get().fetchStats();
      get().loadFilterOptions();
      
      return newEmployee;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create employee',
        isLoading: false 
      });
      throw error;
    }
  },

  updateEmployee: async (id: string, employeeData: UpdateEmployeeData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🎯 Hook: Updating employee:', { id, employeeData });
      
      // Validate ID
      if (!id) {
        throw new Error('Employee ID is required for update');
      }

      // Check if employee exists in current state
      const { employees } = get();
      const existingEmployee = employees.find(emp => emp.id === id);
      if (!existingEmployee) {
        throw new Error('Employee not found in current data');
      }

      // Check for duplicate employee ID or email (excluding current employee)
      if (employeeData.employee_id) {
        const duplicateId = employees.find(emp => emp.id !== id && emp.employee_id === employeeData.employee_id);
        if (duplicateId) {
          throw new Error(`Employee ID "${employeeData.employee_id}" already exists`);
        }
      }
      
      if (employeeData.email_id) {
        const duplicateEmail = employees.find(emp => emp.id !== id && emp.email_id === employeeData.email_id);
        if (duplicateEmail) {
          throw new Error(`Email "${employeeData.email_id}" already exists`);
        }
      }

      const updatedEmployee = await employeeService.updateEmployee(id, employeeData);
      
      set(state => ({
        employees: state.employees.map(emp => 
          emp.id === id ? updatedEmployee : emp
        ),
        isLoading: false
      }));
      
      // Refresh stats and filter options in case trade/company changed
      get().fetchStats();
      get().loadFilterOptions();
      
      console.log('✅ Hook: Employee updated successfully');
      return updatedEmployee;
    } catch (error) {
      console.error('❌ Hook: Error updating employee:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update employee',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.deleteEmployee(id);
      set(state => ({
        employees: state.employees.filter(emp => emp.id !== id),
        isLoading: false
      }));
      
      // Refresh stats and filter options
      get().fetchStats();
      get().loadFilterOptions();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete employee',
        isLoading: false 
      });
      throw error;
    }
  },

  searchEmployees: async (searchTerm: string) => {
    try {
      return await employeeService.searchEmployees(searchTerm);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to search employees' });
      return [];
    }
  },

  getEmployeesWithExpiringVisas: async (daysThreshold = 30) => {
    try {
      return await employeeService.getEmployeesWithExpiringVisas(daysThreshold);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch expiring visas' });
      return [];
    }
  },

  fetchStats: async () => {
    try {
      const stats = await employeeService.getEmployeeStats();
      
      // Calculate companies count from current employees
      const { employees } = get();
      const companiesCount = new Set(employees.map(emp => emp.company_name)).size;
      
      set({ 
        stats: {
          ...stats,
          companiesCount
        }
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch stats' });
    }
  },

  clearError: () => set({ error: null }),

  getEmployeeByEmail: async (email: string) => {
    try {
      const { employees } = get();
      return employees.find(emp => emp.email_id === email) || null;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to find employee' });
      return null;
    }
  },

  // NEW: Filter methods
  fetchEmployeesByTrade: async (trade: string) => {
    try {
      return await employeeService.getEmployeesByTrade(trade);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch employees by trade' });
      return [];
    }
  },

  fetchEmployeesByCompanyName: async (companyName: string) => {
    try {
      return await employeeService.getEmployeesByCompanyName(companyName);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch employees by company' });
      return [];
    }
  },

  fetchFilteredEmployees: async (filters) => {
    try {
      return await employeeService.getFilteredEmployees(filters);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to filter employees' });
      return [];
    }
  },

  loadFilterOptions: async () => {
    try {
      const [trades, companies] = await Promise.all([
        employeeService.getUniqueTrades(),
        employeeService.getUniqueCompanies()
      ]);
      
      set({ 
        availableTrades: trades,
        availableCompanies: companies 
      });
    } catch (error) {
      console.error('Error loading filter options:', error);
      set({ error: 'Failed to load filter options' });
    }
  },
})); 