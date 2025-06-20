import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  Searchbar,
  Chip,
  Menu,
  Button,
  Text,
  Surface,
  IconButton,
  Portal,
  Modal,
  Divider,
  Switch,
  List,
  Checkbox,
} from 'react-native-paper';
import { getDeviceInfo, getResponsiveSpacing, performanceUtils } from '../utils/mobileUtils';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface SearchFilters {
  company: string[];
  visaStatus: string[];
  nationality: string[];
  trade: string[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

interface EnhancedSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filterOptions: {
    companies: FilterOption[];
    visaStatuses: FilterOption[];
    nationalities: FilterOption[];
    trades: FilterOption[];
  };
  placeholder?: string;
  showFilterCount?: boolean;
  onClearAll?: () => void;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  filterOptions,
  placeholder = "Search employees...",
  showFilterCount = true,
  onClearAll,
}) => {
  const { isPhone } = getDeviceInfo();
  const spacing = getResponsiveSpacing('md');
  
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Debounced search to improve performance
  const debouncedSearch = useMemo(
    () => performanceUtils.debounce(onSearchChange, 300),
    [onSearchChange]
  );

  const handleSearchChange = (text: string) => {
    debouncedSearch(text);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return (
      filters.company.length +
      filters.visaStatus.length +
      filters.nationality.length +
      filters.trade.length +
      (filters.dateRange?.start || filters.dateRange?.end ? 1 : 0)
    );
  }, [filters]);

  // Quick filters for common use cases
  const quickFilters = [
    {
      label: 'Expiring Soon',
      action: () => onFiltersChange({
        ...filters,
        visaStatus: ['EXPIRY']
      })
    },
    {
      label: 'Active Visas',
      action: () => onFiltersChange({
        ...filters,
        visaStatus: ['ACTIVE']
      })
    },
    {
      label: 'Inactive',
      action: () => onFiltersChange({
        ...filters,
        visaStatus: ['INACTIVE']
      })
    },
  ];

  const updateFilter = (filterType: keyof SearchFilters, value: string, checked: boolean) => {
    const currentValues = filters[filterType] as string[];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    onFiltersChange({
      ...filters,
      [filterType]: newValues,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      company: [],
      visaStatus: [],
      nationality: [],
      trade: [],
      dateRange: { start: null, end: null },
    });
    onClearAll?.();
  };

  const renderFilterMenu = (
    filterType: keyof typeof filterOptions,
    title: string,
    selectedValues: string[]
  ) => {
    const options = filterOptions[filterType];
    
    return (
      <Menu
        visible={activeMenu === filterType}
        onDismiss={() => setActiveMenu(null)}
        anchor={
          <Chip
            mode="outlined"
            selected={selectedValues.length > 0}
            onPress={() => setActiveMenu(filterType)}
            icon={selectedValues.length > 0 ? "check" : "chevron-down"}
            style={[
              styles.filterChip,
              selectedValues.length > 0 && styles.selectedFilterChip
            ]}
          >
            {title} {selectedValues.length > 0 && `(${selectedValues.length})`}
          </Chip>
        }
        contentStyle={styles.menuContent}
      >
        <View style={styles.menuHeader}>
          <Text variant="titleSmall">{title}</Text>
          {selectedValues.length > 0 && (
            <Button
              mode="text"
              compact
              onPress={() => {
                onFiltersChange({
                  ...filters,
                  [filterType === 'companies' ? 'company' :
                   filterType === 'visaStatuses' ? 'visaStatus' :
                   filterType === 'nationalities' ? 'nationality' : 'trade']: []
                });
              }}
            >
              Clear
            </Button>
          )}
        </View>
        <Divider />
        
        {options.map((option) => {
          const filterKey = filterType === 'companies' ? 'company' :
                            filterType === 'visaStatuses' ? 'visaStatus' :
                            filterType === 'nationalities' ? 'nationality' : 'trade';
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <List.Item
              key={option.value}
              title={option.label}
              description={option.count ? `${option.count} employees` : undefined}
              left={() => (
                <Checkbox
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => updateFilter(filterKey, option.value, !isSelected)}
                />
              )}
              onPress={() => updateFilter(filterKey, option.value, !isSelected)}
              style={styles.menuItem}
            />
          );
        })}
      </Menu>
    );
  };

  return (
    <Surface style={[styles.container, { padding: spacing }]} elevation={1}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={placeholder}
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={[
            styles.searchBar,
            searchFocused && styles.searchBarFocused,
            isPhone && styles.searchBarMobile
          ]}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          iconColor="#666"
          inputStyle={styles.searchInput}
          elevation={0}
        />
        
        <IconButton
          icon="filter-variant"
          mode={activeFilterCount > 0 ? "contained" : "outlined"}
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggle}
        />
      </View>

      {/* Quick Filters */}
      {!isPhone && (
        <View style={styles.quickFilters}>
          {quickFilters.map((filter, index) => (
            <Chip
              key={index}
              mode="outlined"
              onPress={filter.action}
              style={styles.quickFilterChip}
              compact
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      )}

      {/* Filter Controls */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text variant="titleSmall">Filters</Text>
            {activeFilterCount > 0 && (
              <Button
                mode="text"
                onPress={clearAllFilters}
                compact
              >
                Clear All ({activeFilterCount})
              </Button>
            )}
          </View>

          <View style={styles.filterChips}>
            {renderFilterMenu('companies', 'Company', filters.company)}
            {renderFilterMenu('visaStatuses', 'Visa Status', filters.visaStatus)}
            {renderFilterMenu('nationalities', 'Nationality', filters.nationality)}
            {renderFilterMenu('trades', 'Trade', filters.trade)}
          </View>
        </View>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFilters}>
          <Text variant="bodySmall" style={styles.activeFiltersLabel}>
            Active Filters:
          </Text>
          <View style={styles.activeFiltersList}>
            {filters.company.map(company => (
              <Chip
                key={`company-${company}`}
                mode="flat"
                onClose={() => updateFilter('company', company, false)}
                style={styles.activeFilterChip}
                compact
              >
                {company}
              </Chip>
            ))}
            {filters.visaStatus.map(status => (
              <Chip
                key={`visa-${status}`}
                mode="flat"
                onClose={() => updateFilter('visaStatus', status, false)}
                style={styles.activeFilterChip}
                compact
              >
                {status}
              </Chip>
            ))}
            {filters.nationality.map(nationality => (
              <Chip
                key={`nationality-${nationality}`}
                mode="flat"
                onClose={() => updateFilter('nationality', nationality, false)}
                style={styles.activeFilterChip}
                compact
              >
                {nationality}
              </Chip>
            ))}
            {filters.trade.map(trade => (
              <Chip
                key={`trade-${trade}`}
                mode="flat"
                onClose={() => updateFilter('trade', trade, false)}
                style={styles.activeFilterChip}
                compact
              >
                {trade}
              </Chip>
            ))}
          </View>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    elevation: 0,
  },
  searchBarFocused: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBarMobile: {
    height: 48,
  },
  searchInput: {
    fontSize: 16,
  },
  filterToggle: {
    margin: 0,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  quickFilterChip: {
    height: 32,
  },
  filtersContainer: {
    marginTop: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginBottom: 4,
  },
  selectedFilterChip: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  menuContent: {
    maxHeight: 300,
    minWidth: 200,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  menuItem: {
    paddingVertical: 4,
  },
  activeFilters: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  activeFiltersLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeFilterChip: {
    height: 28,
    marginBottom: 4,
  },
});

export default EnhancedSearch; 