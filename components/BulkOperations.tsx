import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Card,
  Checkbox,
  IconButton,
  Menu,
  Surface,
  Portal,
  Modal,
  TextInput,
  Chip,
  List,
  Divider,
  ProgressBar,
  Switch,
  SegmentedButtons,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { getDeviceInfo, getResponsiveSpacing } from '../utils/mobileUtils';
import { Employee } from '../types/employee';
import { sendVisaExpiryReminders } from '../services/emailService';
import { supabase } from '../services/supabase';

interface BulkOperation {
  id: string;
  label: string;
  icon: string;
  description: string;
  type: 'update' | 'action' | 'delete';
  requiresConfirmation: boolean;
  fields?: BulkUpdateField[];
}

interface BulkUpdateField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'switch';
  options?: { label: string; value: string }[];
  required?: boolean;
}

interface BulkOperationResult {
  sent?: number;
  failed?: number;
  updated?: number;
  deleted?: number;
  exported?: number;
  generated?: boolean;
  errors?: string[];
  error?: string;
  format?: string;
  includeSensitive?: boolean;
  filename?: string;
  reportType?: string;
  employeeCount?: number;
  reportId?: string;
}

interface BulkOperationsProps {
  employees: Employee[];
  selectedEmployees: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onOperationComplete: (operation: string, results: BulkOperationResult) => void;
  visible: boolean;
  onClose: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  employees,
  selectedEmployees,
  onSelectionChange,
  onOperationComplete,
  visible,
  onClose,
}) => {
  const { isPhone } = getDeviceInfo();
  const spacing = getResponsiveSpacing('md');

  // State management
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [operationData, setOperationData] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'filter'>('manual');
  const [filterCriteria, setFilterCriteria] = useState({
    company: '',
    visaStatus: '',
    nationality: '',
    trade: '',
  });

  // Available bulk operations
  const bulkOperations: BulkOperation[] = [
    {
      id: 'send_reminders',
      label: 'Send Visa Reminders',
      icon: 'email-send',
      description: 'Send visa expiry reminder emails to selected employees',
      type: 'action',
      requiresConfirmation: true,
    },
    {
      id: 'update_company',
      label: 'Update Company',
      icon: 'office-building',
      description: 'Change company assignment for selected employees',
      type: 'update',
      requiresConfirmation: true,
      fields: [
        {
          key: 'company_name',
          label: 'New Company',
          type: 'select',
          required: true,
          options: [
            { label: 'CUBS TECH CONTRACTING', value: 'CUBS TECH CONTRACTING' },
            { label: 'GOLDENCUBS GENERAL CONTRACTING LLC', value: 'GOLDENCUBS GENERAL CONTRACTING LLC' },
            { label: 'AL ASHBAL ELECTROMECHANICAL CONTRACTING LLC', value: 'AL ASHBAL ELECTROMECHANICAL CONTRACTING LLC' },
          ],
        },
      ],
    },
    {
      id: 'update_visa_status',
      label: 'Update Visa Status',
      icon: 'card-account-details',
      description: 'Update visa status for selected employees',
      type: 'update',
      requiresConfirmation: true,
      fields: [
        {
          key: 'visa_status',
          label: 'Visa Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
            { label: 'Expiring', value: 'EXPIRY' },
          ],
        },
      ],
    },
    {
      id: 'export_data',
      label: 'Export Employee Data',
      icon: 'download',
      description: 'Export selected employee data to CSV or Excel',
      type: 'action',
      requiresConfirmation: false,
      fields: [
        {
          key: 'format',
          label: 'Export Format',
          type: 'select',
          required: true,
          options: [
            { label: 'CSV', value: 'csv' },
            { label: 'Excel', value: 'xlsx' },
          ],
        },
        {
          key: 'include_sensitive',
          label: 'Include Sensitive Data',
          type: 'switch',
          required: false,
        },
      ],
    },
    {
      id: 'generate_reports',
      label: 'Generate Reports',
      icon: 'file-chart',
      description: 'Generate various reports for selected employees',
      type: 'action',
      requiresConfirmation: false,
      fields: [
        {
          key: 'report_type',
          label: 'Report Type',
          type: 'select',
          required: true,
          options: [
            { label: 'Visa Status Report', value: 'visa_status' },
            { label: 'Company Summary', value: 'company_summary' },
            { label: 'Expiry Timeline', value: 'expiry_timeline' },
          ],
        },
      ],
    },
    {
      id: 'bulk_delete',
      label: 'Delete Employees',
      icon: 'delete',
      description: 'Permanently delete selected employee records',
      type: 'delete',
      requiresConfirmation: true,
    },
  ];

  // Get selected employee objects
  const selectedEmployeeObjects = useMemo(() => {
    return employees.filter(emp => selectedEmployees.includes(emp.id || emp.employee_id || ''));
  }, [employees, selectedEmployees]);

  // Smart selection based on criteria
  const applyFilterSelection = useCallback(() => {
    const filtered = employees.filter(employee => {
      if (filterCriteria.company && !employee.company_name?.includes(filterCriteria.company)) {
        return false;
      }
      if (filterCriteria.nationality && !employee.nationality?.includes(filterCriteria.nationality)) {
        return false;
      }
      if (filterCriteria.trade && !employee.trade?.includes(filterCriteria.trade)) {
        return false;
      }
      if (filterCriteria.visaStatus) {
        const visaStatus = getVisaStatusFromDate(employee.visa_expiry_date || '');
        if (visaStatus !== filterCriteria.visaStatus) {
          return false;
        }
      }
      return true;
    });

    const filteredIds = filtered.map(emp => emp.id || emp.employee_id || '').filter(Boolean);
    onSelectionChange(filteredIds);
  }, [employees, filterCriteria, onSelectionChange]);

  // Helper function to get visa status
  const getVisaStatusFromDate = (expiryDate: string): string => {
    if (!expiryDate) return 'UNKNOWN';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= 30) return 'EXPIRY';
    return 'ACTIVE';
  };

  // Execute bulk operation
  const executeBulkOperation = useCallback(async (operation: BulkOperation) => {
    if (selectedEmployees.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      let results: BulkOperationResult = {};

      switch (operation.id) {
        case 'send_reminders':
          results = await handleSendReminders();
          break;
        case 'update_company':
        case 'update_visa_status':
          results = await handleBulkUpdate(operation);
          break;
        case 'export_data':
          results = await handleExportData();
          break;
        case 'generate_reports':
          results = await handleGenerateReports();
          break;
        case 'bulk_delete':
          results = await handleBulkDelete();
          break;
        default:
          throw new Error('Unknown operation');
      }

      onOperationComplete(operation.id, results);
      onClose();
    } catch (error) {
      console.error('Bulk operation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onOperationComplete(operation.id, { error: errorMessage });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [selectedEmployees, operationData, onOperationComplete, onClose]);

  // Handle sending reminders
  const handleSendReminders = async (): Promise<BulkOperationResult> => {
    const results: BulkOperationResult = { sent: 0, failed: 0, errors: [] };
    
    for (let i = 0; i < selectedEmployeeObjects.length; i++) {
      const employee = selectedEmployeeObjects[i];
      
      try {
        await sendVisaExpiryReminders([employee]);
        results.sent = (results.sent || 0) + 1;
      } catch (error) {
        results.failed = (results.failed || 0) + 1;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors?.push(`${employee.name}: ${errorMessage}`);
      }
      
      setProgress((i + 1) / selectedEmployeeObjects.length);
    }

    return results;
  };

  // Handle bulk update
  const handleBulkUpdate = async (operation: BulkOperation): Promise<BulkOperationResult> => {
    const results: BulkOperationResult = { updated: 0, failed: 0, errors: [] };
    
    const updateData = { ...operationData };
    
    for (let i = 0; i < selectedEmployees.length; i++) {
      const employeeId = selectedEmployees[i];
      
      try {
        const { error } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', employeeId);

        if (error) throw error;
        results.updated = (results.updated || 0) + 1;
      } catch (error) {
        results.failed = (results.failed || 0) + 1;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors?.push(`Employee ${employeeId}: ${errorMessage}`);
      }
      
      setProgress((i + 1) / selectedEmployees.length);
    }

    return results;
  };

  // Handle export data
  const handleExportData = async (): Promise<BulkOperationResult> => {
    const format = operationData.format || 'csv';
    const includeSensitive = operationData.include_sensitive || false;
    
    // In a real implementation, you would generate and download the file
    // For now, we'll simulate the process
    
    return {
      exported: selectedEmployees.length,
      format,
      includeSensitive,
      filename: `employees_export_${new Date().toISOString().split('T')[0]}.${format}`,
    };
  };

  // Handle generate reports
  const handleGenerateReports = async (): Promise<BulkOperationResult> => {
    const reportType = operationData.report_type;
    
    // Simulate report generation
    return {
      generated: true,
      reportType,
      employeeCount: selectedEmployees.length,
      reportId: `report_${Date.now()}`,
    };
  };

  // Handle bulk delete
  const handleBulkDelete = async (): Promise<BulkOperationResult> => {
    const results: BulkOperationResult = { deleted: 0, failed: 0, errors: [] };
    
    for (let i = 0; i < selectedEmployees.length; i++) {
      const employeeId = selectedEmployees[i];
      
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (error) throw error;
        results.deleted = (results.deleted || 0) + 1;
      } catch (error) {
        results.failed = (results.failed || 0) + 1;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors?.push(`Employee ${employeeId}: ${errorMessage}`);
      }
      
      setProgress((i + 1) / selectedEmployees.length);
    }

    return results;
  };

  // Render operation form
  const renderOperationForm = (operation: BulkOperation) => {
    if (!operation.fields) return null;

    return (
      <View style={styles.formContainer}>
        {operation.fields.map(field => (
          <View key={field.key} style={styles.fieldContainer}>
            <Text variant="labelMedium" style={styles.fieldLabel}>
              {field.label} {field.required && '*'}
            </Text>
            
            {field.type === 'text' && (
              <TextInput
                value={operationData[field.key] || ''}
                onChangeText={(value) => setOperationData(prev => ({ ...prev, [field.key]: value }))}
                style={styles.textInput}
              />
            )}
            
            {field.type === 'select' && field.options && (
              <View style={styles.selectContainer}>
                {field.options.map(option => (
                  <Chip
                    key={option.value}
                    mode={operationData[field.key] === option.value ? 'flat' : 'outlined'}
                    selected={operationData[field.key] === option.value}
                    onPress={() => setOperationData(prev => ({ ...prev, [field.key]: option.value }))}
                    style={styles.selectChip}
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>
            )}
            
            {field.type === 'switch' && (
              <View style={styles.switchContainer}>
                <Switch
                  value={operationData[field.key] || false}
                  onValueChange={(value) => setOperationData(prev => ({ ...prev, [field.key]: value }))}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  // Render selection interface
  const renderSelectionInterface = () => (
    <Card style={styles.selectionCard}>
      <Card.Title title="Employee Selection" />
      <Card.Content>
        <SegmentedButtons
          value={selectionMode}
          onValueChange={setSelectionMode}
          buttons={[
            { value: 'manual', label: 'Manual' },
            { value: 'filter', label: 'Smart Filter' },
          ]}
          style={styles.segmentedButtons}
        />

        {selectionMode === 'filter' ? (
          <View style={styles.filterContainer}>
            <TextInput
              label="Company"
              value={filterCriteria.company}
              onChangeText={(value) => setFilterCriteria(prev => ({ ...prev, company: value }))}
              style={styles.filterInput}
            />
            <TextInput
              label="Nationality"
              value={filterCriteria.nationality}
              onChangeText={(value) => setFilterCriteria(prev => ({ ...prev, nationality: value }))}
              style={styles.filterInput}
            />
            <Button
              mode="contained"
              onPress={applyFilterSelection}
              style={styles.applyFilterButton}
            >
              Apply Filter ({employees.filter(emp => {
                // Count how many would be selected
                if (filterCriteria.company && !emp.company_name?.includes(filterCriteria.company)) return false;
                if (filterCriteria.nationality && !emp.nationality?.includes(filterCriteria.nationality)) return false;
                return true;
              }).length})
            </Button>
          </View>
        ) : (
          <View style={styles.manualSelection}>
            <View style={styles.selectionSummary}>
              <Text variant="bodyMedium">
                {selectedEmployees.length} of {employees.length} employees selected
              </Text>
              <View style={styles.selectionActions}>
                <Button
                  mode="outlined"
                  onPress={() => onSelectionChange([])}
                  compact
                >
                  Clear All
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => onSelectionChange(employees.map(emp => emp.id || emp.employee_id || '').filter(Boolean))}
                  compact
                >
                  Select All
                </Button>
              </View>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modalContainer,
          isPhone && styles.modalContainerMobile,
        ]}
      >
        <Surface style={styles.modalContent}>
          <View style={styles.header}>
            <Text variant="headlineSmall">Bulk Operations</Text>
            <IconButton icon="close" onPress={onClose} />
          </View>

          <ScrollView style={styles.scrollContainer}>
            {renderSelectionInterface()}

            {/* Operations List */}
            <Card style={styles.operationsCard}>
              <Card.Title title="Available Operations" />
              <Card.Content>
                {bulkOperations.map(operation => (
                  <List.Item
                    key={operation.id}
                    title={operation.label}
                    description={operation.description}
                    left={() => <List.Icon icon={operation.icon} />}
                    right={() => (
                      <Badge
                        style={[
                          styles.operationBadge,
                          { backgroundColor: 
                            operation.type === 'delete' ? '#dc2626' :
                            operation.type === 'update' ? '#f59e0b' : '#22c55e'
                          }
                        ]}
                      >
                        {operation.type.toUpperCase()}
                      </Badge>
                    )}
                    onPress={() => setSelectedOperation(operation)}
                    disabled={selectedEmployees.length === 0}
                    style={[
                      styles.operationItem,
                      selectedEmployees.length === 0 && styles.disabledOperation,
                    ]}
                  />
                ))}
              </Card.Content>
            </Card>

            {/* Operation Form */}
            {selectedOperation && (
              <Card style={styles.operationFormCard}>
                <Card.Title 
                  title={selectedOperation.label}
                  subtitle={`Operation will affect ${selectedEmployees.length} employee(s)`}
                />
                <Card.Content>
                  {renderOperationForm(selectedOperation)}
                </Card.Content>
                <Card.Actions>
                  <Button
                    onPress={() => setSelectedOperation(null)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      if (selectedOperation.requiresConfirmation) {
                        setShowConfirmation(true);
                      } else {
                        executeBulkOperation(selectedOperation);
                      }
                    }}
                    disabled={isProcessing || selectedEmployees.length === 0}
                    loading={isProcessing}
                  >
                    {selectedOperation.requiresConfirmation ? 'Confirm' : 'Execute'}
                  </Button>
                </Card.Actions>
                
                {isProcessing && (
                  <View style={styles.progressContainer}>
                    <ProgressBar progress={progress} style={styles.progressBar} />
                    <Text variant="bodySmall" style={styles.progressText}>
                      Processing... {Math.round(progress * 100)}%
                    </Text>
                  </View>
                )}
              </Card>
            )}
          </ScrollView>

          {/* Confirmation Dialog */}
          <Portal>
            <Modal
              visible={showConfirmation}
              onDismiss={() => setShowConfirmation(false)}
              contentContainerStyle={styles.confirmationModal}
            >
              <Surface style={styles.confirmationContent}>
                <Text variant="headlineSmall" style={styles.confirmationTitle}>
                  Confirm Operation
                </Text>
                <Text variant="bodyMedium" style={styles.confirmationMessage}>
                  Are you sure you want to {selectedOperation?.label.toLowerCase()} for {selectedEmployees.length} employee(s)?
                  {selectedOperation?.type === 'delete' && (
                    <Text style={styles.warningText}>
                      {'\n\n'}⚠️ This action cannot be undone.
                    </Text>
                  )}
                </Text>
                <View style={styles.confirmationActions}>
                  <Button
                    onPress={() => setShowConfirmation(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setShowConfirmation(false);
                      selectedOperation && executeBulkOperation(selectedOperation);
                    }}
                    disabled={isProcessing}
                    buttonColor={selectedOperation?.type === 'delete' ? '#dc2626' : undefined}
                  >
                    Confirm
                  </Button>
                </View>
              </Surface>
            </Modal>
          </Portal>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerMobile: {
    padding: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxWidth: 700,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scrollContainer: {
    maxHeight: 600,
  },
  selectionCard: {
    margin: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  filterContainer: {
    gap: 12,
  },
  filterInput: {
    marginBottom: 8,
  },
  applyFilterButton: {
    marginTop: 8,
  },
  manualSelection: {
    marginTop: 8,
  },
  selectionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  operationsCard: {
    margin: 16,
    marginBottom: 8,
  },
  operationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  disabledOperation: {
    opacity: 0.5,
  },
  operationBadge: {
    alignSelf: 'center',
  },
  operationFormCard: {
    margin: 16,
  },
  formContainer: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    marginBottom: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  progressBar: {
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
    color: '#6b7280',
  },
  confirmationModal: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContent: {
    padding: 24,
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
  },
  confirmationTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationMessage: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  warningText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  confirmationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});

export default BulkOperations; 