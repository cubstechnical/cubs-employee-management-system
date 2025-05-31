import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Chip,
  Button,
  Surface,
  IconButton,
  Divider,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import { CustomTheme } from '../../theme';
import { withAuthGuard } from '../../components/AuthGuard';
import { COMPANIES } from '../../utils/constants';
import { safeThemeAccess } from '../../utils/errorPrevention';

const { width } = Dimensions.get('window');

export default function EmployeeProfileScreen() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const { employees, fetchEmployees } = useEmployees();
  
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Professional color scheme
  const COLORS = {
    primary: '#2563EB',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#3B82F6',
    gray: '#6B7280',
  };

  useEffect(() => {
    loadEmployeeData();
  }, [employees, user]);

  const loadEmployeeData = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      console.log('🔍 [EMPLOYEE PROFILE] Loading data for:', user.email);
      
      // Find employee data by email
      const employeeData = employees.find(emp => emp.email_id === user.email);
      console.log('📋 [EMPLOYEE PROFILE] Found employee:', employeeData?.name);
      
      setEmployee(employeeData);
      
      // TODO: Load employee documents when document API is ready
      // const employeeDocs = await getEmployeeDocuments(employeeData.id);
      // setDocuments(employeeDocs);
      
    } catch (error) {
      console.error('❌ [EMPLOYEE PROFILE] Error loading data:', error);
      Alert.alert('Error', 'Failed to load your profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees(); // Refresh employees data
    await loadEmployeeData();
    setRefreshing(false);
  };

  const getVisaStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return COLORS.success;
      case 'INACTIVE': return COLORS.error;
      case 'EXPIRY': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getVisaAlertMessage = (expiryDate: string) => {
    const days = calculateDaysUntilExpiry(expiryDate);
    if (days === null) return null;
    
    if (days < 0) return { message: `Expired ${Math.abs(days)} days ago`, color: COLORS.error };
    if (days <= 7) return { message: `Expires in ${days} days`, color: COLORS.error };
    if (days <= 30) return { message: `Expires in ${days} days`, color: COLORS.warning };
    return { message: `${days} days remaining`, color: COLORS.success };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.gray }}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <IconButton icon="account-question" size={64} iconColor={COLORS.gray} />
        <Text variant="headlineSmall" style={{ color: COLORS.gray, textAlign: 'center', marginTop: 16 }}>
          Profile Not Found
        </Text>
        <Text variant="bodyMedium" style={{ color: COLORS.gray, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
          Your employee profile hasn't been set up yet. Please contact your administrator to create your profile.
        </Text>
        <Button 
          mode="contained" 
          onPress={onRefresh}
          style={{ marginTop: 24, backgroundColor: COLORS.primary }}
        >
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  const visaAlert = getVisaAlertMessage(employee.visa_expiry_date);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, '#1D4ED8', '#1E40AF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Avatar.Text 
            size={80} 
            label={employee.name ? employee.name.charAt(0).toUpperCase() : 'E'} 
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            labelStyle={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}
          />
          <Text variant="headlineSmall" style={styles.headerName}>
            {employee.name || 'Employee Name'}
          </Text>
          <Text variant="bodyLarge" style={styles.headerRole}>
            {employee.trade || 'Employee'} • {employee.company_name || 'CUBS Technical'}
          </Text>
          <Text variant="bodyMedium" style={styles.headerInfo}>
            ID: {employee.employee_id || 'Not assigned'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Visa Status Alert */}
        {visaAlert && (
          <Surface style={[styles.alertCard, { borderLeftColor: visaAlert.color }]} elevation={2}>
            <View style={styles.alertContent}>
              <IconButton 
                icon="alert-circle" 
                size={24} 
                iconColor={visaAlert.color}
                style={{ margin: 0 }}
              />
              <View style={styles.alertText}>
                <Text variant="titleSmall" style={{ color: visaAlert.color, fontWeight: 'bold' }}>
                  Visa Status Alert
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {visaAlert.message}
                </Text>
              </View>
            </View>
          </Surface>
        )}

        {/* Personal Information */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="account" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Personal Information
            </Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Employee ID</Text>
              <Text style={styles.infoValue}>{employee.employee_id || 'Not assigned'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nationality</Text>
              <Text style={styles.infoValue}>{employee.nationality || 'Not specified'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{formatDate(employee.date_of_birth)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Join Date</Text>
              <Text style={styles.infoValue}>{formatDate(employee.join_date)}</Text>
            </View>
          </View>
        </Surface>

        {/* Contact Information */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="phone" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Contact Information
            </Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{employee.mobile_number || 'Not provided'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Home Phone</Text>
              <Text style={styles.infoValue}>{employee.home_phone_number || 'Not provided'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{employee.email_id || 'Not provided'}</Text>
            </View>
          </View>
        </Surface>

        {/* Visa Information */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="passport" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Visa & Passport Information
            </Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Passport Number</Text>
              <Text style={styles.infoValue}>{employee.passport_number || 'Not provided'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Visa Status</Text>
              <Chip 
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getVisaStatusColor(employee.visa_status) + '20' }]}
                textStyle={{ color: getVisaStatusColor(employee.visa_status), fontWeight: 'bold' }}
              >
                {employee.visa_status || 'Unknown'}
              </Chip>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Visa Expiry Date</Text>
              <Text style={[styles.infoValue, { color: visaAlert?.color || theme.colors.onSurface }]}>
                {formatDate(employee.visa_expiry_date)}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Documents Section */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="file-document" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              My Documents
            </Text>
          </View>
          
          {documents.length > 0 ? (
            <View style={styles.documentsGrid}>
              {documents.map((doc, index) => (
                <Surface key={index} style={styles.documentCard} elevation={1}>
                  <IconButton icon="file-pdf-box" size={32} iconColor={COLORS.error} />
                  <Text variant="bodySmall" style={styles.docName}>{doc.document_type}</Text>
                  <Text variant="bodySmall" style={styles.docDate}>{formatDate(doc.created_at)}</Text>
                </Surface>
              ))}
            </View>
          ) : (
            <View style={styles.emptyDocuments}>
              <IconButton icon="file-document-outline" size={48} iconColor={COLORS.gray} />
              <Text style={styles.emptyText}>No documents uploaded yet</Text>
              <Text style={styles.emptySubtext}>Your documents will appear here once uploaded by admin</Text>
            </View>
          )}
        </Surface>

        {/* Quick Actions */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="cog" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Quick Actions
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Contact Admin', 'Please contact your administrator to update your profile information.')}
              style={[styles.actionButton, { borderColor: COLORS.primary }]}
              labelStyle={{ color: COLORS.primary }}
              icon="account-edit"
            >
              Request Profile Update
            </Button>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Contact Admin', 'For any queries, please contact:\n\nEmail: admin@cubs.com\nPhone: [Contact Number]')}
              style={[styles.actionButton, { borderColor: COLORS.info }]}
              labelStyle={{ color: COLORS.info }}
              icon="help-circle"
            >
              Get Help
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  headerName: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  headerRole: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  headerInfo: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  alertCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: 'white',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  statusChip: {
    alignSelf: 'flex-end',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  documentCard: {
    width: (width - 80) / 3,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  docName: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  docDate: {
    textAlign: 'center',
    marginTop: 2,
    fontSize: 8,
    color: '#6B7280',
  },
  emptyDocuments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
}); 
