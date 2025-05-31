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

interface VisaFormValues {
  employee_id: string;
  visa_type: string;
  visa_number: string;
  issue_date: Date;
  expiry_date: Date;
  passport_number: string;
  nationality: string;
  notes: string;
}

const visaTypes = [
  'Employment Visa',
  'Residence Visa',
  'Visit Visa',
  'Student Visa',
  'Business Visa',
];

const validationSchema = Yup.object().shape({
  employee_id: Yup.string().required('Employee ID is required'),
  visa_type: Yup.string().required('Visa type is required'),
  visa_number: Yup.string().required('Visa number is required'),
  issue_date: Yup.date().required('Issue date is required'),
  expiry_date: Yup.date()
    .required('Expiry date is required')
    .min(Yup.ref('issue_date'), 'Expiry date must be after issue date'),
  passport_number: Yup.string().required('Passport number is required'),
  nationality: Yup.string().required('Nationality is required'),
  notes: Yup.string(),
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

  const initialValues: VisaFormValues = {
    employee_id: '',
    visa_type: '',
    visa_number: '',
    issue_date: new Date(),
    expiry_date: new Date(),
    passport_number: '',
    nationality: '',
    notes: '',
  };

  const handleSubmit = async (values: VisaFormValues) => {
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
