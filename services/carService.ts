// services/carService.ts - VERSÃO CORRIGIDA PARA CAMPOS OPCIONAIS + IGNIÇÃO
import * as ImageManipulator from 'expo-image-manipulator';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { Car, CarFormData } from '../types/car';
import { auth, db } from './firebase';

// 🔧 Configura BASE_URL para API Java de imagens
// ⚠️ IMPORTANTE: Substitua pelo IP da sua máquina onde está rodando o servidor Java
const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080'  // Emulador Android
  : 'http://192.168.1.185:8080'; // iOS Simulator ou dispositivo físico

/**
 * Upload da foto do carro para a API Java
 */
export async function uploadCarPhoto(uri: string): Promise<string> {
  try {
    // Comprime a imagem antes do upload (proporção 16:9 para carros)
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }], // Redimensiona para 1280px de largura
      { 
        compress: 0.8, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );

    const filename = `car_${Date.now()}.jpg`;
    const mimeType = 'image/jpeg';

    // Cria FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('file', {
      uri: manipResult.uri,
      name: filename,
      type: mimeType,
    } as any);

    // Faz o upload para a API Java
    const response = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Falha no upload (${response.status})`);
    }

    const result = await response.json();
    
    // Retorna a URL completa para acesso à imagem
    const imageUrl = result.url?.startsWith('http') 
      ? result.url 
      : `${BASE_URL}${result.url}`;
    
    return imageUrl;
  } catch (error) {
    console.error('Erro no upload da foto do carro:', error);
    throw new Error('Erro ao fazer upload da foto do veículo');
  }
}

/**
 * Remove foto do carro da API Java
 */
export async function deleteCarPhoto(photoURL: string): Promise<void> {
  try {
    // Extrai o filename da URL
    const filename = photoURL.split('/').pop();
    if (!filename) {
      throw new Error('Nome do arquivo não encontrado na URL');
    }

    const response = await fetch(`${BASE_URL}/files/delete/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Falha ao deletar foto (${response.status})`);
    }

    console.log('Foto do carro removida com sucesso do servidor');
  } catch (error) {
    console.error('Erro ao remover foto do carro:', error);
    throw new Error('Erro ao remover foto do veículo');
  }
}

/**
 * Cria um novo carro no Firestore
 */
export async function createCar(carData: CarFormData, photoURL?: string): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const carDoc: Omit<Car, 'id'> = {
      userId: currentUser.uid,
      // Informações Essenciais (obrigatórias)
      brand: carData.brand,
      model: carData.model,
      year: parseInt(carData.year),
      licensePlate: carData.licensePlate.toUpperCase(),
      color: carData.color,
      colorHex: carData.colorHex,
      
      // Informações Gerais (opcionais) - CORRIGIDO com verificação
      engine: carData.engine || undefined,
      renavam: carData.renavam ? carData.renavam.replace(/\D/g, '') : undefined,
      chassi: carData.chassi ? carData.chassi.toUpperCase() : undefined,
      fuel: carData.fuel || undefined,
      description: carData.description || undefined,
      
      // NOVO: Estado inicial da ignição
      ignitionState: 'unknown',
      
      photoURL,
      isActive: true,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'cars'), carDoc);
    console.log('Carro criado com sucesso:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Erro ao criar carro:', error);
    throw new Error('Erro ao cadastrar veículo');
  }
}

/**
 * Busca todos os carros do usuário atual
 */
export async function getUserCars(): Promise<Car[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const carsRef = collection(db, 'cars');
    const q = query(
      carsRef, 
      where('userId', '==', currentUser.uid),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const cars: Car[] = [];

    querySnapshot.forEach((doc) => {
      const carData = doc.data();
      cars.push({
        id: doc.id,
        ...carData,
        createdAt: carData.createdAt?.toDate() || new Date(),
        updatedAt: carData.updatedAt?.toDate(),
        lastIgnitionUpdate: carData.lastIgnitionUpdate?.toDate(),
      } as Car);
    });

    return cars;
  } catch (error: any) {
    console.error('Erro ao buscar carros:', error);
    throw new Error('Erro ao carregar veículos');
  }
}

/**
 * Atualiza os dados de um carro
 */
export async function updateCar(carId: string, carData: Partial<CarFormData>, photoURL?: string): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const carDocRef = doc(db, 'cars', carId);
    const updateData: any = {
      ...carData,
      updatedAt: new Date(),
    };

    // Tratamento especial para campos com formatação
    if (carData.year) {
      updateData.year = parseInt(carData.year);
    }

    if (carData.licensePlate) {
      updateData.licensePlate = carData.licensePlate.toUpperCase();
    }

    // CORRIGIDO: Verifica se existe antes de formatar
    if (carData.renavam) {
      updateData.renavam = carData.renavam.replace(/\D/g, '');
    }

    if (carData.chassi) {
      updateData.chassi = carData.chassi.toUpperCase();
    }

    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    }

    await updateDoc(carDocRef, updateData);
    console.log('Carro atualizado com sucesso');
  } catch (error: any) {
    console.error('Erro ao atualizar carro:', error);
    throw new Error('Erro ao atualizar veículo');
  }
}

/**
 * Desativa um carro (soft delete)
 */
export async function deleteCar(carId: string, photoURL?: string): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Remove foto se existir
    if (photoURL) {
      try {
        await deleteCarPhoto(photoURL);
      } catch (error) {
        console.warn('Erro ao remover foto do servidor:', error);
      }
    }

    // Desativa o carro ao invés de deletar
    const carDocRef = doc(db, 'cars', carId);
    await updateDoc(carDocRef, {
      isActive: false,
      updatedAt: new Date(),
    });

    console.log('Carro desativado com sucesso');
  } catch (error: any) {
    console.error('Erro ao deletar carro:', error);
    throw new Error('Erro ao remover veículo');
  }
}

/**
 * Upload da foto do carro e retorna a URL
 */
export async function uploadAndSaveCarPhoto(uri: string): Promise<string> {
  try {
    const photoURL = await uploadCarPhoto(uri);
    return photoURL;
  } catch (error: any) {
    console.error('Erro ao fazer upload da foto do carro:', error);
    throw new Error('Erro ao salvar foto do veículo');
  }
}

/**
 * Verifica se uma placa já está cadastrada para o usuário
 */
export async function checkLicensePlateExists(licensePlate: string, excludeCarId?: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    const carsRef = collection(db, 'cars');
    const q = query(
      carsRef, 
      where('userId', '==', currentUser.uid),
      where('licensePlate', '==', licensePlate.toUpperCase()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Se tem exclusão por ID, filtra
    if (excludeCarId) {
      const existingCars = querySnapshot.docs.filter(doc => doc.id !== excludeCarId);
      return existingCars.length > 0;
    }
    
    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Erro ao verificar placa:', error);
    return false;
  }
}

/**
 * NOVA FUNÇÃO: Alterna o estado da ignição do carro
 */
export async function toggleCarIgnition(
  carId: string, 
  newState: 'on' | 'off'
): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Aqui você faria a chamada para o hardware/API do relé
    const relayResponse = await controlIgnitionRelay(carId, newState);
    
    if (!relayResponse.success) {
      throw new Error('Falha ao controlar relé da ignição');
    }

    // Atualiza o estado no Firebase
    const carDocRef = doc(db, 'cars', carId);
    await updateDoc(carDocRef, {
      ignitionState: newState,
      lastIgnitionUpdate: new Date(),
      updatedAt: new Date(),
    });

    console.log(`Ignição ${newState === 'on' ? 'ligada' : 'desligada'} com sucesso`);
  } catch (error: any) {
    console.error('Erro ao alterar ignição:', error);
    throw new Error(`Erro ao ${newState === 'on' ? 'ligar' : 'desligar'} ignição`);
  }
}

/**
 * NOVA FUNÇÃO: Controla o relé da ignição (placeholder para implementação futura)
 */
async function controlIgnitionRelay(
  carId: string, 
  state: 'on' | 'off'
): Promise<{ success: boolean; message?: string }> {
  try {
    // TODO: Implementar comunicação com hardware/API do relé
    // Esta função será implementada quando definirmos a arquitetura do hardware
    
    // Simula delay da comunicação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simula resposta bem-sucedida
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Erro na comunicação com o relé' };
  }
}
