import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  useTheme,
  Portal,
  Snackbar,
  ActivityIndicator,
  HelperText,
  Menu
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';
import WebDatePicker from '../../components/WebDatePicker';

interface VisaFormData {
  employee_name: string;
  employee_id: string;
  company_name: string;
  visa_expiry_date: string;
  passport_no: string;
  mobile_number: string;
}

const visaTypes = [
  'Employment Visa',
  'Residence Visa',
  'Visit Visa',
  'Student Visa',
  'Business Visa',
];

const validationSchema = Yup.object().shape({
  employee_name: Yup.string().required('Employee name is required'),
  employee_id: Yup.string().required('Employee ID is required'),
  company_name: Yup.string().required('Company name is required'),
  visa_expiry_date: Yup.string().required('Visa expiry date is required'),
  passport_no: Yup.string().required('Passport number is required'),
  mobile_number: Yup.string().required('Mobile number is required'),
});

export default function VisaFormScreen() {
  const theme = useTheme() as CustomTheme;
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showVisaTypeMenu, setShowVisaTypeMenu] = useState(false);
  const [selectedVisaType, setSelectedVisaType] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'issue' | 'expiry' | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: safeThemeAccess.spacing(theme, 'lg'),
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    form: {
      padding: safeThemeAccess.spacing(theme, 'lg'),
    },
    input: {
      marginBottom: safeThemeAccess.spacing(theme, 'sm'),
    },
    label: {
      marginTop: safeThemeAccess.spacing(theme, 'md'),
      marginBottom: safeThemeAccess.spacing(theme, 'sm'),
    },
    errorText: {
      marginBottom: safeThemeAccess.spacing(theme, 'sm'),
      fontSize: 12,
    },
    dateButton: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    dateContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    dateInput: {
      flex: 1,
      marginRight: safeThemeAccess.spacing(theme, 'sm'),
    },
    dateLabel: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 18,
      color: '#666666',
      fontFamily: 'Roboto-Regular',
      marginBottom: safeThemeAccess.spacing(theme, 'xs'),
    },
    submitButton: {
      marginTop: safeThemeAccess.spacing(theme, 'lg'),
    },
    snackbar: {
      margin: safeThemeAccess.spacing(theme, 'lg'),
    },
    datePicker: {
      width: '100%',
    },
    scrollContent: {
      padding: safeThemeAccess.spacing(theme, 'lg'),
      paddingBottom: 100,
    },
    card: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      padding: safeThemeAccess.spacing(theme, 'lg'),
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      color: safeThemeAccess.colors(theme, 'primary'),
    },
    inputContainer: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    pickerContainer: {
      marginTop: safeThemeAccess.spacing(theme, 'lg'),
      borderWidth: 1,
      borderColor: safeThemeAccess.colors(theme, 'outline'),
      borderRadius: 8,
      margin: safeThemeAccess.spacing(theme, 'lg'),
    },
  });

  const initialValues: VisaFormData = {
    employee_name: '',
    employee_id: '',
    company_name: '',
    visa_expiry_date: '',
    passport_no: '',
    mobile_number: '',
  };

  const handleSubmit = async (values: VisaFormData) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSnackbarMessage('Visa information saved successfully');
      setShowSnackbar(true);
    }, 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => {
          const handleDateChange = (field: 'issue' | 'expiry', event: any, selectedDate?: Date) => {
            setShowDatePicker(null);
            if (selectedDate) {
              setFieldValue(field === 'issue' ? 'issue_date' : 'expiry_date', selectedDate);
            }
          };
          return (
            <>
              <Text>Visa Form Screen</Text>
            </>
          );
        }}
      </Formik>
    </View>
  );
} 
