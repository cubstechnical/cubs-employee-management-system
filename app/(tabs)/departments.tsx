import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Avatar, Button, Searchbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Building2, Plus } from 'lucide-react-native';
import { CustomTheme } from '../../theme';

export default function DepartmentsScreen() {
  const departments = [
    {
      id: 1,
      name: 'Engineering',
      manager: 'Sarah Wilson',
      employeeCount: 45,
      description: 'Software development and technical operations',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    },
    {
      id: 2,
      name: 'Sales',
      manager: 'Michael Chen',
      employeeCount: 32,
      description: 'Global sales and business development',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    },
    {
      id: 3,
      name: 'Marketing',
      manager: 'Emma Rodriguez',
      employeeCount: 28,
      description: 'Brand management and marketing strategies',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop',
    },
    {
      id: 4,
      name: 'Human Resources',
      manager: 'James Thompson',
      employeeCount: 15,
      description: 'Employee relations and recruitment',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop',
    },
    {
      id: 5,
      name: 'Finance',
      manager: 'Lisa Wang',
      employeeCount: 20,
      description: 'Financial planning and accounting',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=50&h=50&fit=crop',
    },
  ];

  const [searchValue, setSearchValue] = useState('');
  const theme = useTheme() as CustomTheme;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Departments</Text>
          <Searchbar
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Search departments"
            style={{ marginBottom: 16, backgroundColor: theme.colors.surface, elevation: 2 }}
          />
          <Button
            mode="contained"
            onPress={() => {}}
            style={styles.addButton}
            icon={({ size, color }) => <Plus size={size} color={color} />}
          >
            Add Department
          </Button>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <View>
                <Text variant="titleMedium">Total Departments</Text>
                <Text variant="displaySmall" style={styles.statsNumber}>5</Text>
              </View>
              <Building2 size={24} color="#666" />
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <View>
                <Text variant="titleMedium">Total Employees</Text>
                <Text variant="displaySmall" style={styles.statsNumber}>140</Text>
              </View>
              <Users size={24} color="#666" />
            </Card.Content>
          </Card>
        </View>

        {departments.map((department) => (
          <Card key={department.id} style={styles.departmentCard}>
            <Card.Content>
              <View style={styles.departmentHeader}>
                <View style={styles.departmentInfo}>
                  <Avatar.Image
                    size={50}
                    source={{ uri: department.avatar }}
                  />
                  <View style={styles.departmentText}>
                    <Text variant="titleLarge">{department.name}</Text>
                    <Text variant="bodyMedium" style={styles.managerText}>
                      Manager: {department.manager}
                    </Text>
                  </View>
                </View>
                <View style={styles.employeeCount}>
                  <Users size={16} color="#666" />
                  <Text variant="bodyMedium" style={styles.countText}>
                    {department.employeeCount}
                  </Text>
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.description}>
                {department.description}
              </Text>
              <View style={styles.cardActions}>
                <Button
                  mode="outlined"
                  onPress={() => {}}
                  style={styles.actionButton}
                >
                  View Details
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {}}
                  style={styles.actionButton}
                >
                  Edit
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    elevation: 0,
  },
  addButton: {
    backgroundColor: '#dd1a51',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statsCard: {
    flex: 1,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsNumber: {
    color: '#dd1a51',
    fontWeight: 'bold',
  },
  departmentCard: {
    margin: 16,
    marginTop: 8,
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  departmentText: {
    marginLeft: 16,
  },
  managerText: {
    color: '#666',
    marginTop: 4,
  },
  employeeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  countText: {
    marginLeft: 8,
    color: '#666',
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
