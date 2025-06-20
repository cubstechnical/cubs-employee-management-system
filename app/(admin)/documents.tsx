import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, Alert, StyleSheet, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  Surface,
  ActivityIndicator,
  Searchbar,
  Card,
  FAB,
  Portal,
  Modal,
  TextInput,
  Snackbar,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import AdminLayout from '../../components/AdminLayout';
import { useEmployees } from '../../hooks/useEmployees';
import { documentService } from '../../services/documentService';

// Type definitions
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

interface CompanyFolder {
  name: string;
  employees: EmployeeFolder[];
  documentCount: number;
  totalSize: number;
}

interface EmployeeFolder {
  id: string;
  name: string;
  trade: string;
  documents: Document[];
  documentCount: number;
  totalSize: number;
}

interface CustomFolder {
  id: string;
  name: string;
  parentId: string | null;
  type: 'custom' | 'employee' | 'company';
  documents: Document[];
  subfolders: CustomFolder[];
  documentCount: number;
  totalSize: number;
  createdAt: Date;
}

const CONSISTENT_COLORS = {
  primary: '#1976D2',
  secondary: '#DC004E',
  success: '#388E3C',
  warning: '#F57C00',
  error: '#D32F2F',
  info: '#0288D1',
  folder: '#FFB74D',
  document: '#42A5F5',
};

function AdminDocumentsScreen() {
  const theme = useTheme();
  const { employees, refreshEmployees, isLoading: employeesLoading } = useEmployees();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Navigation and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  
  // Custom folder management
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Performance optimization states
  const [documentCache, setDocumentCache] = useState<Map<string, Document[]>>(new Map());

  useEffect(() => {
    // Only load documents if employees are available
    if (employees && employees.length > 0) {
    loadDocuments();
    }
  }, [employees]);

  useEffect(() => {
    // Initial fetch for employees if the store is empty
    if (!employees || employees.length === 0) {
      refreshEmployees();
    }
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    setDocuments([]);
    setDocumentCache(new Map());
    
    try {
      if (!employees || employees.length === 0) {
        setLoading(false);
        return;
      }

      console.log(`📄 [DOCS] Loading documents from Supabase employee_documents table`);
      
      // Load all documents from Supabase employee_documents table
      const supabaseDocuments = await documentService.getAllDocuments();
      console.log(`📄 [DOCS] Found ${supabaseDocuments.length} documents in database`);
      
      const allDocuments: Document[] = [];
      const newCache = new Map<string, Document[]>();
      
      // Convert Supabase documents to our Document interface
      const processedDocuments = supabaseDocuments.map((doc) => {
        const employee = employees.find(e => e.employee_id === doc.employee_id);
        return {
          id: doc.id,
          employeeId: doc.employee_id,
          employeeName: employee?.name || 'Unknown Employee',
          fileName: doc.file_name,
          documentType: doc.document_type || 'document',
          uploadDate: new Date(doc.created_at),
          fileSize: doc.file_size || 0,
          url: doc.file_url,
        };
      });

      // Build cache
      processedDocuments.forEach(doc => {
        const employeeId = doc.employeeId;
        if (!newCache.has(employeeId)) {
          newCache.set(employeeId, []);
        }
        newCache.get(employeeId)!.push(doc);
        allDocuments.push(doc);
      });
      
      setDocuments(allDocuments);
      setDocumentCache(newCache);
      
    } catch (error) {
      console.error('📄 [DOCS] Error loading documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEmployees();
      await loadDocuments();
    } catch (error) {
      console.error('Refresh error:', error);
      setSnackbar('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'file-pdf-box';
      case 'doc':
      case 'docx': return 'file-word-box';
      case 'xls':
      case 'xlsx': return 'file-excel-box';
      case 'ppt':
      case 'pptx': return 'file-powerpoint-box';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp': return 'file-image';
      case 'zip':
      case 'rar':
      case '7z': return 'file-archive';
      case 'txt': return 'file-document-outline';
      default: return 'file';
    }
  };

  // Organize documents by company and employee
  const companyFolders = useMemo(() => {
    const companies = [...new Set(employees.map(e => e.company_name).filter(Boolean))];
    return companies.map(companyName => {
      const companyEmployees = employees.filter(e => e.company_name === companyName);
      const employeeFolders = companyEmployees.map(employee => {
        const employeeDocs = documentCache.get(employee.employee_id || '') || [];
        return {
          id: employee.employee_id || '', name: employee.name, trade: employee.trade,
          documents: employeeDocs, documentCount: employeeDocs.length,
          totalSize: employeeDocs.reduce((acc, doc) => acc + (doc.fileSize || 0), 0),
        };
      });
      return {
        name: companyName, employees: employeeFolders,
        documentCount: employeeFolders.reduce((acc, ef) => acc + ef.documentCount, 0),
        totalSize: employeeFolders.reduce((acc, ef) => acc + ef.totalSize, 0),
      };
    });
  }, [employees, documentCache]);

  const getCurrentViewData = () => {
    if (!currentFolder) {
      // Root view - show company folders and custom folders
      const filteredCompanies = companyFolders.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const filteredCustomFolders = customFolders.filter(folder => 
        folder.parentId === null && 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { folders: [...filteredCompanies, ...filteredCustomFolders], documents: [] };
    }
    
    // Check if current folder is a company
    const company = companyFolders.find(c => c.name === currentFolder);
    if (company) {
      const filteredEmployees = company.employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { folders: filteredEmployees, documents: [] };
    }
    
    // Check if current folder is an employee
    const allEmployees = companyFolders.flatMap(c => c.employees);
    const employee = allEmployees.find(e => e.id === currentFolder);
    if (employee) {
      const filteredDocs = employee.documents.filter(doc => 
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { folders: [], documents: filteredDocs };
    }
    
    // Custom folder
    const customFolder = customFolders.find(f => f.id === currentFolder);
    if (customFolder) {
      const filteredDocs = customFolder.documents.filter(doc => 
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const filteredSubfolders = customFolder.subfolders.filter(folder => 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { folders: filteredSubfolders, documents: filteredDocs };
    }
    
    return { folders: [], documents: [] };
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setBreadcrumb(prev => [...prev, folderName]);
    setCurrentFolder(folderId);
  };

  const navigateBack = () => {
    if (breadcrumb.length > 0) {
      const newBreadcrumb = [...breadcrumb];
      newBreadcrumb.pop();
      setBreadcrumb(newBreadcrumb);
      
      if (newBreadcrumb.length === 0) {
        setCurrentFolder(null);
      } else {
        // Navigate to parent folder - this is simplified logic
        setCurrentFolder(null); // For now, just go back to root
      }
    }
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      setSnackbar('Folder name cannot be empty');
      return;
    }
    const newFolder: CustomFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: currentFolder,
      type: 'custom',
      documents: [],
      subfolders: [],
      documentCount: 0,
      totalSize: 0,
      createdAt: new Date(),
    };
    setCustomFolders(prev => [...prev, newFolder]);
    setNewFolderModalVisible(false);
    setNewFolderName('');
    setSnackbar(`Folder "${newFolderName}" created successfully`);
  };

  const renderCompanyTile = (company: CompanyFolder) => (
    <TouchableOpacity 
      key={company.name}
      style={[styles.tile, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigateToFolder(company.name, company.name)}
    >
      <View style={styles.tileContent}>
        <View style={styles.tileIcon}>
          <IconButton
            icon="folder-multiple"
            size={48}
            iconColor={CONSISTENT_COLORS.folder}
            style={{ backgroundColor: CONSISTENT_COLORS.folder + '15' }}
          />
        </View>
        <Text variant="titleSmall" style={[styles.tileName, { color: theme.colors.onSurface }]} numberOfLines={3} ellipsizeMode="tail">
          {company.name}
        </Text>
        <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
          {company.employees.length} employees
        </Text>
        <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
          {company.documentCount} documents
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmployeeTile = (employee: EmployeeFolder) => (
      <TouchableOpacity 
        key={employee.id}
        style={[styles.tile, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigateToFolder(employee.id, employee.name)}
      >
        <View style={styles.tileContent}>
          <View style={styles.tileIcon}>
            <IconButton
              icon="folder-account"
              size={48}
              iconColor={CONSISTENT_COLORS.folder}
              style={{ backgroundColor: CONSISTENT_COLORS.folder + '15' }}
            />
          </View>
          <Text variant="titleSmall" style={[styles.tileName, { color: theme.colors.onSurface }]} numberOfLines={3} ellipsizeMode="tail">
            {employee.name}
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
            {employee.trade}
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
          {employee.documentCount} documents
          </Text>
        </View>
      </TouchableOpacity>
    );

  const renderDocumentTile = (document: Document) => {
    const fileIcon = getFileIcon(document.fileName);
    
    return (
      <TouchableOpacity 
        key={document.id}
        style={[styles.tile, { backgroundColor: theme.colors.surface }]}
        onPress={() => {
          // Handle document opening
          setSnackbar(`Opening ${document.fileName}`);
        }}
      >
        <View style={styles.tileContent}>
          <View style={styles.tileIcon}>
            <IconButton
              icon={fileIcon}
              size={48}
              iconColor={CONSISTENT_COLORS.document}
              style={{ backgroundColor: CONSISTENT_COLORS.document + '15' }}
            />
          </View>
          <Text variant="titleSmall" style={[styles.tileName, { color: theme.colors.onSurface }]} numberOfLines={3} ellipsizeMode="tail">
            {document.fileName}
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
            {document.employeeName}
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
            {formatFileSize(document.fileSize)}
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
            {document.uploadDate.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCustomFolderTile = (folder: CustomFolder) => (
      <TouchableOpacity 
        key={folder.id}
      style={[styles.tile, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigateToFolder(folder.id, folder.name)}
      >
        <View style={styles.tileContent}>
          <View style={styles.tileIcon}>
            <IconButton
              icon="folder"
              size={48}
              iconColor={CONSISTENT_COLORS.folder}
              style={{ backgroundColor: CONSISTENT_COLORS.folder + '15' }}
            />
          </View>
          <Text variant="titleSmall" style={[styles.tileName, { color: theme.colors.onSurface }]} numberOfLines={3} ellipsizeMode="tail">
            {folder.name}
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
            {folder.documentCount} documents
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
            {formatFileSize(folder.totalSize)}
          </Text>
          <Text variant="bodySmall" style={[styles.tileInfo, { color: theme.colors.onSurfaceVariant }]}>
            {folder.createdAt.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );

  const renderBreadcrumb = () => {
    if (breadcrumb.length === 0) return null;
    
    return (
      <View style={styles.breadcrumbContainer}>
        <TouchableOpacity onPress={() => { setCurrentFolder(null); setBreadcrumb([]); }}>
          <Text style={styles.breadcrumbItem}>Documents</Text>
        </TouchableOpacity>
        {breadcrumb.map((item, index) => (
          <React.Fragment key={index}>
            <Text style={styles.breadcrumbSeparator}> / </Text>
            <Text style={styles.breadcrumbItem}>{item}</Text>
          </React.Fragment>
        ))}
            </View>
    );
  };

  const { folders, documents: currentDocuments } = getCurrentViewData();

  return (
    <AdminLayout title="Documents" currentRoute="/admin/documents">
      <View style={styles.container}>
        <Surface style={styles.headerSurface} elevation={2}>
            <Searchbar
            placeholder="Search..."
              onChangeText={setSearchQuery}
              value={searchQuery}
            style={styles.searchbar}
          />
          {renderBreadcrumb()}
          {breadcrumb.length > 0 && (
            <Button
              mode="outlined"
                onPress={navigateBack}
              icon="arrow-left"
                style={styles.backButton}
            >
              Back
            </Button>
          )}
        </Surface>

        <View style={{flex: 1}}>
          {loading ? (
            <ActivityIndicator animating={true} style={{ flex: 1, justifyContent: 'center' }} />
          ) : (
            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
              {(folders.length === 0 && currentDocuments.length === 0) && !loading ? (
                        <View style={styles.emptyState}>
                  <Text>No items found.</Text>
                        </View>
                      ) : (
                <View style={styles.gridContainer}>
                  {folders.map(item => {
                    if ('employees' in item) {
                      return renderCompanyTile(item as CompanyFolder);
                    } else if ('trade' in item) {
                      return renderEmployeeTile(item as EmployeeFolder);
                    } else {
                      return renderCustomFolderTile(item as CustomFolder);
                    }
                  })}
                  {currentDocuments.map(doc => renderDocumentTile(doc))}
                        </View>
                      )}
            </ScrollView>
          )}
                          </View>

        <Portal>
          <FAB
            icon="folder-plus"
            style={styles.fab}
            onPress={() => setNewFolderModalVisible(true)}
            label="New Folder"
          />
        </Portal>

        <Portal>
          <Modal visible={newFolderModalVisible} onDismiss={() => setNewFolderModalVisible(false)} contentContainerStyle={styles.modalContainerStyle}>
              <Card style={styles.modalCardStyle}>
                <Card.Title title="Create New Folder" />
                <Card.Content>
                <TextInput
                    label="Folder Name" 
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  mode="outlined"
                  />
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => setNewFolderModalVisible(false)}>Cancel</Button>
                  <Button onPress={createNewFolder} mode="contained">Create</Button>
                </Card.Actions>
              </Card>
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
    backgroundColor: '#f5f5f5',
  },
  headerSurface: { padding: 12, backgroundColor: 'white' },
  searchbar: { marginBottom: 12 },
  breadcrumbContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  breadcrumbItem: { 
    fontSize: 14, 
    color: '#1976D2',
    fontWeight: '500',
  },
  breadcrumbSeparator: { 
    fontSize: 14, 
    color: '#666',
    marginHorizontal: 4,
  },
  backButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  content: { flex: 1 },
  gridContainer: { 
    flexDirection: 'row',
    flexWrap: 'wrap', 
    padding: 16,
    justifyContent: 'space-around',
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 200 },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: CONSISTENT_COLORS.primary,
  },
  modalContainerStyle: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCardStyle: { width: '90%', maxWidth: 500 },
  tile: {
    width: 170,
    height: 220,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
    marginRight: 16,
  },
  tileContent: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileIcon: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 13,
    lineHeight: 18,
    height: 54, // Fixed height for 3 lines
    paddingHorizontal: 4,
  },
  tileInfo: {
    textAlign: 'center',
    marginBottom: 3,
    fontSize: 11,
    lineHeight: 14,
    paddingHorizontal: 2,
  },
});

export default AdminDocumentsScreen;