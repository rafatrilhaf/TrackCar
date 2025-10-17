// contexts/LanguageContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface Translation {
  [key: string]: string | Translation;
}

interface LanguageContextType {
  language: Language;
  translations: Translation;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const defaultTranslations: Record<Language, Translation> = {
  pt: {
    // Traduções em português (base)
    common: {
      home: 'Início',
      settings: 'Configurações',
      language: 'Idioma',
      save: 'Salvar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      back: 'Voltar',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
    },
    menu: {
      home: 'Início',
      myCars: 'Meus Carros',
      addVehicle: 'Cadastrar Veículo',
      location: 'Localização',
      stolenVehicles: 'Veículos Roubados',
      profile: 'Perfil',
      settings: 'Configurações',
      logout: 'Sair da Conta',
    },
    home: {
      title: 'Bem-vindo ao TrackCar',
      subtitle: 'Sistema de Monitoramento Veicular',
      quickAccess: 'Acesso Rápido',
    },
    settings: {
      title: 'Configurações',
      languageSettings: 'Configurações de Idioma',
      editTranslations: 'Editar Traduções',
      currentLanguage: 'Idioma Atual',
      selectLanguage: 'Selecionar Idioma',
    },
  },
  en: {
    // Traduções em inglês
    common: {
      home: 'Home',
      settings: 'Settings',
      language: 'Language',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    menu: {
      home: 'Home',
      myCars: 'My Cars',
      addVehicle: 'Add Vehicle',
      location: 'Location',
      stolenVehicles: 'Stolen Vehicles',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
    },
    home: {
      title: 'Welcome to TrackCar',
      subtitle: 'Vehicle Monitoring System',
      quickAccess: 'Quick Access',
    },
    settings: {
      title: 'Settings',
      languageSettings: 'Language Settings',
      editTranslations: 'Edit Translations',
      currentLanguage: 'Current Language',
      selectLanguage: 'Select Language',
    },
  },
  es: {
    // Traduções em espanhol
    common: {
      home: 'Inicio',
      settings: 'Configuraciones',
      language: 'Idioma',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      back: 'Volver',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
    },
    menu: {
      home: 'Inicio',
      myCars: 'Mis Coches',
      addVehicle: 'Agregar Vehículo',
      location: 'Ubicación',
      stolenVehicles: 'Vehículos Robados',
      profile: 'Perfil',
      settings: 'Configuraciones',
      logout: 'Cerrar Sesión',
    },
    home: {
      title: 'Bienvenido a TrackCar',
      subtitle: 'Sistema de Monitoreo Vehicular',
      quickAccess: 'Acceso Rápido',
    },
    settings: {
      title: 'Configuraciones',
      languageSettings: 'Configuraciones de Idioma',
      editTranslations: 'Editar Traducciones',
      currentLanguage: 'Idioma Actual',
      selectLanguage: 'Seleccionar Idioma',
    },
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  translations: defaultTranslations.pt,
  setLanguage: () => {},
  t: () => '',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('pt');
  const [translations, setTranslations] = useState<Translation>(defaultTranslations.pt);

  // Função para buscar traduções do AsyncStorage ou usar padrão
  const loadTranslations = async (lang: Language) => {
    try {
      const storedTranslations = await AsyncStorage.getItem(`translations_${lang}`);
      if (storedTranslations) {
        const parsed = JSON.parse(storedTranslations);
        setTranslations(parsed);
      } else {
        setTranslations(defaultTranslations[lang]);
      }
    } catch (error) {
      console.error('Erro ao carregar traduções:', error);
      setTranslations(defaultTranslations[lang]);
    }
  };

  // Função para definir idioma
  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', lang);
      setLanguageState(lang);
      await loadTranslations(lang);
    } catch (error) {
      console.error('Erro ao salvar idioma:', error);
    }
  };

  // Função para traduzir (t)
  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = translations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return key; // Retorna a chave se não encontrar tradução
      }
    }

    return typeof current === 'string' ? current : key;
  };

  // Carregar idioma salvo na inicialização
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('selectedLanguage') as Language;
        if (savedLanguage && ['pt', 'en', 'es'].includes(savedLanguage)) {
          setLanguageState(savedLanguage);
          await loadTranslations(savedLanguage);
        }
      } catch (error) {
        console.error('Erro ao carregar idioma salvo:', error);
      }
    };

    loadSavedLanguage();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, translations, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};