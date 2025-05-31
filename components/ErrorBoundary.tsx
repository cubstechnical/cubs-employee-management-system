import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text variant="headlineSmall" style={styles.title}>
                  Something went wrong
                </Text>
                <Text variant="bodyMedium" style={styles.message}>
                  An unexpected error occurred. Please try refreshing the app.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => this.setState({ hasError: false, error: undefined })}
                  style={styles.button}
                >
                  Try Again
                </Button>
              </Card.Content>
            </Card>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24, // spacing.lg
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  cardContent: {
    alignItems: 'center',
    padding: 24, // spacing.lg
  },
  title: {
    textAlign: 'center',
    marginBottom: 16, // spacing.md
    color: '#dd1a51',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24, // spacing.lg
    color: '#666666',
  },
  button: {
    marginTop: 8, // spacing.sm
  },
});

export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, send to error reporting service
        console.error('Global error caught:', { error, errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary; 
