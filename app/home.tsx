// app/home.tsx - VERSÃO ATUALIZADA COM CONFIGURAÇÕES
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { Header } from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';
import { auth } from '../services/firebase';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const handleLogout = async () => {
    closeMenu();
    Alert.alert(
      'Confirmar Saída',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              Alert.alert(t('common.success'), 'Logout realizado com sucesso!');
              router.replace('/login');
            } catch (error) {
              Alert.alert(t('common.error'), 'Erro ao fazer logout');
              console.error('Erro no logout:', error);
            }
          },
        },
      ]
    );
  };

  const openMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth * 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
    });
  };

  const navigateAndCloseMenu = (route: string) => {
    closeMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const renderMenuButton = () => (
    <TouchableOpacity
      style={styles.headerMenuButton}
      onPress={openMenu}
      activeOpacity={0.7}
    >
      <Ionicons name="menu" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  const menuItems = [
    {
      icon: 'home',
      title: t('menu.home'),
      description: 'Tela principal',
      route: '/home',
    },
    {
      icon: 'car',
      title: t('menu.myCars'),
      description: 'Gerenciar veículos cadastrados',
      route: '/carros',
    },
    {
      icon: 'add-circle',
      title: t('menu.addVehicle'),
      description: 'Adicionar novo veículo',
      route: '/cadastrar-carro',
    },
    {
      icon: 'location',
      title: t('menu.location'),
      description: 'Ver localização dos veículos',
      route: '/localizacao',
    },
    {
      icon: 'warning',
      title: t('menu.stolenVehicles'),
      description: 'Consultar base de dados',
      route: '/veiculosroubados',
    },
    {
      icon: 'person',
      title: t('menu.profile'),
      description: 'Configurações da conta',
      route: '/perfil',
    },
    {
      icon: 'settings',
      title: t('menu.settings'),
      description: 'Configurações do aplicativo',
      route: '/configuracoes',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerMenuButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.full,
      padding: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    welcomeSection: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xxl,
    },
    title: {
      fontSize: theme.fontSize.header,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    quickAccessTitle: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    menuContainer: {
      flex: 1,
      marginBottom: theme.spacing.xxl,
    },
    menuButton: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    menuButtonText: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    menuButtonDescription: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },

    // Estilos do Menu Lateral
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sideMenu: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: screenWidth * 0.8,
      backgroundColor: theme.colors.background,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: -2,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    menuHeader: {
      backgroundColor: theme.colors.primary,
      paddingTop: theme.spacing.xxl,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
    },
    menuTitle: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: '#FFFFFF',
      marginBottom: theme.spacing.xs,
    },
    menuSubtitle: {
      fontSize: theme.fontSize.sm,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    menuContent: {
      flex: 1,
      paddingTop: theme.spacing.lg,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuIcon: {
      marginRight: theme.spacing.md,
      width: 24,
      alignItems: 'center',
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    menuItemDescription: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    menuFooter: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    menuLogoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.error,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    menuLogoutText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
      marginLeft: theme.spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <Header 
        title="TrackCar" 
        rightComponent={renderMenuButton()}
      />

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>

        <Text style={styles.quickAccessTitle}>{t('home.quickAccess')}</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => router.push('/carros')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuButtonText}>🚗 {t('menu.myCars')}</Text>
            <Text style={styles.menuButtonDescription}>
              Gerenciar veículos cadastrados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => router.push('/localizacao')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuButtonText}>📍 {t('menu.location')}</Text>
            <Text style={styles.menuButtonDescription}>
              Ver localização dos veículos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => router.push('/veiculosroubados')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuButtonText}>🚨 {t('menu.stolenVehicles')}</Text>
            <Text style={styles.menuButtonDescription}>
              Consultar base de dados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuButtonText}>⚙️ {t('menu.settings')}</Text>
            <Text style={styles.menuButtonDescription}>
              Configurações do aplicativo
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Menu Lateral */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View 
              style={[styles.overlay, { opacity: overlayOpacity }]} 
            />
          </TouchableWithoutFeedback>

          <Animated.View 
            style={[
              styles.sideMenu, 
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>TrackCar</Text>
              <Text style={styles.menuSubtitle}>Menu de Navegação</Text>
            </View>

            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => navigateAndCloseMenu(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.menuFooter}>
              <TouchableOpacity
                style={styles.menuLogoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.menuLogoutText}>{t('menu.logout')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}