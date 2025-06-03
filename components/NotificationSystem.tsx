// 🔔 Enhanced Notification System for CUBS Enterprise HR Platform
// Automated visa reminders, custom email templates, and real-time alerts

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import {
  Text,
  Card,
  Surface,
  IconButton,
  Button,
  Switch,
  TextInput,
  Chip,
  Portal,
  Modal,
  List,
  Divider,
  ProgressBar,
  Badge,
  RadioButton,
  Checkbox,
} from 'react-native-paper';
import { useEnhancedTheme, useResponsive } from './EnhancedThemeProvider';
import { ENHANCED_DESIGN_SYSTEM } from '../theme/enhancedDesignSystem';
import { useEmployees } from '../hooks/useEmployees';
import { Employee } from '../types/employee';

// Notification types
interface NotificationRule {
  id: string;
  name: string;
  type: 'visa_expiry' | 'document_upload' | 'employee_status' | 'custom';
  enabled: boolean;
  triggers: {
    daysBeforeExpiry?: number;
    conditions?: string[];
  };
  recipients: string[];
  template: string;
  frequency: 'once' | 'daily' | 'weekly';
  lastSent?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  type: 'visa_reminder' | 'welcome' | 'status_change' | 'custom';
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'visa-reminder-30',
    name: 'Visa Expiry - 30 Days',
    subject: 'Visa Renewal Required - {{employee_name}}',
    content: `Dear {{employee_name}},

This is a reminder that your visa will expire on {{visa_expiry_date}}, which is in {{days_remaining}} days.

Please ensure you start the renewal process immediately to avoid any complications.

Employee Details:
- Employee ID: {{employee_id}}
- Company: {{company_name}}
- Trade: {{trade}}
- Current Status: {{status}}

If you need assistance with the renewal process, please contact HR immediately.

Best regards,
CUBS HR Team`,
    variables: ['employee_name', 'visa_expiry_date', 'days_remaining', 'employee_id', 'company_name', 'trade', 'status'],
    type: 'visa_reminder',
  },
  {
    id: 'visa-reminder-7',
    name: 'Urgent Visa Expiry - 7 Days',
    subject: 'URGENT: Visa Expires in {{days_remaining}} Days - {{employee_name}}',
    content: `URGENT NOTICE

Dear {{employee_name}},

Your visa will expire in just {{days_remaining}} days ({{visa_expiry_date}}).

This requires IMMEDIATE ACTION. Please contact HR today to ensure your visa renewal is processed before expiry.

Failure to renew your visa on time may result in:
- Legal complications
- Work authorization issues
- Potential deportation

Contact HR immediately at: hr@cubs.com

Best regards,
CUBS HR Team`,
    variables: ['employee_name', 'visa_expiry_date', 'days_remaining', 'employee_id', 'company_name', 'trade'],
    type: 'visa_reminder',
  },
];

const DEFAULT_RULES: NotificationRule[] = [
  {
    id: 'visa-30-days',
    name: 'Visa Expiry - 30 Days Notice',
    type: 'visa_expiry',
    enabled: true,
    triggers: { daysBeforeExpiry: 30 },
    recipients: ['employee', 'hr@cubs.com'],
    template: 'visa-reminder-30',
    frequency: 'once',
  },
  {
    id: 'visa-7-days',
    name: 'Urgent Visa Expiry - 7 Days Notice',
    type: 'visa_expiry',
    enabled: true,
    triggers: { daysBeforeExpiry: 7 },
    recipients: ['employee', 'hr@cubs.com', 'admin@cubs.com'],
    template: 'visa-reminder-7',
    frequency: 'daily',
  },
];

// Template editor component
interface TemplateEditorProps {
  template: EmailTemplate | null;
  visible: boolean;
  onSave: (template: EmailTemplate) => void;
  onDismiss: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  visible,
  onSave,
  onDismiss,
}) => {
  const { colors } = useEnhancedTheme();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    setEditingTemplate(template);
  }, [template]);

  const handleSave = () => {
    if (editingTemplate) {
      onSave(editingTemplate);
    }
  };

  const insertVariable = (variable: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      content: editingTemplate.content + `{{${variable}}}`,
    });
  };

  const availableVariables = [
    'employee_name', 'employee_id', 'visa_expiry_date', 'days_remaining',
    'company_name', 'trade', 'status', 'join_date', 'email_id',
  ];

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
        <Surface style={styles.templateEditor} elevation={4}>
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall" style={{ color: colors.onSurface, fontWeight: 'bold' }}>
              {template?.id ? 'Edit Template' : 'Create Template'}
            </Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          <ScrollView style={styles.templateForm}>
            <TextInput
              label="Template Name"
              value={editingTemplate?.name || ''}
              onChangeText={(text) => 
                setEditingTemplate(prev => prev ? { ...prev, name: text } : null)
              }
              mode="outlined"
              style={styles.formInput}
            />

            <TextInput
              label="Email Subject"
              value={editingTemplate?.subject || ''}
              onChangeText={(text) => 
                setEditingTemplate(prev => prev ? { ...prev, subject: text } : null)
              }
              mode="outlined"
              style={styles.formInput}
            />

            <Text variant="titleMedium" style={{ color: colors.onSurface, marginTop: 16, marginBottom: 8 }}>
              Available Variables
            </Text>
            <View style={styles.variableChips}>
              {availableVariables.map((variable) => (
                <Chip
                  key={variable}
                  onPress={() => insertVariable(variable)}
                  style={styles.variableChip}
                  icon="plus"
                >
                  {variable}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Email Content"
              value={editingTemplate?.content || ''}
              onChangeText={(text) => 
                setEditingTemplate(prev => prev ? { ...prev, content: text } : null)
              }
              mode="outlined"
              multiline
              numberOfLines={10}
              style={[styles.formInput, styles.contentInput]}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={onDismiss} style={styles.cancelButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.saveButton, { backgroundColor: colors.primary[500] }]}
            >
              Save Template
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

// Main notification system component
export const NotificationSystem: React.FC = () => {
  const { colors } = useEnhancedTheme();
  const { isMobile } = useResponsive();
  const { employees } = useEmployees();

  const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'analytics'>('rules');
  const [isSending, setIsSending] = useState(false);

  // Calculate notification analytics
  const analytics = useMemo(() => {
    if (!employees) return null;

    const today = new Date();
    const employeesNeedingNotification = employees.filter(emp => {
      if (!emp.visa_expiry_date) return false;
      const expiryDate = new Date(emp.visa_expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    const urgentNotifications = employeesNeedingNotification.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date!);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7;
    });

    return {
      totalPending: employeesNeedingNotification.length,
      urgent: urgentNotifications.length,
      normal: employeesNeedingNotification.length - urgentNotifications.length,
      enabledRules: rules.filter(rule => rule.enabled).length,
      totalRules: rules.length,
    };
  }, [employees, rules]);

  // Send notifications manually
  const sendNotifications = useCallback(async () => {
    if (!employees) return;

    setIsSending(true);
    try {
      const today = new Date();
      let notificationsSent = 0;

      for (const rule of rules.filter(r => r.enabled)) {
        if (rule.type === 'visa_expiry' && rule.triggers.daysBeforeExpiry) {
          const targetDate = new Date(today.getTime() + (rule.triggers.daysBeforeExpiry * 24 * 60 * 60 * 1000));
          
          const matchingEmployees = employees.filter(emp => {
            if (!emp.visa_expiry_date) return false;
            const expiryDate = new Date(emp.visa_expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 1000));
            return Math.abs(daysUntilExpiry - rule.triggers.daysBeforeExpiry!) <= 1;
          });

          notificationsSent += matchingEmployees.length;
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Notifications Sent',
        `Successfully sent ${notificationsSent} notifications.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send notifications. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [employees, rules]);

  const handleRuleToggle = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleTemplateEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleTemplateSave = (template: EmailTemplate) => {
    setTemplates(prev => {
      const existingIndex = prev.findIndex(t => t.id === template.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = template;
        return updated;
      } else {
        return [...prev, { ...template, id: `template-${Date.now()}` }];
      }
    });
    setShowTemplateEditor(false);
    setSelectedTemplate(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineMedium" style={{ color: colors.onSurface, fontWeight: 'bold' }}>
              Notification System
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              Automated alerts and custom email templates
            </Text>
          </View>
          <Button
            mode="contained"
            icon="send"
            onPress={sendNotifications}
            loading={isSending}
            style={[styles.sendButton, { backgroundColor: colors.primary[500] }]}
          >
            Send Now
          </Button>
        </View>
      </Surface>

      {/* Analytics Cards */}
      {analytics && (
        <View style={styles.analyticsGrid}>
          <Card style={[styles.analyticsCard, { backgroundColor: colors.surface }]} elevation={2}>
            <Card.Content>
              <View style={styles.analyticsHeader}>
                <IconButton
                  icon="bell-alert"
                  size={24}
                  iconColor={colors.warning[500]}
                />
                <Badge
                  size={20}
                  style={{ backgroundColor: colors.warning[500] }}
                >
                  {analytics.urgent}
                </Badge>
              </View>
              <Text variant="displaySmall" style={{ color: colors.warning[500], fontWeight: 'bold' }}>
                {analytics.totalPending}
              </Text>
              <Text variant="titleMedium" style={{ color: colors.onSurface }}>
                Pending Notifications
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {analytics.urgent} urgent, {analytics.normal} normal
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.analyticsCard, { backgroundColor: colors.surface }]} elevation={2}>
            <Card.Content>
              <View style={styles.analyticsHeader}>
                <IconButton
                  icon="cog"
                  size={24}
                  iconColor={colors.info[500]}
                />
              </View>
              <Text variant="displaySmall" style={{ color: colors.info[500], fontWeight: 'bold' }}>
                {analytics.enabledRules}
              </Text>
              <Text variant="titleMedium" style={{ color: colors.onSurface }}>
                Active Rules
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {analytics.totalRules} total configured
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Tab Navigation */}
      <Surface style={[styles.tabContainer, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.tabs}>
          {[
            { key: 'rules', label: 'Notification Rules', icon: 'bell-cog' },
            { key: 'templates', label: 'Email Templates', icon: 'email-edit' },
            { key: 'analytics', label: 'Analytics', icon: 'chart-line' },
          ].map((tab) => (
            <Button
              key={tab.key}
              mode={activeTab === tab.key ? 'contained' : 'outlined'}
              icon={tab.icon}
              onPress={() => setActiveTab(tab.key as any)}
              style={styles.tabButton}
              compact
            >
              {tab.label}
            </Button>
          ))}
        </View>
      </Surface>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'rules' && (
          <View style={styles.rulesSection}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: 'bold' }}>
                Notification Rules
              </Text>
              <Button
                mode="outlined"
                icon="plus"
                onPress={() => {/* Add new rule */}}
                style={styles.addButton}
              >
                Add Rule
              </Button>
            </View>

            {rules.map((rule) => (
              <Card key={rule.id} style={[styles.ruleCard, { backgroundColor: colors.surface }]} elevation={2}>
                <Card.Content>
                  <View style={styles.ruleHeader}>
                    <View style={styles.ruleInfo}>
                      <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                        {rule.name}
                      </Text>
                      <Chip
                        icon={rule.type === 'visa_expiry' ? 'passport' : 'cog'}
                        style={[styles.ruleTypeChip, { backgroundColor: colors.primaryContainer }]}
                      >
                        {rule.type.replace('_', ' ')}
                      </Chip>
                    </View>
                    <Switch
                      value={rule.enabled}
                      onValueChange={() => handleRuleToggle(rule.id)}
                      color={colors.primary[500]}
                    />
                  </View>

                  <View style={styles.ruleDetails}>
                    <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                      Triggers: {rule.triggers.daysBeforeExpiry} days before expiry
                    </Text>
                    <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                      Recipients: {rule.recipients.join(', ')}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                      Frequency: {rule.frequency}
                    </Text>
                  </View>

                  <View style={styles.ruleActions}>
                    <Button mode="outlined" icon="pencil" onPress={() => {/* Edit rule */}}>
                      Edit
                    </Button>
                    <Button mode="outlined" icon="play" onPress={() => {/* Test rule */}}>
                      Test
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {activeTab === 'templates' && (
          <View style={styles.templatesSection}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: 'bold' }}>
                Email Templates
              </Text>
              <Button
                mode="outlined"
                icon="plus"
                onPress={() => {
                  setSelectedTemplate({
                    id: '',
                    name: '',
                    subject: '',
                    content: '',
                    variables: [],
                    type: 'custom',
                  });
                  setShowTemplateEditor(true);
                }}
                style={styles.addButton}
              >
                Create Template
              </Button>
            </View>

            {templates.map((template) => (
              <Card key={template.id} style={[styles.templateCard, { backgroundColor: colors.surface }]} elevation={2}>
                <Card.Content>
                  <View style={styles.templateHeader}>
                    <View>
                      <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                        {template.name}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                        {template.subject}
                      </Text>
                    </View>
                    <Chip
                      icon="email"
                      style={[styles.templateTypeChip, { backgroundColor: colors.secondaryContainer }]}
                    >
                      {template.type.replace('_', ' ')}
                    </Chip>
                  </View>

                  <Text
                    variant="bodySmall"
                    style={{ color: colors.onSurfaceVariant, marginTop: 8 }}
                    numberOfLines={3}
                  >
                    {template.content}
                  </Text>

                  <View style={styles.templateActions}>
                    <Button
                      mode="outlined"
                      icon="eye"
                      onPress={() => {/* Preview template */}}
                    >
                      Preview
                    </Button>
                    <Button
                      mode="outlined"
                      icon="pencil"
                      onPress={() => handleTemplateEdit(template)}
                    >
                      Edit
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.analyticsSection}>
            <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: 'bold', marginBottom: 16 }}>
              Notification Analytics
            </Text>
            
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 }}>
              Analytics features coming soon...
            </Text>
          </View>
        )}
      </View>

      {/* Template Editor Modal */}
      <TemplateEditor
        template={selectedTemplate}
        visible={showTemplateEditor}
        onSave={handleTemplateSave}
        onDismiss={() => {
          setShowTemplateEditor(false);
          setSelectedTemplate(null);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ENHANCED_DESIGN_SYSTEM.themes.light.background,
  },
  header: {
    padding: ENHANCED_DESIGN_SYSTEM.spacing[6],
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sendButton: {
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  analyticsGrid: {
    flexDirection: 'row',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
    gap: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  analyticsCard: {
    flex: 1,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  tabContainer: {
    margin: ENHANCED_DESIGN_SYSTEM.spacing[4],
    marginTop: 0,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  tabs: {
    flexDirection: 'row',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  tabButton: {
    flex: 1,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  tabContent: {
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  addButton: {
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  rulesSection: {
    gap: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  ruleCard: {
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[3],
  },
  ruleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  ruleTypeChip: {
    height: 24,
  },
  ruleDetails: {
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[4],
    gap: ENHANCED_DESIGN_SYSTEM.spacing[1],
  },
  ruleActions: {
    flexDirection: 'row',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  templatesSection: {
    gap: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  templateCard: {
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  templateTypeChip: {
    height: 24,
  },
  templateActions: {
    flexDirection: 'row',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[2],
    marginTop: ENHANCED_DESIGN_SYSTEM.spacing[3],
  },
  analyticsSection: {
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  modalContainer: {
    margin: ENHANCED_DESIGN_SYSTEM.spacing[4],
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
    maxHeight: '90%',
  },
  templateEditor: {
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[6],
    paddingBottom: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  templateForm: {
    paddingHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[6],
    maxHeight: 400,
  },
  formInput: {
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  contentInput: {
    minHeight: 120,
  },
  variableChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[2],
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  variableChip: {
    height: 28,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[6],
    paddingTop: ENHANCED_DESIGN_SYSTEM.spacing[4],
    gap: ENHANCED_DESIGN_SYSTEM.spacing[3],
  },
  cancelButton: {
    flex: 1,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  saveButton: {
    flex: 1,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
});

export default NotificationSystem; 