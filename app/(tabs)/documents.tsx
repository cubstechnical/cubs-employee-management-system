import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Searchbar, FAB, Portal, Modal, List, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { EmployeeDocument } from '../../services/supabase';

interface EmployeeDocumentMock {
  id: string;
  file_name: string;
  document_type: string;
  employee_id: string;
  expiry_date: string;
  file_url: string;
  document_number: string;
  issuing_authority: string;
  notes?: string;
  status: 'active' | 'expired' | 'pending' | 'expiring_soon';
}

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('All');
  const [documents, setDocuments] = useState<EmployeeDocumentMock[]>([
    {
      id: '1',
      file_name: 'Emirates ID',
      document_type: 'emirates_id',
      employee_id: 'EMP001',
      expiry_date: '2025-12-31',
      file_url: 'https://example.com/emirates_id.pdf',
      document_number: '784-2023-1234567-8',
      issuing_authority: 'Emirates ID Authority',
      notes: 'Primary ID document',
      status: 'active',
    },
    {
      id: '2',
      file_name: 'Work Permit',
      document_type: 'work_permit',
      employee_id: 'EMP002',
      expiry_date: '2024-06-30',
      file_url: 'https://example.com/work_permit.pdf',
      document_number: 'WP-2023-789012',
      issuing_authority: 'Ministry of Human Resources and Emiratisation',
      notes: 'Construction work permit',
      status: 'active',
    },
    {
      id: '3',
      file_name: 'Health Card',
      document_type: 'health_card',
      employee_id: 'EMP003',
      expiry_date: '2024-03-15',
      file_url: 'https://example.com/health_card.pdf',
      document_number: 'HC-2023-345678',
      issuing_authority: 'Ministry of Health',
      notes: 'Medical screening required for renewal',
      status: 'expiring_soon',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocumentMock | null>(null);

  const locations = ['All', 'Dubai', 'Abu Dhabi', 'Qatar'];
  const documentTypes = [
    'All',
    'Passport',
    'Visa',
    'Work Permit',
    'Emirates ID',
    'Health Card',
    'Insurance',
    'Trade License',
  ];

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // TODO: Implement actual file upload
        console.log('Document selected:', result);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleDownloadDocument = async (document: EmployeeDocumentMock) => {
    try {
      // TODO: Implement actual file download
      console.log('Downloading document:', document);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleDeleteDocument = async (document: EmployeeDocumentMock) => {
    try {
      // TODO: Implement actual file deletion
      setDocuments(documents.filter(doc => doc.id !== document.id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const getStatusColor = (status: EmployeeDocumentMock['status']) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'expired':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      case 'expiring_soon':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.issuing_authority.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = selectedLocation === 'All' || doc.employee_id.includes(selectedLocation);
    const matchesType = selectedDocumentType === 'All' || doc.document_type === selectedDocumentType.toLowerCase().replace(' ', '_');
    
    return matchesSearch && matchesLocation && matchesType;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Documents</Text>
          {user?.role === 'admin' && (
            <Button
              mode="contained"
              onPress={handleUploadDocument}
              style={styles.uploadButton}
            >
              Upload Document
            </Button>
          )}
          <Searchbar
            placeholder="Search documents"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          {locations.map((location) => (
            <Button
              key={location}
              mode={selectedLocation === location ? 'contained' : 'outlined'}
              onPress={() => setSelectedLocation(location)}
              style={styles.filterChip}
            >
              {location}
            </Button>
          ))}
        </ScrollView>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          {documentTypes.map((type) => (
            <Button
              key={type}
              mode={selectedDocumentType === type ? 'contained' : 'outlined'}
              onPress={() => setSelectedDocumentType(type)}
              style={styles.filterChip}
            >
              {type}
            </Button>
          ))}
        </ScrollView>

        {filteredDocuments.map((document) => (
          <Card key={document.id} style={styles.documentCard}>
            <Card.Content>
              <View style={styles.documentHeader}>
                <View>
                  <Text variant="titleMedium">{document.file_name}</Text>
                </View>
                <View style={styles.documentActions}>
                  <IconButton
                    icon="download"
                    size={20}
                    onPress={() => handleDownloadDocument(document)}
                  />
                  {user?.role === 'admin' && (
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteDocument(document)}
                    />
                  )}
                </View>
              </View>
              <View style={styles.documentDetails}>
                <Text variant="bodySmall">Type: {document.document_type.replace('_', ' ').toUpperCase()}</Text>
                <Text variant="bodySmall">Document Number: {document.document_number}</Text>
                <Text variant="bodySmall">Issuing Authority: {document.issuing_authority}</Text>
                <Text variant="bodySmall">Expiry Date: {document.expiry_date}</Text>
                <Text
                  variant="bodySmall"
                  style={[styles.status, { color: getStatusColor(document.status) }]}
                >
                  Status: {document.status.replace('_', ' ').toUpperCase()}
                </Text>
                {document.notes && (
                  <Text variant="bodySmall" style={styles.notes}>
                    Notes: {document.notes}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          {selectedDocument && (
            <View>
              <Text variant="headlineSmall">Document Details</Text>
              <Text>Name: {selectedDocument.file_name}</Text>
              <Text>Employee: {selectedDocument.employee_id}</Text>
              <Text>Type: {selectedDocument.document_type.replace('_', ' ').toUpperCase()}</Text>
              <Text>Document Number: {selectedDocument.document_number}</Text>
              <Text>Issuing Authority: {selectedDocument.issuing_authority}</Text>
              <Text>Expiry Date: {selectedDocument.expiry_date}</Text>
              <Text>Status: {selectedDocument.status.replace('_', ' ').toUpperCase()}</Text>
              {selectedDocument.notes && (
                <Text>Notes: {selectedDocument.notes}</Text>
              )}
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    marginBottom: 16,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  documentCard: {
    margin: 8,
    marginTop: 0,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentActions: {
    flexDirection: 'row',
  },
  documentDetails: {
    marginTop: 8,
  },
  status: {
    fontWeight: 'bold',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  notes: {
    marginTop: 8,
  },
});
