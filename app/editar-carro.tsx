// app/editar-carro.tsx - VERSÃO RESPONSIVA COMPLETA
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  deleteCarPhoto,
  getUserCars,
  updateCar,
  uploadAndSaveCarPhoto,
} from '../services/carService';
import {
  Car,
  CAR_BRANDS,
  CAR_COLORS,
  CarFormData,
  CarValidationErrors,
  formatRenavam,
  FUEL_TYPES,
  validateCarForm
} from '../types/car';
import { scaleFont, scaleHeight, scaleIcon, scaleModerate } from '../utils/responsive';

export default function EditarCarroScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [originalCar, setOriginalCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState<CarFormData>({
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
    colorHex: '',
    engine: '',
    chassi: '',
    renavam: '',
    fuel: '',
    description: '',
  });

  const [photoURI, setPhotoURI] = useState<string>('');
  const [originalPhotoURL, setOriginalPhotoURL] = useState<string>('');
  const [photoChanged, setPhotoChanged] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [errors, setErrors] = useState<CarValidationErrors>({});

  // Estados dos modais
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  useEffect(() => {
    loadCarData();
  }, [id]);

  const loadCarData = async () => {
    try {
      setLoading(true);
      const userCars = await getUserCars();
      const car = userCars.find(c => c.id === id);
      
      if (car) {
        setOriginalCar(car);
        setFormData({
          brand: car.brand,
          model: car.model,
          year: car.year.toString(),
          licensePlate: car.licensePlate,
          color: car.color,
          colorHex: car.colorHex,
          engine: car.engine || '',
          chassi: car.chassi || '',
          renavam: car.renavam || '',
          fuel: car.fuel || '',
          description: car.description || '',
        });
        
        if (car.photoURL) {
          setPhotoURI(car.photoURL);
          setOriginalPhotoURL(car.photoURL);
        }
      } else {
        Alert.alert('Erro', 'Veículo não encontrado', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados do carro:', error);
      Alert.alert('Erro', 'Erro ao carregar dados do veículo');
    } finally {
      setLoading(false);
    }
  };

  const formatLicensePlateInput = (value: string): string => {
    // Remove tudo que não é letra ou número
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Se estiver vazio, retorna vazio
    if (!cleanValue) return '';
    
    // Limita a 7 caracteres (sem o hífen)
    const limitedValue = cleanValue.slice(0, 7);
    
    // Formato antigo: ABC1234 → ABC-1234
    // Formato Mercosul: ABC1D23 → ABC1D23
    if (limitedValue.length <= 3) {
      return limitedValue;
    } else if (limitedValue.length === 4) {
      return `${limitedValue.slice(0, 3)}-${limitedValue.slice(3)}`;
    } else if (limitedValue.length <= 7) {
      // Verifica se é Mercosul (5º caractere é letra)
      const fifthChar = limitedValue.charAt(4);
      const isMercosul = /[A-Z]/.test(fifthChar);
      
      if (isMercosul) {
        return `${limitedValue.slice(0, 3)}-${limitedValue.slice(3)}`;
      } else {
        return `${limitedValue.slice(0, 3)}-${limitedValue.slice(3)}`;
      }
    }
    
    return limitedValue;
  };

  const handleInputChange = (field: keyof CarFormData, value: string) => {
    let formattedValue = value;

    // Formatação específica para alguns campos
    if (field === 'licensePlate') {
      formattedValue = formatLicensePlateInput(value);
    } else if (field === 'renavam') {
      formattedValue = formatRenavam(value);
    } else if (field === 'year') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (field === 'chassi') {
      formattedValue = value.toUpperCase().slice(0, 17);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Limpa erro do campo quando o usuário começar a digitar
    if (field in errors && errors[field as keyof CarValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhotoChange = async (uri: string) => {
    try {
      setPhotoLoading(true);
      setPhotoURI(uri);
      setPhotoChanged(true);
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
      setPhotoChanged(true);
    } catch (error) {
      console.error('Erro ao remover foto:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Validação apenas dos campos obrigatórios
      const validationErrors = validateCarForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0];
        Alert.alert('Erro de Validação', firstError);
        return;
      }

      // Verifica se a placa já existe (excluindo o próprio carro)
      if (formData.licensePlate !== originalCar?.licensePlate) {
        const plateExists = await checkLicensePlateExists(formData.licensePlate, originalCar?.id);
        if (plateExists) {
          Alert.alert('Erro', 'Já existe um veículo cadastrado com esta placa');
          return;
        }
      }

      setSaving(true);

      let newPhotoURL: string | undefined = originalPhotoURL;
      
      // Gerencia foto se foi alterada
      if (photoChanged) {
        // Remove foto antiga se existir
        if (originalPhotoURL) {
          try {
            await deleteCarPhoto(originalPhotoURL);
          } catch (photoError) {
            console.warn('Erro ao remover foto antiga:', photoError);
          }
        }

        // Upload nova foto se houver
        if (photoURI && photoURI !== originalPhotoURL) {
          try {
            newPhotoURL = await uploadAndSaveCarPhoto(photoURI);
          } catch (photoError) {
            console.warn('Erro no upload da nova foto:', photoError);
            Alert.alert(
              'Aviso', 
              'Erro ao fazer upload da nova foto, mas as outras alterações serão salvas.'
            );
            newPhotoURL = undefined;
          }
        } else {
          newPhotoURL = undefined;
        }
      }

      // Atualiza o carro
      if (originalCar?.id) {
        await updateCar(originalCar.id, formData, newPhotoURL);
        Alert.alert(
          'Sucesso',
          'Veículo atualizado com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }

    } catch (error: any) {
      console.error('Erro ao atualizar veículo:', error);
      Alert.alert('Erro', error.message || 'Erro ao atualizar veículo');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Descartar Alterações',
      'Tem certeza que deseja descartar as alterações?',
      [
        {
          text: 'Continuar Editando',
          style: 'cancel',
        },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
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

  const handleDelete = () => {
    if (!originalCar) return;

    Alert.alert(
      'Remover Veículo',
      `Tem certeza que deseja remover o ${originalCar.brand} ${originalCar.model}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              if (originalCar.id) {
                const { deleteCar } = require('../services/carService');
                await deleteCar(originalCar.id, originalCar.photoURL);
                Alert.alert('Sucesso', 'Veículo removido com sucesso', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao remover veículo');
            }
          },
        },
      ]
    );
  };

  const renderSaveButton = () => (
    <TouchableOpacity
      style={[styles.headerSaveButton, saving && styles.headerSaveButtonDisabled]}
      onPress={handleSave}
      disabled={saving}
      activeOpacity={0.7}
    >
      {saving ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="checkmark" size={scaleIcon(16)} color="#FFFFFF" />
          <Text style={styles.headerSaveButtonText}>Salvar</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerSaveButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: scaleHeight(32),
    },
    headerSaveButtonDisabled: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerSaveButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
      marginLeft: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      paddingBottom: scaleHeight(120),
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
      fontSize: scaleFont(14),
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      fontStyle: 'italic',
      lineHeight: scaleFont(20),
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
      minHeight: scaleHeight(48),
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
      minHeight: scaleHeight(48),
    },
    selectText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      flex: 1,
    },
    selectPlaceholder: {
      color: theme.colors.placeholder,
    },
    colorPreview: {
      width: scaleModerate(24),
      height: scaleModerate(24),
      borderRadius: scaleModerate(12),
      marginRight: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    colorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textArea: {
      height: scaleHeight(80),
      textAlignVertical: 'top',
      paddingTop: theme.spacing.md,
    },
    errorText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    helperText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      fontStyle: 'italic',
    },
    actionButtonsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: scaleHeight(20),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.lg,
    },
    editButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      minWidth: scaleModerate(120),
      minHeight: scaleHeight(44),
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: theme.colors.error,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      minWidth: scaleModerate(120),
      minHeight: scaleHeight(44),
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      marginLeft: theme.spacing.xs,
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
      paddingVertical: scaleHeight(12),
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Editar Veículo" showBackButton onBackPress={handleCancel} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header Global */}
      <Header 
        title="Editar Veículo" 
        showBackButton 
        onBackPress={handleCancel}
        rightComponent={renderSaveButton()}
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
            placeholder="Toque para alterar a foto do veículo"
          />
        </View>

        {/* SEÇÃO 1: Informações Essenciais - OBRIGATÓRIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Essenciais</Text>
          <Text style={styles.sectionSubtitle}>
            Estas informações são obrigatórias e serão visíveis para outros usuários na busca por veículos roubados
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
              <Ionicons name="chevron-down" size={scaleIcon(20)} color={theme.colors.textSecondary} />
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
              placeholderTextColor={theme.colors.placeholder}
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
              placeholderTextColor={theme.colors.placeholder}
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
              placeholderTextColor={theme.colors.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
            {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
            {!errors.licensePlate && (
              <Text style={styles.helperText}>
                Digite letras e números. A formatação será automática.
              </Text>
            )}
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
              <Ionicons name="chevron-down" size={scaleIcon(20)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
          </View>
        </View>

        {/* SEÇÃO 2: Informações Gerais - OPCIONAIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          <Text style={styles.sectionSubtitle}>
            Informações opcionais para sua organização pessoal e fácil acesso aos documentos do veículo
          </Text>

          {/* Motorização */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Motorização</Text>
            <TextInput
              style={styles.input}
              value={formData.engine}
              onChangeText={(value) => handleInputChange('engine', value)}
              placeholder="1.0, 1.6, 2.0, V6..."
              placeholderTextColor={theme.colors.placeholder}
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
              <Ionicons name="chevron-down" size={scaleIcon(20)} color={theme.colors.textSecondary} />
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
              placeholderTextColor={theme.colors.placeholder}
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
              placeholderTextColor={theme.colors.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
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
              placeholderTextColor={theme.colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Botões de Ação Fixos */}
      <View style={styles.actionButtonsContainer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleSave} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={scaleIcon(18)} color="#FFFFFF" />
            <Text style={styles.buttonText}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={scaleIcon(18)} color="#FFFFFF" />
            <Text style={styles.buttonText}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>

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
