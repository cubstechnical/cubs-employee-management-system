import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth';
import { EmployeeDocument } from '../../services/supabase';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';

export default function EmployeeDocumentsScreen() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    if (user) loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }
    
    try {
    setLoading(true);
    setError(null);
      const docs = await documentService.getDocumentsByEmployee(user.id);
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: EmployeeDocument) => {
    try {
      await documentService.downloadDocument(doc);
      setSnackbar('Download started!');
    } catch (err) {
      setSnackbar('Failed to download document');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: safeThemeAccess.colors(theme, 'background'),
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 24,
      backgroundColor: safeThemeAccess.colors(theme, 'surface'),
    },
    headerTitle: {
      color: safeThemeAccess.colors(theme, 'onSurface'),
    },
    headerSubtitle: {
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
    },
    content: {
      padding: 24,
    },
    documentCard: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      borderRadius: safeThemeAccess.borderRadius(theme, 'large'),
    },
    fab: {
      position: 'absolute',
      margin: safeThemeAccess.spacing(theme, 'md'),
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      right: 0,
      bottom: 0,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: safeThemeAccess.colors(theme, 'background'),
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text variant="headlineMedium" style={styles.header}>My Documents</Text>
        {loading ? (
          <ActivityIndicator style={styles.loadingContainer} />
        ) : error ? (
          <Text style={styles.content}>{error}</Text>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} style={styles.documentCard}>
              <Card.Title title={doc.file_name} subtitle={doc.document_type} />
              <Card.Content>
                <Text>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => handleDownload(doc)}>Download</Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')}>{snackbar}</Snackbar>
    </SafeAreaView>
  );
} 
