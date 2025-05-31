import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Employee } from '../types/employee';

interface UseEmployeesReturn {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  refreshEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  filteredEmployees: Employee[];
  searchEmployees: (query: string) => void;
  filterByCompany: (company: string | null) => void;
  filterByStatus: (status: string | null) => void;
} 