import React from 'react';
import { Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface WebDatePickerProps {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'compact';
  onChange: (event: any, selectedDate?: Date) => void;
  label?: string;
  style?: any;
}

export default function WebDatePicker({ 
  value, 
  mode = 'date', 
  display, 
  onChange, 
  label,
  style 
}: WebDatePickerProps) {
  if (Platform.OS === 'web') {
    // Web implementation using HTML5 date input
    const formatDateForInput = (date: Date) => {
      if (mode === 'date') {
        return date.toISOString().split('T')[0];
      } else if (mode === 'time') {
        return date.toTimeString().split(' ')[0].substring(0, 5);
      } else {
        return date.toISOString().substring(0, 16);
      }
    };

    const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      if (!text) return;
      
      let selectedDate: Date;
      if (mode === 'date') {
        selectedDate = new Date(text + 'T00:00:00');
      } else if (mode === 'time') {
        selectedDate = new Date(`1970-01-01T${text}:00`);
      } else {
        selectedDate = new Date(text);
      }
      
      onChange({ type: 'set', nativeEvent: { timestamp: selectedDate.getTime() } }, selectedDate);
    };

    return (
      <div style={{ marginBottom: 12 }}>
        <input
          type={mode === 'date' ? 'date' : mode === 'time' ? 'time' : 'datetime-local'}
          value={formatDateForInput(value)}
          onChange={handleWebDateChange}
          style={{
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            width: '100%',
            backgroundColor: 'white',
            fontFamily: 'inherit',
            ...style,
          }}
        />
      </div>
    );
  }

  // Native implementation
  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display={display}
      onChange={onChange}
    />
  );
} 