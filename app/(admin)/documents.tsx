import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  IconButton, 
  useTheme, 
  Snackbar, 
  TextInput, 
  Portal,
  Modal,
  Surface,
  Searchbar,
  Chip,
  Menu,
  Divider,
  FAB,
  DataTable
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { useEmployees } from '../../hooks/useEmployees';
import * as DocumentPicker from 'expo-document-picker';
import { uploadToBackblaze, listEmployeeDocuments, deleteFromBackblaze, downloadFromBackblaze } from '../../services/backblaze';
import { withAuthGuard } from '../../components/AuthGuard';

interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  fileName: string;
  documentType: string;
  uploadDate: Date;
  fileSize: number;
  url: string;
}

const DOCUMENT_TYPES = [
  'passport',
  'visa',
  'emirates_id',
  'labor_card', 
  'contract',
  'salary_certificate',
  'bank_statement',
  'medical_certificate',
  'certificate',
  'other'
];

export default withAuthGuard({
  WrappedComponent: AdminDocumentsScreen,
  allowedRoles: ['admin']
});

function AdminDocumentsScreen() {
  const theme = useTheme() as CustomTheme;
  const { employees, refreshEmployees } = useEmployees();
  const { employeeId: preSelectedEmployeeId } = useLocalSearchParams();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState('');
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>(preSelectedEmployeeId as string || '');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [employeeMenuVisible, setEmployeeMenuVisible] = useState(false);
  const [documentTypeMenuVisible, setDocumentTypeMenuVisible] = useState(false);
  
  // Modals
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadEmployee, setUploadEmployee] = useState<string>('');
  const [uploadDocumentType, setUploadDocumentType] = useState<string>('passport');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState<string>('');
  const [uploadDocumentNumber, setUploadDocumentNumber] = useState<string>('');
  const [uploadIssuingAuthority, setUploadIssuingAuthority] = useState<string>('');
  const [uploadNotes, setUploadNotes] = useState<string>('');

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadDocuments();
    if (!employees || employees.length === 0) {
      refreshEmployees();
    }
  }, []);

  useEffect(() => {
    if (preSelectedEmployeeId) {
      setSelectedEmployee(preSelectedEmployeeId as string);
    }
  }, [preSelectedEmployeeId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const allDocuments: Document[] = [];
      
      if (employees && employees.length > 0) {
        // Fetch documents for all employees
        for (const employee of employees) {
          try {
            const employeeDocs = await listEmployeeDocuments(employee.id);
            
            employeeDocs.forEach((doc, index) => {
              allDocuments.push({
                id: doc.fileName, // Use fileName as ID for now
                employeeId: employee.id,
                employeeName: employee.name,
                fileName: doc.fileName.split('/').pop() || 'Unknown File',
                documentType: determineDocumentType(doc.fileName),
                uploadDate: new Date(doc.uploadTimestamp),
                fileSize: doc.contentLength,
                url: doc.url,
              });
            });
          } catch (docError) {
            console.warn(`Error loading documents for employee ${employee.name}:`, docError);
            // Continue with other employees even if one fails
          }
        }
      }
      
      setDocuments(allDocuments);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Document loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine document type from filename
  const determineDocumentType = (fileName: string): string => {
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.includes('passport')) return 'passport';
    if (lowerFileName.includes('visa')) return 'visa';
    if (lowerFileName.includes('emirates') || lowerFileName.includes('id')) return 'emirates_id';
    if (lowerFileName.includes('labor') || lowerFileName.includes('labour')) return 'labor_card';
    if (lowerFileName.includes('contract')) return 'contract';
    if (lowerFileName.includes('salary') || lowerFileName.includes('certificate')) return 'salary_certificate';
    if (lowerFileName.includes('bank') || lowerFileName.includes('statement')) return 'bank_statement';
    if (lowerFileName.includes('medical') || lowerFileName.includes('health')) return 'medical_certificate';
    if (lowerFileName.includes('certificate') || lowerFileName.includes('cert')) return 'certificate';
    
    return 'other';
  };

  const handleUpload = async () => {
    if (!uploadEmployee) {
      setSnackbar('Please select an employee');
      return;
    }
    
    if (uploadDocumentType === 'visa' && !uploadExpiryDate) {
      setSnackbar('Visa expiry date is required for visa documents');
      return;
    }
    
    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileName = uploadFileName || file.name;
        
        // Use DocumentService with proper file handling
        const { uploadDocument } = await import('../../services/documentService');
        
        // Create proper file object for upload
        const fileToUpload = {
          uri: file.uri,
          name: fileName,
          type: file.mimeType || 'application/octet-stream',
          size: file.size || 0
        };
        
        const uploadResult = await uploadDocument(fileToUpload as any, uploadEmployee, uploadDocumentType);
        
        if (uploadResult.success) {
          setSnackbar('Document uploaded successfully!');
          setUploadModalVisible(false);
          resetUploadForm();
          await loadDocuments();
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      }
    } catch (err) {
      setSnackbar('Failed to upload document');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const downloadResult = await downloadFromBackblaze(document.id, document.fileName);
      
      if (downloadResult.success && downloadResult.url) {
        // Open the download URL
        if (typeof window !== 'undefined') {
          window.open(downloadResult.url, '_blank');
        }
        setSnackbar('Download started!');
      } else {
        throw new Error(downloadResult.error || 'Download failed');
      }
    } catch (err) {
      setSnackbar('Failed to download document');
      console.error('Download error:', err);
    }
  };

  const handleDelete = async (document: Document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deleteResult = await deleteFromBackblaze(document.id, document.fileName);
              
              if (deleteResult.success) {
                setSnackbar('Document deleted successfully');
                await loadDocuments();
              } else {
                throw new Error(deleteResult.error || 'Delete failed');
              }
            } catch (err) {
              setSnackbar('Failed to delete document');
              console.error('Delete error:', err);
            }
          }
        }
      ]
    );
  };

  const resetUploadForm = () => {
    setUploadEmployee('');
    setUploadDocumentType('passport');
    setUploadFileName('');
    setUploadExpiryDate('');
    setUploadDocumentNumber('');
    setUploadIssuingAuthority('');
    setUploadNotes('');
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEmployee = selectedEmployee === '' || doc.employeeId === selectedEmployee;
    const matchesDocumentType = selectedDocumentType === 'all' || doc.documentType === selectedDocumentType;
    
    return matchesSearch && matchesEmployee && matchesDocumentType;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeIcon = (type: string): string => {
    switch (type) {
      case 'passport': return 'passport';
      case 'visa': return 'card-account-details';
      case 'emirates_id': return 'card-account-details-outline';
      case 'labor_card': return 'badge-account';
      case 'contract': return 'file-document';
      case 'salary_certificate': return 'cash';
      case 'bank_statement': return 'bank';
      case 'medical_certificate': return 'medical-bag';
      case 'certificate': return 'certificate';
      default: return 'file';
    }
  };

  const renderDocumentCard = (document: Document) => (
    <Card key={document.id} style={[styles.documentCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.documentInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
              {document.fileName}
            </Text>
            <TouchableOpacity onPress={() => router.push(`/(admin)/employees/${document.employeeId}`)}>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
                {document.employeeName}
              </Text>
            </TouchableOpacity>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {formatFileSize(document.fileSize)} • {document.uploadDate.toLocaleDateString()}
            </Text>
          </View>
          
          <IconButton
            icon={getDocumentTypeIcon(document.documentType)}
            size={32}
            iconColor={theme.colors.primary}
            style={[styles.documentTypeIcon, { backgroundColor: `${theme.colors.primary}20` }]}
          />
        </View>

        <View style={styles.documentDetails}>
          <Chip
            mode="outlined"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
            textStyle={{ color: theme.colors.primary, textTransform: 'capitalize' }}
          >
            {document.documentType.replace('_', ' ')}
          </Chip>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode="outlined"
          onPress={() => handleDownload(document)}
          icon="download"
          compact
        >
          Download
        </Button>
        <Button
          mode="text"
          onPress={() => handleDelete(document)}
          icon="delete"
          textColor={theme.colors.error}
          compact
        >
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderTableView = () => (
    <Surface style={[styles.tableContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Document</DataTable.Title>
          <DataTable.Title>Employee</DataTable.Title>
          <DataTable.Title>Type</DataTable.Title>
          <DataTable.Title>Size</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>

        {filteredDocuments.map((document) => (
          <DataTable.Row key={document.id}>
            <DataTable.Cell>
              <View>
                <Text style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  {document.fileName}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {document.uploadDate.toLocaleDateString()}
                </Text>
              </View>
            </DataTable.Cell>
            <DataTable.Cell onPress={() => router.push(`/(admin)/employees/${document.employeeId}`)}>
              <Text style={{ color: theme.colors.primary }}>
                {document.employeeName}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Chip
                mode="outlined"
                compact
                style={{ backgroundColor: `${theme.colors.primary}15` }}
                textStyle={{ color: theme.colors.primary, fontSize: 12, textTransform: 'capitalize' }}
              >
                {document.documentType.replace('_', ' ')}
              </Chip>
            </DataTable.Cell>
            <DataTable.Cell>
              {formatFileSize(document.fileSize)}
            </DataTable.Cell>
            <DataTable.Cell>
              <View style={styles.tableActions}>
                <IconButton
                  icon="download"
                  size={18}
                  onPress={() => handleDownload(document)}
                />
                <IconButton
                  icon="delete"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => handleDelete(document)}
                />
              </View>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </Surface>
  );

  const selectedEmployeeName = employees?.find(emp => emp.id === selectedEmployee)?.name || 'All Employees';

  return (
    <AdminLayout title="Documents" currentRoute="/admin/documents">
      <View style={styles.container}>
        {/* Header Controls */}
        <Surface style={[styles.headerControls, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Searchbar
            placeholder="Search documents by name, employee, or type..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <View style={styles.filterRow}>
            <View style={styles.filterControls}>
              <Menu
                visible={employeeMenuVisible}
                onDismiss={() => setEmployeeMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setEmployeeMenuVisible(true)}
                    icon="chevron-down"
                    style={styles.filterButton}
                  >
                    {selectedEmployeeName}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setSelectedEmployee('');
                    setEmployeeMenuVisible(false);
                  }}
                  title="All Employees"
                  leadingIcon={selectedEmployee === '' ? 'check' : undefined}
                />
                <Divider />
                {employees.map((employee) => (
                  <Menu.Item
                    key={employee.id}
                    onPress={() => {
                      setSelectedEmployee(employee.id);
                      setEmployeeMenuVisible(false);
                    }}
                    title={employee.name}
                    leadingIcon={selectedEmployee === employee.id ? 'check' : undefined}
                  />
                ))}
              </Menu>

              <Menu
                visible={documentTypeMenuVisible}
                onDismiss={() => setDocumentTypeMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setDocumentTypeMenuVisible(true)}
                    icon="chevron-down"
                    style={styles.filterButton}
                  >
                    {selectedDocumentType === 'all' ? 'All Types' : selectedDocumentType.replace('_', ' ')}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setSelectedDocumentType('all');
                    setDocumentTypeMenuVisible(false);
                  }}
                  title="All Types"
                  leadingIcon={selectedDocumentType === 'all' ? 'check' : undefined}
                />
                <Divider />
                {DOCUMENT_TYPES.map((type) => (
                  <Menu.Item
                    key={type}
                    onPress={() => {
                      setSelectedDocumentType(type);
                      setDocumentTypeMenuVisible(false);
                    }}
                    title={type.replace('_', ' ').toUpperCase()}
                    leadingIcon={selectedDocumentType === type ? 'check' : undefined}
                  />
                ))}
              </Menu>
            </View>

            <View style={styles.viewControls}>
              <IconButton
                icon={viewMode === 'grid' ? 'view-grid' : 'view-list'}
                selected={viewMode === 'grid'}
                onPress={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              />
            </View>
          </View>
        </Surface>

        {/* Content */}
        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
                Loading documents...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text variant="bodyMedium" style={{ color: theme.colors.error, textAlign: 'center' }}>
                {error}
              </Text>
              <Button mode="outlined" onPress={loadDocuments} style={{ marginTop: 16 }}>
                Retry
              </Button>
            </View>
          ) : filteredDocuments.length > 0 ? (
            viewMode === 'grid' ? (
              <View style={styles.documentsGrid}>
                {filteredDocuments.map(renderDocumentCard)}
              </View>
            ) : (
              renderTableView()
            )
          ) : (
            <View style={styles.emptyState}>
              <IconButton icon="file-document-multiple" size={64} iconColor={theme.colors.onSurfaceVariant} />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
                No documents found
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                {searchQuery || selectedEmployee || selectedDocumentType !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Upload your first document to get started'}
              </Text>
              <Button
                mode="contained"
                onPress={() => setUploadModalVisible(true)}
                style={{ marginTop: 24 }}
                icon="plus"
              >
                Upload Document
              </Button>
            </View>
          )}
        </ScrollView>

        {/* Upload FAB - Enhanced Enterprise Style */}
        <FAB
          icon="upload"
          style={[styles.fab, { 
            backgroundColor: theme.colors.primary,
            elevation: 4,
          }]}
          onPress={() => setUploadModalVisible(true)}
          label="Upload Document"
          size="large"
          mode="elevated"
          animated={true}
        />

        {/* Enhanced Upload Modal */}
        <Portal>
          <Modal
            visible={uploadModalVisible}
            onDismiss={() => setUploadModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={styles.modal} elevation={5}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <IconButton 
                    icon="upload" 
                    size={28} 
                    iconColor={theme.colors.primary}
                    style={styles.modalIcon}
                  />
                  <Text variant="headlineSmall" style={styles.modalTitle}>
                    Upload Document
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={() => setUploadModalVisible(false)}
                />
              </View>
              
              <Divider />
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Employee Selection - Enhanced */}
                <View style={styles.formGroup}>
                  <Text variant="titleSmall" style={styles.formLabel}>
                    Select Employee *
                  </Text>
                  <Menu
                    visible={false}
                    onDismiss={() => {}}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => {}}
                        style={styles.enhancedInput}
                        contentStyle={styles.enhancedButtonContent}
                        labelStyle={styles.enhancedButtonLabel}
                        icon="account"
                      >
                        {uploadEmployee ? employees.find(e => e.id === uploadEmployee)?.name : 'Select Employee'}
                      </Button>
                    }
                  >
                    {employees.map((employee) => (
                      <Menu.Item
                        key={employee.id}
                        onPress={() => setUploadEmployee(employee.id)}
                        title={employee.name}
                        titleStyle={styles.menuItemTitle}
                        leadingIcon="account"
                      />
                    ))}
                  </Menu>
                </View>

                {/* Document Type Selection - Enhanced */}
                <View style={styles.formGroup}>
                  <Text variant="titleSmall" style={styles.formLabel}>
                    Document Type *
                  </Text>
                  <Menu
                    visible={false}
                    onDismiss={() => {}}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => {}}
                        style={styles.enhancedInput}
                        contentStyle={styles.enhancedButtonContent}
                        labelStyle={styles.enhancedButtonLabel}
                        icon="file-document"
                      >
                        {uploadDocumentType.replace('_', ' ').toUpperCase()}
                      </Button>
                    }
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <Menu.Item
                        key={type}
                        onPress={() => setUploadDocumentType(type)}
                        title={type.replace('_', ' ').toUpperCase()}
                        titleStyle={styles.menuItemTitle}
                        leadingIcon={getDocumentTypeIcon(type)}
                      />
                    ))}
                  </Menu>
                </View>

                {/* Enhanced File Name Input */}
                <View style={styles.formGroup}>
                  <Text variant="titleSmall" style={styles.formLabel}>
                    File Name (Optional)
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={uploadFileName}
                    onChangeText={setUploadFileName}
                    placeholder="Enter custom file name..."
                    style={styles.enhancedTextInput}
                    left={<TextInput.Icon icon="file-document-edit" />}
                    contentStyle={styles.textInputContent}
                  />
                </View>

                {/* Enhanced Document Number Input */}
                <View style={styles.formGroup}>
                  <Text variant="titleSmall" style={styles.formLabel}>
                    Document Number
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={uploadDocumentNumber}
                    onChangeText={setUploadDocumentNumber}
                    placeholder="Enter document number..."
                    style={styles.enhancedTextInput}
                    left={<TextInput.Icon icon="identifier" />}
                    contentStyle={styles.textInputContent}
                  />
                </View>

                {/* Conditional Expiry Date - Enhanced */}
                {(uploadDocumentType === 'visa' || uploadDocumentType === 'passport' || uploadDocumentType === 'emirates_id') && (
                  <View style={styles.formGroup}>
                    <Text variant="titleSmall" style={styles.formLabel}>
                      Expiry Date *
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={uploadExpiryDate}
                      onChangeText={setUploadExpiryDate}
                      placeholder="YYYY-MM-DD"
                      style={styles.enhancedTextInput}
                      left={<TextInput.Icon icon="calendar" />}
                      contentStyle={styles.textInputContent}
                    />
                  </View>
                )}

                {/* Enhanced Issuing Authority Input */}
                <View style={styles.formGroup}>
                  <Text variant="titleSmall" style={styles.formLabel}>
                    Issuing Authority
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={uploadIssuingAuthority}
                    onChangeText={setUploadIssuingAuthority}
                    placeholder="Enter issuing authority..."
                    style={styles.enhancedTextInput}
                    left={<TextInput.Icon icon="office-building" />}
                    contentStyle={styles.textInputContent}
                  />
                </View>

                {/* Enhanced Notes Input */}
                <View style={styles.formGroup}>
                  <Text variant="titleSmall" style={styles.formLabel}>
                    Notes
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={uploadNotes}
                    onChangeText={setUploadNotes}
                    placeholder="Add any additional notes..."
                    multiline
                    numberOfLines={3}
                    style={styles.enhancedTextInput}
                    left={<TextInput.Icon icon="note-text" />}
                    contentStyle={styles.textInputContent}
                  />
                </View>
              </ScrollView>

              {/* Enhanced Modal Actions */}
              <Divider />
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setUploadModalVisible(false)}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonLabel}
                  contentStyle={styles.modalButtonContent}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUpload}
                  loading={uploading}
                  disabled={!uploadEmployee || uploading}
                  style={styles.uploadButton}
                  labelStyle={styles.uploadButtonLabel}
                  contentStyle={styles.modalButtonContent}
                  icon="upload"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>

        <Snackbar
          visible={!!snackbar}
          onDismiss={() => setSnackbar('')}
          duration={3000}
        >
          {snackbar}
        </Snackbar>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerControls: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterControls: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  filterButton: {
    marginRight: 8,
  },
  viewControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  documentsGrid: {
    gap: 16,
    paddingBottom: 100,
  },
  documentCard: {
    borderRadius: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTypeIcon: {
    marginLeft: 8,
    borderRadius: 16,
  },
  documentDetails: {
    marginTop: 8,
  },
  tableContainer: {
    borderRadius: 12,
    paddingBottom: 100,
  },
  tableActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    padding: 24,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalContent: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontWeight: 'bold',
  },
  enhancedInput: {
    marginBottom: 8,
  },
  enhancedButtonContent: {
    paddingHorizontal: 12,
  },
  enhancedButtonLabel: {
    fontWeight: 'bold',
  },
  menuItemTitle: {
    fontWeight: 'bold',
  },
  enhancedTextInput: {
    marginBottom: 8,
  },
  textInputContent: {
    paddingHorizontal: 12,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  cancelButtonLabel: {
    fontWeight: 'bold',
  },
  modalButtonContent: {
    padding: 16,
  },
  uploadButton: {
    flex: 1,
  },
  uploadButtonLabel: {
    fontWeight: 'bold',
  },
}); 

