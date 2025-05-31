import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee } from '../services/supabase';
import { COMPANIES } from './constants';

export interface ImportedEmployee {
  ID: string;
  'EMPLOYEE ID': string;
  NAME: string;
  TRADE: string;
  NATIONALITY: string;
  'JOINING DATE': string;
  'DATE OF BIRTH': string;
  'MOBILE NUMBER': string;
  'HOME PHONE NUMBER': string;
  'EMAIL ID': string;
  'COMPANY ID': string;
  'COMPANY NAME': string;
}

export const importEmployees = async (csvData: ImportedEmployee[]): Promise<void> => {
  try {
    // Transform imported data to match our Employee interface
    const employees: Employee[] = csvData.map((row) => {
      const company_id = row['COMPANY ID']; // Keep as string to match interface
      const company_name = row['COMPANY NAME'];
      if (!company_name || !company_id) {
        throw new Error(`Invalid company data: ${company_id}, ${company_name}`);
      }
      return {
        id: row.ID,
        employee_id: row['EMPLOYEE ID'],
        name: row.NAME,
        trade: row.TRADE,
        nationality: row.NATIONALITY,
        join_date: row['JOINING DATE'], // Changed from joining_date
        date_of_birth: row['DATE OF BIRTH'],
        mobile_number: row['MOBILE NUMBER'],
        home_phone_number: row['HOME PHONE NUMBER'],
        email_id: row['EMAIL ID'], // Changed from email
        company_id,
        company_name,
        visa_expiry_date: '', // Changed from visa_expiry and made required
        passport_number: '',
        visa_status: 'Active',
        status: 'Active', // Added required field
        is_active: true,
      };
    });

    // Store the transformed data in AsyncStorage
    await AsyncStorage.setItem('employees', JSON.stringify(employees));

    // Create indices for quick lookups
    const employeesByCompany = employees.reduce((acc, employee) => {
      const company_id = employee.company_id;
      if (!acc[company_id]) {
        acc[company_id] = [];
      }
      acc[company_id].push(employee.id);
      return acc;
    }, {} as Record<string, string[]>); // Changed from number to string

    await AsyncStorage.setItem('employeesByCompany', JSON.stringify(employeesByCompany));

    console.log(`Successfully imported ${employees.length} employees`);
  } catch (error) {
    console.error('Error importing employees:', error);
    throw error;
  }
};

export const validateEmployeeData = (data: any[]): ImportedEmployee[] => {
  const requiredFields = [
    'ID',
    'EMPLOYEE ID',
    'NAME',
    'TRADE',
    'NATIONALITY',
    'JOINING DATE',
    'DATE OF BIRTH',
    'MOBILE NUMBER',
    'HOME PHONE NUMBER',
    'EMAIL ID',
    'COMPANY ID',
    'COMPANY NAME'
  ];

  // Validate each row
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field]) {
        throw new Error(`Missing required field "${field}" in row ${index + 1}`);
      }
    });

    // Validate company ID
    const company_id = row['COMPANY ID'];
    if (!company_id || !COMPANIES.some(c => c.id.toString() === company_id)) {
      throw new Error(`Invalid company ID "${row['COMPANY ID']}" in row ${index + 1}`);
    }

    // Validate date formats
    const dateFields = ['JOINING DATE', 'DATE OF BIRTH'];
    dateFields.forEach(field => {
      if (!isValidDate(row[field])) {
        throw new Error(`Invalid date format for "${field}" in row ${index + 1}`);
      }
    });
  });

  return data as ImportedEmployee[];
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}; 