import React from 'react';
import { Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface WebDatePickerProps {
  value: string | Date;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'compact';
  onDateChange: (dateString: string) => void;
  label?: string;
  style?: any;
  error?: boolean;
}

export default function WebDatePicker({ 
  value, 
  mode = 'date', 
  display, 
  onDateChange, 
  label,
  style,
  error
}: WebDatePickerProps) {
  
  // Safe date conversion function
  const safeToDate = (input: string | Date): Date => {
    if (!input) return new Date();
    
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? new Date() : input;
    }
    
    if (typeof input === 'string') {
      // Handle DD-MM-YYYY format
      if (input.includes('-') && input.length === 10) {
        const [day, month, year] = input.split('-');
        if (day && month && year) {
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return isNaN(date.getTime()) ? new Date() : date;
        }
      }
      
      // Handle other formats
      const date = new Date(input);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    return new Date();
  };

  // Safe date formatting function
  const formatDateForInput = (input: string | Date) => {
    try {
      const date = safeToDate(input);
      
      if (mode === 'date') {
        return date.toISOString().split('T')[0];
      } else if (mode === 'time') {
        return date.toTimeString().split(' ')[0].substring(0, 5);
      } else {
        return date.toISOString().substring(0, 16);
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '';
    }
  };

  // Format date to DD-MM-YYYY for output
  const formatDateDDMMYYYY = (date: Date): string => {
    try {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '';
    }
  };

  if (Platform.OS === 'web') {
    const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      if (!text) {
        onDateChange('');
        return;
      }
      
      try {
        let selectedDate: Date;
        if (mode === 'date') {
          selectedDate = new Date(text + 'T00:00:00');
        } else if (mode === 'time') {
          selectedDate = new Date(`1970-01-01T${text}:00`);
        } else {
          selectedDate = new Date(text);
        }
        
        if (!isNaN(selectedDate.getTime())) {
          const formattedDate = formatDateDDMMYYYY(selectedDate);
          onDateChange(formattedDate);
        }
      } catch (error) {
        console.warn('Date change error:', error);
      }
    };

    return (
      <div style={{ marginBottom: 12 }}>
        <input
          type={mode === 'date' ? 'date' : mode === 'time' ? 'time' : 'datetime-local'}
          value={formatDateForInput(value)}
          onChange={handleWebDateChange}
          style={{
            padding: '12px',
            border: error ? '2px solid #f44336' : '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            width: '100%',
            backgroundColor: 'white',
            fontFamily: 'inherit',
            outline: 'none',
            ...style,
          }}
          placeholder={mode === 'date' ? 'DD-MM-YYYY' : undefined}
        />
      </div>
    );
  }

  // Native implementation
  const dateValue = safeToDate(value);
  
  const handleNativeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      const formattedDate = formatDateDDMMYYYY(selectedDate);
      onDateChange(formattedDate);
    }
  };

  return (
    <DateTimePicker
      value={dateValue}
      mode={mode}
      display={display}
      onChange={handleNativeChange}
    />
  );
} 