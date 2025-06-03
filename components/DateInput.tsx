import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, Surface } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';

interface DateInputProps {
  label: string;
  value: string; // DD-MM-YYYY format
  onDateChange: (dateString: string) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  minimumDate?: string;
  maximumDate?: string;
}

export default function DateInput({
  label,
  value,
  onDateChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
  minimumDate,
  maximumDate,
}: DateInputProps) {
  const theme = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Convert DD-MM-YYYY to YYYY-MM-DD for calendar
  const convertToCalendarFormat = (ddmmyyyy: string): string => {
    if (!ddmmyyyy || ddmmyyyy.length !== 10) return '';
    const parts = ddmmyyyy.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Convert YYYY-MM-DD to DD-MM-YYYY for display
  const convertFromCalendarFormat = (yyyymmdd: string): string => {
    if (!yyyymmdd || yyyymmdd.length !== 10) return '';
    const parts = yyyymmdd.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
    return '';
  };

  // Validate and format input as user types
  const handleInputChange = (text: string) => {
    // Remove all non-numeric characters
    const numeric = text.replace(/[^0-9]/g, '');
    
    // Format as DD-MM-YYYY
    let formatted = numeric;
    if (numeric.length >= 2) {
      formatted = numeric.slice(0, 2);
      if (numeric.length >= 4) {
        formatted += '-' + numeric.slice(2, 4);
        if (numeric.length >= 8) {
          formatted += '-' + numeric.slice(4, 8);
        } else if (numeric.length > 4) {
          formatted += '-' + numeric.slice(4);
        }
      } else if (numeric.length > 2) {
        formatted += '-' + numeric.slice(2);
      }
    }

    // Limit to DD-MM-YYYY format (10 characters)
    if (formatted.length <= 10) {
      setInputValue(formatted);
      
      // If we have a complete date, validate and callback
      if (formatted.length === 10 && isValidDate(formatted)) {
        onDateChange(formatted);
      }
    }
  };

  // Validate date format and values
  const isValidDate = (dateString: string): boolean => {
    if (dateString.length !== 10) return false;
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Basic validation
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    
    // Create date object to check if it's valid
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  const handleCalendarSelect = (day: DateData) => {
    const formatted = convertFromCalendarFormat(day.dateString);
    setInputValue(formatted);
    onDateChange(formatted);
    setShowCalendar(false);
  };

  const currentDate = convertToCalendarFormat(inputValue);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          label={`${label}${required ? ' *' : ''}`}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder="DD-MM-YYYY"
          keyboardType="numeric"
          error={error || (inputValue.length === 10 && !isValidDate(inputValue))}
          disabled={disabled}
          style={[styles.textInput, { flex: 1 }]}
          mode="outlined"
          left={<TextInput.Icon icon="calendar" />}
          right={
            <TextInput.Icon 
              icon="calendar-month" 
              onPress={() => !disabled && setShowCalendar(!showCalendar)}
            />
          }
          theme={{ colors: { primary: theme.colors.primary } }}
        />
      </View>

      {helperText && (
        <Text 
          variant="bodySmall" 
          style={[
            styles.helperText, 
            { color: error ? theme.colors.error : theme.colors.onSurfaceVariant }
          ]}
        >
          {helperText}
        </Text>
      )}

      {inputValue.length === 10 && !isValidDate(inputValue) && (
        <Text variant="bodySmall" style={[styles.helperText, { color: theme.colors.error }]}>
          Please enter a valid date
        </Text>
      )}

      {showCalendar && (
        <Surface style={[styles.calendarContainer, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <View style={styles.calendarHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Select {label}
            </Text>
            <Button onPress={() => setShowCalendar(false)} mode="text">
              Close
            </Button>
          </View>
          
          <Calendar
            current={currentDate || undefined}
            onDayPress={handleCalendarSelect}
            markedDates={currentDate ? {
              [currentDate]: {
                selected: true,
                selectedColor: theme.colors.primary,
              }
            } : {}}
            theme={{
              backgroundColor: theme.colors.surface,
              calendarBackground: theme.colors.surface,
              textSectionTitleColor: theme.colors.onSurface,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.onPrimary,
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.onSurface,
              textDisabledColor: theme.colors.onSurfaceVariant,
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.onSurface,
              indicatorColor: theme.colors.primary,
            }}
            minDate={minimumDate ? convertToCalendarFormat(minimumDate) : undefined}
            maxDate={maximumDate ? convertToCalendarFormat(maximumDate) : undefined}
          />
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    marginRight: 8,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 16,
  },
  calendarContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        maxWidth: 400,
      },
      default: {
        marginHorizontal: 0,
      }
    })
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
}); 