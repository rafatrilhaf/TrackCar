// app/cadastrar-carro.tsx - COM HEADER GLOBAL (SEM BOTÃO NO HEADER)
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CarPhotoSelector } from '../components/CarPhotoSelector';
import { Header } from '../components/Header';
import { useTheme } from '../hooks/useTheme';
import {
  checkLicensePlateExists,
  createCar,
  uploadAndSaveCarPhoto,
} from '../services/carService';
import {
  CAR_BRANDS,
  CAR_COLORS,
  CarFormData,
  CarValidationErrors,
  formatLicensePlate,
  formatRenavam,
  FUEL_TYPES,
  validateCarForm,
} from '../types/car';

export default function CadastrarCarroScreen() {
  const theme = useTheme();

  // Estados do formulário
  const [formData, setFormData] = useState<CarFormData>({
    // Informações Essenciais (obrigatórias)
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
    colorHex: '',
    
    // Informações Gerais (opcionais)
    engine: '',
    chassi: '',
    renavam: '',
    fuel: '',
    description: '',
  });

  const [photoURI, setPhotoURI] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [errors, setErrors] = useState<CarValidationErrors>({});

  // Estados dos modais
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  const handleInputChange = (field: keyof CarFormData, value: string) => {
    let formattedValue = value;

    // Formatação específica para alguns campos
    if (field === 'licensePlate') {
      formattedValue = formatLicensePlate(value);
    } else if (field === 'renavam') {
      formattedValue = formatRenavam(value);
    } else if (field === 'year') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (field === 'chassi') {
      formattedValue = value.toUpperCase().slice(0, 17);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Limpa erro do campo quando o usuário começar a digitar (apenas campos obrigatórios)
    if (field in errors && errors[field as keyof CarValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhotoChange = async (uri: string) => {
    try {
      setPhotoLoading(true);
      setPhotoURI(uri);
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      Alert.alert('Erro', 'Erro ao processar a foto');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoRemove = async () => {
    try {
      setPhotoURI('');
    } catch (error) {
      console.error('Erro ao remover foto:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validação apenas dos campos obrigatórios
      const validationErrors = validateCarForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0];
        Alert.alert('Erro de Validação', firstError);
        return;
      }

      // Verifica se a placa já existe
      const plateExists = await checkLicensePlateExists(formData.licensePlate);
      if (plateExists) {
        Alert.alert('Erro', 'Já existe um veículo cadastrado com esta placa');
        return;
      }

      setLoading(true);

      let photoURL: string | undefined;
      
      // Upload da foto se houver
      if (photoURI) {
        try {
          photoURL = await uploadAndSaveCarPhoto(photoURI);
        } catch (photoError) {
          console.warn('Erro no upload da foto:', photoError);
          Alert.alert(
            'Aviso', 
            'Erro ao fazer upload da foto, mas o veículo será cadastrado sem ela. Você pode adicionar a foto depois.'
          );
        }
      }

      // Cria o carro
      await createCar(formData, photoURL);

      Alert.alert(
        'Sucesso',
        'Veículo cadastrado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

    } catch (error: any) {
      console.error('Erro ao cadastrar veículo:', error);
      Alert.alert('Erro', error.message || 'Erro ao cadastrar veículo');
    } finally {
      setLoading(false);
    }
  };

  const selectBrand = (brand: string) => {
    handleInputChange('brand', brand);
    setShowBrandModal(false);
  };

  const selectFuel = (fuel: string) => {
    handleInputChange('fuel', fuel);
    setShowFuelModal(false);
  };

  const selectColor = (colorName: string, colorHex: string) => {
    handleInputChange('color', colorName);
    handleInputChange('colorHex', colorHex);
    setShowColorModal(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    sectionSubtitle: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      fontStyle: 'italic',
      lineHeight: 20,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    inputLabel: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    requiredAsterisk: {
      color: theme.colors.error,
    },
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    selectInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    selectText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      flex: 1,
    },
    selectPlaceholder: {
      color: theme.colors.textSecondary,
    },
    colorPreview: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    colorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xxl,
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.buttonDisabled,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      width: '85%',
      maxHeight: '70%',
    },
    modalTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    modalItem: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalItemText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    modalCancel: {
      alignItems: 'center',
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    modalCancelText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header Global - Sem botão direito */}
      <Header 
        title="Cadastrar Veículo" 
        showBackButton 
      />

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        {/* Foto do Veículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto do Veículo</Text>
          <CarPhotoSelector
            photoURL={photoURI}
            onPhotoChange={handlePhotoChange}
            onPhotoRemove={handlePhotoRemove}
            isLoading={photoLoading}
            placeholder="Toque para adicionar uma foto do seu veículo"
          />
        </View>

        {/* SEÇÃO 1: Informações Essenciais - OBRIGATÓRIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Essenciais</Text>
          <Text style={styles.sectionSubtitle}>
            Estas informações são obrigatórias e serão visíveis para outros usuários 
            na busca por veículos roubados
          </Text>

          {/* Marca */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Marca <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.selectInput, errors.brand && styles.inputError]}
              onPress={() => setShowBrandModal(true)}
            >
              <Text style={[styles.selectText, !formData.brand && styles.selectPlaceholder]}>
                {formData.brand || 'Selecione a marca'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
          </View>

          {/* Modelo */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Modelo <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.model && styles.inputError]}
              value={formData.model}
              onChangeText={(value) => handleInputChange('model', value)}
              placeholder="Digite o modelo do veículo"
              autoCapitalize="words"
            />
            {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
          </View>

          {/* Ano */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Ano <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              value={formData.year}
              onChangeText={(value) => handleInputChange('year', value)}
              placeholder="2024"
              keyboardType="numeric"
              maxLength={4}
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>

          {/* Placa */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Placa <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.licensePlate && styles.inputError]}
              value={formData.licensePlate}
              onChangeText={(value) => handleInputChange('licensePlate', value)}
              placeholder="ABC-1234 ou ABC1D23"
              autoCapitalize="characters"
              maxLength={8}
            />
            {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
          </View>

          {/* Cor */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Cor <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.selectInput, errors.color && styles.inputError]}
              onPress={() => setShowColorModal(true)}
            >
              <View style={styles.colorContainer}>
                {formData.colorHex ? (
                  <View style={[styles.colorPreview, { backgroundColor: formData.colorHex }]} />
                ) : null}
                <Text style={[styles.selectText, !formData.color && styles.selectPlaceholder]}>
                  {formData.color || 'Selecione a cor'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
          </View>
        </View>

        {/* SEÇÃO 2: Informações Gerais - OPCIONAIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          <Text style={styles.sectionSubtitle}>
            Informações opcionais para sua organização pessoal e fácil acesso 
            aos documentos do veículo
          </Text>

          {/* Motorização */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Motorização</Text>
            <TextInput
              style={styles.input}
              value={formData.engine}
              onChangeText={(value) => handleInputChange('engine', value)}
              placeholder="1.0, 1.6, 2.0, V6..."
            />
          </View>

          {/* Combustível */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Combustível</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowFuelModal(true)}
            >
              <Text style={[styles.selectText, !formData.fuel && styles.selectPlaceholder]}>
                {FUEL_TYPES.find(f => f.value === formData.fuel)?.label || 'Selecione o combustível'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* RENAVAM */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>RENAVAM</Text>
            <TextInput
              style={styles.input}
              value={formData.renavam}
              onChangeText={(value) => handleInputChange('renavam', value)}
              placeholder="1234.5678.901"
              keyboardType="numeric"
              maxLength={13}
            />
          </View>

          {/* Chassi */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Chassi</Text>
            <TextInput
              style={styles.input}
              value={formData.chassi}
              onChangeText={(value) => handleInputChange('chassi', value)}
              placeholder="17 caracteres alfanuméricos"
              autoCapitalize="characters"
              maxLength={17}
            />
          </View>

          {/* Observações */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Acessórios, modificações, características especiais..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Botão de Submit Principal */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Cadastrar Veículo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modais */}
      {/* Modal de Marcas */}
      <Modal visible={showBrandModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Marca</Text>
            <FlatList
              data={CAR_BRANDS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectBrand(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowBrandModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Combustíveis */}
      <Modal visible={showFuelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Combustível</Text>
            <FlatList
              data={FUEL_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectFuel(item.value)}>
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowFuelModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Cores */}
      <Modal visible={showColorModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Cor</Text>
            <FlatList
              data={CAR_COLORS}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => selectColor(item.name, item.hex)}
                >
                  <View style={styles.colorContainer}>
                    <View style={[styles.colorPreview, { backgroundColor: item.hex }]} />
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowColorModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}