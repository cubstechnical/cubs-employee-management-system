import { Employee } from '../services/supabase';
import { employeeService, CreateEmployeeData } from '../services/employeeService';
import { COMPANIES } from './constants';

interface ImportedEmployee {
  'employee_id': string;
  'name': string;
  'trade': string;
  'nationality': string;
  'date_of_birth': string;
  'mobile_number': string;
  'home_phone_number'?: string;
  'email_id': string;
  'company_id': string;
  'company_name': string;
  'join_date': string;
  'visa_expiry_date': string;
  'passport_number': string;
}

// Date format conversion functions
const parseDDMMYYYY = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('-');
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const [day, month, year] = dateStr.split('-');
  if (!day || !month || !year) return false;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.getFullYear() == parseInt(year) &&
         date.getMonth() == parseInt(month) - 1 &&
         date.getDate() == parseInt(day);
};

export const importEmployees = async (csvData: ImportedEmployee[]): Promise<void> => {
  console.log('📊 Starting employee import process...');
  
  try {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        // Transform imported data to match CreateEmployeeData interface
        const employeeData: CreateEmployeeData = {
          employee_id: row.employee_id,
          name: row.name,
          trade: row.trade,
          nationality: row.nationality,
          date_of_birth: parseDDMMYYYY(row.date_of_birth) || row.date_of_birth,
          mobile_number: row.mobile_number,
          home_phone_number: row.home_phone_number || null,
          email_id: row.email_id,
          company_id: row.company_id,
          company_name: row.company_name,
          join_date: parseDDMMYYYY(row.join_date) || row.join_date,
          visa_expiry_date: parseDDMMYYYY(row.visa_expiry_date) || row.visa_expiry_date,
          visa_status: 'ACTIVE', // Will be calculated by the service based on expiry date
          passport_number: row.passport_number || '',
          status: 'Active',
          is_active: true,
        };

        console.log(`📋 Importing employee ${i + 1}/${csvData.length}:`, employeeData.name);

        // Use the employee service to create the employee
        await employeeService.createEmployee(employeeData);
        successCount++;

      } catch (error) {
        errorCount++;
        const errorMsg = `Row ${i + 1} (${row.name}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌ Import error:', errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`✅ Import completed: ${successCount} successful, ${errorCount} errors`);
    
    if (errorCount > 0) {
      console.warn('⚠️ Import completed with errors:', errors);
      throw new Error(`Import completed with ${errorCount} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`);
    }

    console.log(`🎉 Successfully imported ${successCount} employees`);
  } catch (error) {
    console.error('💥 Error importing employees:', error);
    throw error;
  }
};

export const validateEmployeeData = (data: any[]): ImportedEmployee[] => {
  console.log('🔍 Validating employee data...');
  
  const requiredFields = [
    'employee_id',
    'name',
    'trade',
    'nationality',
    'date_of_birth',
    'mobile_number',
    'email_id',
    'company_id',
    'company_name',
    'join_date',
    'visa_expiry_date',
    'passport_number'
  ];

  // Filter out empty rows
  const validRows = data.filter(row => row && Object.keys(row).length > 0);

  if (validRows.length === 0) {
    throw new Error('No valid data rows found in CSV file');
  }

  console.log(`📊 Found ${validRows.length} data rows to validate`);

  // Validate each row
  validRows.forEach((row, index) => {
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        throw new Error(`Missing required field "${field}" in row ${index + 1}`);
      }
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email_id)) {
      throw new Error(`Invalid email format "${row.email_id}" in row ${index + 1}`);
    }

    // Validate date formats (DD-MM-YYYY)
    const dateFields = ['date_of_birth', 'join_date', 'visa_expiry_date'];
    dateFields.forEach(field => {
      if (row[field] && !isValidDate(row[field])) {
        throw new Error(`Invalid date format for "${field}" in row ${index + 1}. Expected DD-MM-YYYY format.`);
      }
    });

    // Validate employee_id uniqueness (basic check)
    const duplicateId = validRows.find((otherRow, otherIndex) => 
      otherIndex !== index && otherRow.employee_id === row.employee_id
    );
    if (duplicateId) {
      throw new Error(`Duplicate employee_id "${row.employee_id}" found in row ${index + 1}`);
    }
  });

  console.log('✅ Data validation completed successfully');
  return validRows as ImportedEmployee[];
}; 