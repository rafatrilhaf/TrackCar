// app/configuracoes.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { language, t, setLanguage } = useLanguage();

  const languageOptions = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.selectLanguage'),
      '',
      [
        ...languageOptions.map(option => ({
          text: `${option.flag} ${option.name}`,
          onPress: () => {
            setLanguage(option.code as any);
            Alert.alert(
              t('common.success'),
              `Idioma alterado para ${option.name}`
            );
          },
        })),
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleEditTranslations = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'A funcionalidade de editar traduções será implementada em breve.',
      [{ text: 'OK' }]
    );
  };

  const currentLanguageName = languageOptions.find(l => l.code === language)?.name || 'Português';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionHeader: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    sectionContent: {
      padding: theme.spacing.lg,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    optionDescription: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    optionValue: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    },
    optionIcon: {
      marginLeft: theme.spacing.sm,
    },
    comingSoonBadge: {
      backgroundColor: theme.colors.warning,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs,
    },
    comingSoonText: {
      fontSize: theme.fontSize.xs,
      color: '#FFFFFF',
      fontWeight: theme.fontWeight.medium,
    },
  });

  return (
    <View style={styles.container}>
      <Header 
        title={t('settings.title')}
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção de Configurações de Idioma */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('settings.languageSettings')}
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
            {/* Idioma Atual */}
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleLanguageChange}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('settings.currentLanguage')}
                </Text>
                <Text style={styles.optionDescription}>
                  Alterar idioma do aplicativo
                </Text>
                <Text style={styles.optionValue}>
                  {currentLanguageName}
                </Text>
              </View>
              <View style={styles.optionIcon}>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>

            {/* Editar Traduções */}
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleEditTranslations}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('settings.editTranslations')}
                </Text>
                <Text style={styles.optionDescription}>
                  Personalizar textos do aplicativo
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>EM BREVE</Text>
                </View>
              </View>
              <View style={styles.optionIcon}>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção para futuras configurações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Outras Configurações
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
            <View style={styles.optionButton}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  Notificações
                </Text>
                <Text style={styles.optionDescription}>
                  Configurar alertas e notificações
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>EM BREVE</Text>
                </View>
              </View>
            </View>

            <View style={styles.optionButton}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  Tema
                </Text>
                <Text style={styles.optionDescription}>
                  Modo claro/escuro
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>EM BREVE</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}