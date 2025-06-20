import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Button, Card, ProgressBar } from 'react-native-paper';

const { width } = Dimensions.get('window');

// Types
interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  validation?: (data: any) => string | null;
}

interface SmartFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'phone' | 'date' | 'select';
  validation?: (value: string) => string | null;
  multiline?: boolean;
  numberOfLines?: number;
}

interface MultiStepFormProps {
  steps: FormStep[];
  data: any;
  onDataChange: (data: any) => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  children?: React.ReactNode;
}

// Smart Field Component
export const SmartField: React.FC<SmartFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  type = 'text',
  validation,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  // Real-time validation
  useEffect(() => {
    if (validation && value) {
      const validationError = validation(value);
      setLocalError(validationError);
    } else {
      setLocalError(null);
    }
  }, [value, validation]);

  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const displayError = error || localError;

  return (
    <View style={styles.fieldContainer}>
      <TextInput
        label={`${label}${required ? ' *' : ''}`}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        mode="outlined"
        error={!!displayError}
        keyboardType={getKeyboardType()}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={styles.textInput}
      />
      
      {displayError && (
        <Text style={styles.errorText}>{displayError}</Text>
      )}
    </View>
  );
};

// Multi-Step Form Component
export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  data,
  onDataChange,
  onSubmit,
  loading = false,
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = (currentStep + 1) / steps.length;

  const validateCurrentStep = useCallback(() => {
    const step = steps[currentStep];
    if (step.validation) {
      const error = step.validation(data);
      return !error;
    }
    
    // Basic required field validation
    return step.fields.every(field => {
      const value = data[field];
      return value && value.toString().trim().length > 0;
    });
  }, [currentStep, data, steps]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (isLastStep) {
        onSubmit(data);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  }, [currentStep, isLastStep, validateCurrentStep, data, onSubmit]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  return (
    <View style={styles.formContainer}>
      {/* Progress Header */}
      <Card style={styles.progressCard}>
        <Card.Content>
          <Text style={styles.stepTitle}>
            Step {currentStep + 1} of {steps.length}: {currentStepData.title}
          </Text>
          {currentStepData.description && (
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
          )}
          <ProgressBar 
            progress={progress} 
            style={styles.progressBar}
            color="#2196F3"
          />
        </Card.Content>
      </Card>

      {/* Form Content */}
      <View style={styles.formContent}>
        {children}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentStep === 0}
          style={styles.navButton}
        >
          Previous
        </Button>
        
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!validateCurrentStep()}
          loading={loading && isLastStep}
          style={styles.navButton}
        >
          {isLastStep ? 'Submit' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

// Validation utilities
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    padding: 16,
  },
  progressCard: {
    marginBottom: 16,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  formContent: {
    flex: 1,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  textInput: {
    backgroundColor: 'white',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  navButton: {
    flex: 1,
  },
}); 