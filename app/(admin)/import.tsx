import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, Snackbar, Card, Surface, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { importEmployees, validateEmployeeData } from '../../utils/importEmployees';
import { withAuthGuard } from '../../components/AuthGuard';
import AdminLayout from '../../components/AdminLayout';
import Papa from 'papaparse';

function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

function ImportScreen() {
  const theme = useTheme() as CustomTheme;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Pick a CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Read the file
      const response = await fetch(result.assets[0].uri);
      const csvText = await response.text();

      // Parse CSV
      Papa.parse(csvText, {
        header: true,
        complete: async (results) => {
          try {
            // Validate the data
            const validatedData = validateEmployeeData(results.data);

            // Import the data
            await importEmployees(validatedData);

            setSuccess(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import employees');
          } finally {
            setLoading(false);
          }
        },
        error: (err: any) => {
          setError(`Failed to parse CSV: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import employees');
      setLoading(false);
    }
  };

  const csvTemplate = `employee_id,name,trade,nationality,date_of_birth,mobile_number,home_phone_number,email_id,company_id,company_name,join_date,visa_expiry_date,passport_number
EMP001,John Smith,Electrician,Indian,15-06-1990,+971501234567,+971041234567,john.smith@example.com,CUBS001,CUBS Technical Contracting,01-01-2023,31-12-2025,A12345678
EMP002,Ahmed Hassan,Plumber,Egyptian,22-03-1985,+971507654321,,ahmed.hassan@example.com,CUBS001,CUBS Technical Contracting,15-02-2023,15-06-2025,B87654321`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 24,
    },
    header: {
      marginBottom: safeThemeAccess.spacing(theme, 'lg'),
    },
    title: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      fontWeight: 'bold',
      color: safeThemeAccess.colors(theme, 'onBackground'),
    },
    description: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
      lineHeight: 24,
    },
    instructionCard: {
      marginBottom: safeThemeAccess.spacing(theme, 'lg'),
      backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer'),
      borderRadius: 16,
    },
    fieldList: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    fieldItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    requiredField: {
      color: safeThemeAccess.colors(theme, 'error'),
      fontWeight: 'bold',
    },
    optionalField: {
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
    },
    sampleCard: {
      marginBottom: safeThemeAccess.spacing(theme, 'lg'),
      backgroundColor: safeThemeAccess.colors(theme, 'surface'),
      borderRadius: 12,
    },
    sampleText: {
      fontFamily: 'monospace',
      fontSize: 12,
      color: safeThemeAccess.colors(theme, 'onSurface'),
      lineHeight: 18,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    button: {
      flex: 1,
    },
    loadingContainer: {
      marginTop: safeThemeAccess.spacing(theme, 'xl'),
      alignItems: 'center',
    },
    loadingText: {
      marginTop: safeThemeAccess.spacing(theme, 'md'),
      color: safeThemeAccess.colors(theme, 'onSurface'),
    },
  });

  return (
    <AdminLayout 
      title="Bulk Import Employees" 
      currentRoute="/admin/import"
      showBackButton={true}
      onBackPress={() => router.push('/(admin)/dashboard')}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              📊 Bulk Import Employees
            </Text>
            <Text variant="bodyLarge" style={styles.description}>
              Upload a CSV file containing employee data with visa expiry information. This will import all employee records into the system including their visa tracking data.
            </Text>
          </View>

          {/* Instructions */}
          <Card style={[styles.instructionCard]} elevation={2}>
            <Card.Content style={{ padding: 20 }}>
              <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onPrimaryContainer'), fontWeight: 'bold', marginBottom: 12 }}>
                📋 CSV File Requirements
              </Text>
              <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onPrimaryContainer'), marginBottom: 16, opacity: 0.9 }}>
                Your CSV file should include the following columns (required fields marked with *):
              </Text>
              
              <View style={styles.fieldList}>
                {[
                  { field: 'employee_id', required: true, description: 'Unique employee identifier' },
                  { field: 'name', required: true, description: 'Full employee name' },
                  { field: 'trade', required: true, description: 'Job role/trade' },
                  { field: 'nationality', required: true, description: 'Employee nationality' },
                  { field: 'date_of_birth', required: true, description: 'Format: DD-MM-YYYY' },
                  { field: 'mobile_number', required: true, description: 'With country code' },
                  { field: 'home_phone_number', required: false, description: 'Optional home phone' },
                  { field: 'email_id', required: true, description: 'Valid email address' },
                  { field: 'company_id', required: true, description: 'Company identifier' },
                  { field: 'company_name', required: true, description: 'Company name' },
                  { field: 'join_date', required: true, description: 'Format: DD-MM-YYYY' },
                  { field: 'visa_expiry_date', required: true, description: 'Format: DD-MM-YYYY (for visa tracking)' },
                  { field: 'passport_number', required: true, description: 'Passport number' },
                ].map((item, index) => (
                  <View key={index} style={styles.fieldItem}>
                    <IconButton 
                      icon={item.required ? "alert-circle" : "information-outline"} 
                      size={16} 
                      iconColor={item.required ? safeThemeAccess.colors(theme, 'error') : safeThemeAccess.colors(theme, 'onPrimaryContainer')}
                      style={{ margin: 0, marginRight: 8 }}
                    />
                    <Text variant="bodyMedium" style={item.required ? styles.requiredField : { color: safeThemeAccess.colors(theme, 'onPrimaryContainer') }}>
                      {item.field} {item.required && '*'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onPrimaryContainer'), opacity: 0.7, marginLeft: 8 }}>
                      - {item.description}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Sample Data */}
          <Card style={[styles.sampleCard]} elevation={1}>
            <Card.Content style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold' }}>
                  📄 Sample CSV Data
                </Text>
                <Button
                  mode="outlined"
                  onPress={downloadTemplate}
                  icon="download"
                  compact
                >
                  Download Template
                </Button>
              </View>
              <Divider style={{ marginBottom: 12 }} />
              <Text variant="bodySmall" style={styles.sampleText}>
                {csvTemplate}
              </Text>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleImport}
              loading={loading}
              disabled={loading}
              style={styles.button}
              icon="upload"
              contentStyle={{ paddingVertical: 8 }}
            >
              {loading ? 'Importing...' : 'Select & Import CSV File'}
            </Button>
            <Button
              mode="outlined"
              onPress={downloadTemplate}
              style={styles.button}
              icon="download"
              contentStyle={{ paddingVertical: 8 }}
            >
              Download Template
            </Button>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={safeThemeAccess.colors(theme, 'primary')} />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Importing employees and setting up visa tracking...
              </Text>
            </View>
          )}
        </View>

        <Snackbar
          visible={error !== null}
          onDismiss={() => setError(null)}
          action={{
            label: 'Dismiss',
            onPress: () => setError(null),
          }}
          style={{ backgroundColor: safeThemeAccess.colors(theme, 'errorContainer') }}
        >
          <Text style={{ color: safeThemeAccess.colors(theme, 'onErrorContainer') }}>{error}</Text>
        </Snackbar>

        <Snackbar
          visible={success}
          onDismiss={() => setSuccess(false)}
          action={{
            label: 'View Employees',
            onPress: () => {
              setSuccess(false);
              // Navigate to employees screen
            },
          }}
          style={{ backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }}
        >
          <Text style={{ color: safeThemeAccess.colors(theme, 'onPrimaryContainer') }}>
            ✅ Employees imported successfully with visa tracking enabled!
          </Text>
        </Snackbar>
      </ScrollView>
    </AdminLayout>
  );
}

export default withAuthGuard({
  WrappedComponent: ImportScreen,
  allowedRoles: ['admin']
}); 

