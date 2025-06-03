// 🔍 Global Search Component for CUBS Enterprise HR Platform
// Advanced search with filters, shortcuts, and quick access

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform, FlatList, Pressable } from 'react-native';
import {
  Text,
  Searchbar,
  Portal,
  Modal,
  Surface,
  IconButton,
  Chip,
  Divider,
  List,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useEnhancedTheme } from './EnhancedThemeProvider';
import { ENHANCED_DESIGN_SYSTEM } from '../theme/enhancedDesignSystem';
import { useEmployees } from '../hooks/useEmployees';

// Search result types
interface SearchResult {
  id: string;
  type: 'employee' | 'company' | 'trade' | 'document' | 'action';
  title: string;
  subtitle?: string;
  description?: string;
  icon: string;
  route?: string;
  action?: () => void;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

// Search categories
const SEARCH_CATEGORIES = {
  employees: { label: 'Employees', icon: 'account-group', color: '#2563EB' },
  companies: { label: 'Companies', icon: 'domain', color: '#059669' },
  trades: { label: 'Trades', icon: 'hammer-wrench', color: '#DC2626' },
  documents: { label: 'Documents', icon: 'file-document', color: '#7C3AED' },
  actions: { label: 'Quick Actions', icon: 'lightning-bolt', color: '#EA580C' },
};

// Quick actions
const QUICK_ACTIONS: SearchResult[] = [
  {
    id: 'add-employee',
    type: 'action',
    title: 'Add New Employee',
    subtitle: 'Create employee profile',
    icon: 'account-plus',
    route: '/(admin)/employees/add',
    tags: ['add', 'create', 'new', 'employee'],
    priority: 'high',
  },
  {
    id: 'send-reminders',
    type: 'action',
    title: 'Send Visa Reminders',
    subtitle: 'Send expiry notifications',
    icon: 'email-send',
    route: '/(admin)/notifications',
    tags: ['visa', 'reminder', 'notification', 'email'],
    priority: 'high',
  },
  {
    id: 'export-data',
    type: 'action',
    title: 'Export Employee Data',
    subtitle: 'Download reports',
    icon: 'file-export',
    tags: ['export', 'download', 'report', 'data'],
    priority: 'medium',
  },
];

interface GlobalSearchProps {
  visible: boolean;
  onDismiss: () => void;
  placeholder?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  visible,
  onDismiss,
  placeholder = 'Search employees, companies, actions...',
}) => {
  const { theme, colors } = useEnhancedTheme();
  const { employees } = useEmployees();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchInputRef = useRef<any>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setSelectedCategory('all');
    }
  }, [visible]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (!visible) {
          // Trigger search modal open (would be handled by parent)
        }
      }
      
      // Escape to close
      if (event.key === 'Escape' && visible) {
        onDismiss();
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onDismiss]);

  // Search function with debouncing
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(QUICK_ACTIONS);
        return;
      }

      setIsSearching(true);
      
      try {
        const searchResults: SearchResult[] = [];
        const normalizedQuery = searchQuery.toLowerCase().trim();

        // Search employees
        if (employees && (selectedCategory === 'all' || selectedCategory === 'employees')) {
          const employeeResults = employees
            .filter(emp => 
              emp.name?.toLowerCase().includes(normalizedQuery) ||
              emp.email_id?.toLowerCase().includes(normalizedQuery) ||
              emp.company_name?.toLowerCase().includes(normalizedQuery) ||
              emp.trade?.toLowerCase().includes(normalizedQuery) ||
              emp.employee_id?.toLowerCase().includes(normalizedQuery)
            )
            .slice(0, 10)
            .map(emp => ({
              id: emp.id,
              type: 'employee' as const,
              title: emp.name || 'Unknown',
              subtitle: emp.email_id || '',
              description: `${emp.company_name || 'No Company'} • ${emp.trade || 'No Trade'}`,
              icon: 'account',
              route: `/(admin)/employees/${emp.id}`,
              tags: [emp.name, emp.company_name, emp.trade, emp.email_id].filter(Boolean),
              priority: emp.is_active ? ('high' as const) : ('low' as const),
            }));
          
          searchResults.push(...employeeResults);
        }

        // Search companies
        if (selectedCategory === 'all' || selectedCategory === 'companies') {
          const companies = employees ? [...new Set(employees.map(emp => emp.company_name).filter(Boolean))] : [];
          const companyResults = companies
            .filter(company => company.toLowerCase().includes(normalizedQuery))
            .slice(0, 5)
            .map(company => ({
              id: `company-${company}`,
              type: 'company' as const,
              title: company,
              subtitle: `${employees?.filter(emp => emp.company_name === company).length || 0} employees`,
              icon: 'domain',
              route: `/(admin)/employees?company=${encodeURIComponent(company)}`,
              tags: [company],
              priority: 'medium' as const,
            }));
          
          searchResults.push(...companyResults);
        }

        // Search trades
        if (selectedCategory === 'all' || selectedCategory === 'trades') {
          const trades = employees ? [...new Set(employees.map(emp => emp.trade).filter(Boolean))] : [];
          const tradeResults = trades
            .filter(trade => trade.toLowerCase().includes(normalizedQuery))
            .slice(0, 5)
            .map(trade => ({
              id: `trade-${trade}`,
              type: 'trade' as const,
              title: trade,
              subtitle: `${employees?.filter(emp => emp.trade === trade).length || 0} employees`,
              icon: 'hammer-wrench',
              route: `/(admin)/employees?trade=${encodeURIComponent(trade)}`,
              tags: [trade],
              priority: 'medium' as const,
            }));
          
          searchResults.push(...tradeResults);
        }

        // Search quick actions
        if (selectedCategory === 'all' || selectedCategory === 'actions') {
          const actionResults = QUICK_ACTIONS.filter(action =>
            action.title.toLowerCase().includes(normalizedQuery) ||
            action.subtitle?.toLowerCase().includes(normalizedQuery) ||
            action.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
          );
          
          searchResults.push(...actionResults);
        }

        // Sort results by priority and relevance
        searchResults.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority || 'low'];
          const bPriority = priorityOrder[b.priority || 'low'];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          // Secondary sort by title match
          const aExactMatch = a.title.toLowerCase().startsWith(normalizedQuery);
          const bExactMatch = b.title.toLowerCase().startsWith(normalizedQuery);
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          
          return 0;
        });

        setResults(searchResults.slice(0, 20)); // Limit to 20 results
        
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [employees, selectedCategory]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    // Add to recent searches
    if (query.trim()) {
      setRecentSearches(prev => {
        const updated = [query, ...prev.filter(q => q !== query)].slice(0, 5);
        return updated;
      });
    }

    // Execute action or navigate
    if (result.action) {
      result.action();
    } else if (result.route) {
      router.push(result.route as any);
    }

    onDismiss();
  };

  // Result item component
  const renderResult = ({ item: result }: { item: SearchResult }) => {
    const categoryConfig = SEARCH_CATEGORIES[result.type as keyof typeof SEARCH_CATEGORIES];
    
    return (
      <Pressable
        onPress={() => handleResultSelect(result)}
        style={({ pressed }) => [
          styles.resultItem,
          {
            backgroundColor: pressed 
              ? theme === 'light' ? colors.primary[50] : colors.primary[900]
              : 'transparent',
          }
        ]}
      >
        <View style={styles.resultIcon}>
          <IconButton
            icon={result.icon}
            size={20}
            iconColor={categoryConfig?.color || colors.primary[500]}
            style={{ margin: 0 }}
          />
        </View>
        
        <View style={styles.resultContent}>
          <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
            {result.title}
          </Text>
          {result.subtitle && (
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {result.subtitle}
            </Text>
          )}
          {result.description && (
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
              {result.description}
            </Text>
          )}
        </View>
        
        <View style={styles.resultMeta}>
          <Badge
            size={16}
            style={{
              backgroundColor: categoryConfig?.color + '20',
              color: categoryConfig?.color,
            }}
          >
            {result.type}
          </Badge>
        </View>
      </Pressable>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.surface }
        ]}
      >
        <Surface style={[styles.searchContainer, { backgroundColor: colors.surface }]} elevation={4}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <Searchbar
              ref={searchInputRef}
              placeholder={placeholder}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchBar, { backgroundColor: colors.surfaceVariant }]}
              inputStyle={{ color: colors.onSurface }}
              iconColor={colors.onSurfaceVariant}
              elevation={0}
              autoFocus
            />
            
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              iconColor={colors.onSurfaceVariant}
            />
          </View>

          {/* Category Filters */}
          <View style={styles.categoryFilters}>
            <Chip
              selected={selectedCategory === 'all'}
              onPress={() => setSelectedCategory('all')}
              style={styles.categoryChip}
              textStyle={{ fontSize: 12 }}
            >
              All
            </Chip>
            {Object.entries(SEARCH_CATEGORIES).map(([key, category]) => (
              <Chip
                key={key}
                selected={selectedCategory === key}
                onPress={() => setSelectedCategory(key)}
                icon={category.icon}
                style={styles.categoryChip}
                textStyle={{ fontSize: 12 }}
              >
                {category.label}
              </Chip>
            ))}
          </View>

          <Divider style={{ marginVertical: 8 }} />

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary[500]} />
                <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginLeft: 12 }}>
                  Searching...
                </Text>
              </View>
            ) : results.length > 0 ? (
              <FlatList
                data={results}
                renderItem={renderResult}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.resultsList}
              />
            ) : query.trim() ? (
              <View style={styles.emptyState}>
                <IconButton
                  icon="magnify"
                  size={32}
                  iconColor={colors.onSurfaceVariant}
                />
                <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                  No results found for "{query}"
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                  Try adjusting your search terms
                </Text>
              </View>
            ) : (
              <View style={styles.quickActions}>
                <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: 12 }}>
                  Quick Actions
                </Text>
                <FlatList
                  data={QUICK_ACTIONS}
                  renderItem={renderResult}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.searchFooter}>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {Platform.OS === 'web' ? '↵ to select • ⌘K to search • ESC to close' : 'Tap to select'}
            </Text>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

// Global search hook for keyboard shortcuts
export const useGlobalSearch = () => {
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchVisible(true);
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return {
    searchVisible,
    openSearch: () => setSearchVisible(true),
    closeSearch: () => setSearchVisible(false),
  };
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
    maxHeight: '80%',
  },
  searchContainer: {
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
    overflow: 'hidden',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
    paddingBottom: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  searchBar: {
    flex: 1,
    marginRight: ENHANCED_DESIGN_SYSTEM.spacing[2],
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  categoryFilters: {
    flexDirection: 'row',
    paddingHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[4],
    paddingBottom: ENHANCED_DESIGN_SYSTEM.spacing[2],
    flexWrap: 'wrap',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  categoryChip: {
    height: 28,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.full,
  },
  resultsContainer: {
    maxHeight: 400,
    paddingHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ENHANCED_DESIGN_SYSTEM.spacing[3],
    paddingHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[2],
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.md,
    marginVertical: 2,
  },
  resultIcon: {
    marginRight: ENHANCED_DESIGN_SYSTEM.spacing[3],
  },
  resultContent: {
    flex: 1,
  },
  resultMeta: {
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[8],
  },
  quickActions: {
    paddingVertical: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  searchFooter: {
    alignItems: 'center',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
    paddingTop: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
});

export default GlobalSearch; 