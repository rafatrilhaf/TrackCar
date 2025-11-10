# TrackCar 🚗📍

<div align="center">

![TrackCar Banner](https://img.shields.io/badge/TrackCar-Sistema%20de%20Rastreamento%20Veicular-0066CC?style=for-the-badge&logo=react)

**Sistema Completo de Rastreamento Veicular com IoT e Firebase**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Arduino](https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=Arduino&logoColor=white)](https://www.arduino.cc/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

### 📱 **Rastreamento em Tempo Real** | 🔐 **Controle Remoto** | 🚨 **Sistema Anti-Furto**

[Características](#-características) •
[Arquitetura](#-arquitetura) •
[Instalação](#-instalação) •
[Configuração](#-configuração-completa) •
[Hardware](#-montagem-do-hardware) •
[Uso](#-como-usar) •
[Troubleshooting](#-troubleshooting)

</div>

---

## 📋 Sobre o Projeto

**TrackCar** é um sistema integrado de rastreamento veicular desenvolvido como Trabalho de Conclusão de Curso (TCC) que combina hardware IoT (Arduino Nano + GPS NEO-6M) com uma aplicação mobile moderna (React Native/Expo), backend Firebase e servidor de imagens Java com MongoDB, permitindo monitoramento em tempo real, controle remoto da ignição e gestão completa de frotas de veículos.

### 🎯 Principais Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| 🗺️ **Rastreamento GPS** | Localização precisa em tempo real com módulo NEO-6M (até 10Hz) |
| 🔐 **Controle de Ignição** | Liga/desliga veículo remotamente via app com módulo relé |
| 🚨 **Sistema Anti-Furto** | Marca veículos roubados e sistema de avistamentos comunitários |
| 📊 **Dashboard Completo** | Métricas em tempo real, histórico e análise de trajetos |
| 🔔 **Notificações Push** | Alertas instantâneos sobre eventos críticos do veículo |
| 👥 **Gestão de Usuários** | Sistema completo de autenticação, perfis e permissões |
| 📸 **Galeria de Veículos** | Upload e armazenamento de fotos no MongoDB GridFS |
| 🌐 **Multiplataforma** | Funciona em iOS, Android e navegadores Web |
| 📍 **Histórico de Rotas** | Armazena e visualiza trajetos percorridos |
| ⚡ **Real-Time Sync** | Sincronização instantânea via Firebase Firestore |

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE APRESENTAÇÃO                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │               React Native/Expo Mobile App                      │  │
│  │  ┌──────────────┬──────────────┬──────────────┬─────────────┐ │  │
│  │  │   iOS App    │  Android App │   Web App    │ PWA Support │ │  │
│  │  └──────────────┴──────────────┴──────────────┴─────────────┘ │  │
│  │  • React Navigation 7.x  • Expo Location  • React Native Maps  │  │
│  │  • Firebase SDK 12.3.0   • Expo Router    • TypeScript 5.9     │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTPS/WSS
┌──────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE BACKEND                             │
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Firebase Platform  │  │    Python Gateway Server v2.3        │  │
│  │  ┌───────────────┐  │  │  ┌────────────────────────────────┐ │  │
│  │  │ Authentication│  │  │  │  Serial Communication Manager  │ │  │
│  │  │  (Email/Pass) │  │  │  │  • pySerial 9600 baud          │ │  │
│  │  └───────────────┘  │  │  │  • JSON Protocol Parser        │ │  │
│  │  ┌───────────────┐  │  │  │  • Command Queue System        │ │  │
│  │  │   Firestore   │  │  │  │  • Real-time State Sync        │ │  │
│  │  │   NoSQL DB    │  │  │  │  • Firebase Admin SDK          │ │  │
│  │  └───────────────┘  │  │  └────────────────────────────────┘ │  │
│  │  ┌───────────────┐  │  │  • Listens to Firestore changes    │  │
│  │  │ Cloud Storage │  │  │  • Sends commands to Arduino       │  │
│  │  └───────────────┘  │  │  • Saves GPS to Firestore          │  │
│  └─────────────────────┘  └──────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Java Spring Boot Image Server (Port 8080)             │   │
│  │  ┌────────────────┬────────────────┬───────────────────────┐ │   │
│  │  │ File Upload    │  Image Compress│  MongoDB GridFS       │ │   │
│  │  │ REST API       │  (JPEG 80%)    │  Storage              │ │   │
│  │  └────────────────┴────────────────┴───────────────────────┘ │   │
│  │  • MongoDB Atlas Cluster: clustertc.66e8ozq.mongodb.net      │   │
│  │  • Database: trackcardb                                       │   │
│  │  • Max Upload: 50MB                                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                    ↕ USB Serial
┌──────────────────────────────────────────────────────────────────────┐
│                          CAMADA DE HARDWARE                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │            Arduino Nano ATmega328P (v2.3 - Active Low)         │  │
│  │  ┌──────────────────┐  ┌────────────────┐  ┌───────────────┐ │  │
│  │  │  GPS NEO-6M      │  │  Relay Module  │  │  Status LED   │ │  │
│  │  │  • RX: D6        │  │  • Signal: D5  │  │  • Pin: D13   │ │  │
│  │  │  • TX: D7        │  │  • Active Low  │  │  • Heartbeat  │ │  │
│  │  │  • 9600 baud     │  │  • 5V/10A      │  │               │ │  │
│  │  │  • TinyGPS Lib   │  │                │  │               │ │  │
│  │  └──────────────────┘  └────────────────┘  └───────────────┘ │  │
│  │  • JSON Protocol  • 5s GPS Updates  • 30s Heartbeat          │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 🔄 Fluxo de Dados Detalhado

```
┌─────────────┐
│   GPS NEO   │ ──NMEA Sentences (9600 baud)──> ┌──────────────┐
│    -6M      │                                  │   Arduino    │
└─────────────┘                                  │     Nano     │
                                                 └──────┬───────┘
                                                        │ JSON over Serial
                                                        ↓
                                                 ┌──────────────┐
                                                 │    Python    │
                                                 │   Gateway    │
                                                 └──────┬───────┘
                                                        │ Firebase Admin SDK
                                                        ↓
                                                 ┌──────────────┐
                                                 │   Firebase   │
                                                 │  Firestore   │
                                                 └──────┬───────┘
                                                        │ Real-time Listeners
                                                        ↓
                                                 ┌──────────────┐
                                                 │  Mobile App  │
                                                 │ (React Native)│
                                                 └──────────────┘
                                                        │
User taps "Start Engine" ──────────────────────────────┘
                                                        │
                                                        ↓
                                                 ┌──────────────┐
                                                 │   Firebase   │
                                                 │  (ignition   │
                                                 │   State)     │
                                                 └──────┬───────┘
                                                        │ onSnapshot()
                                                        ↓
                                                 ┌──────────────┐
                                                 │    Python    │
                                                 │   Gateway    │
                                                 └──────┬───────┘
                                                        │ Serial Command
                                                        ↓
                                                 ┌──────────────┐
                                                 │   Arduino    │
                                                 │ (Relay ON)   │
                                                 └──────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Mobile App)

| Tecnologia | Versão | Descrição | Uso no Projeto |
|------------|--------|-----------|----------------|
| **React Native** | 0.81.5 | Framework mobile cross-platform | Base do aplicativo |
| **Expo** | 54.0.23 | Plataforma de desenvolvimento | Build e deploy |
| **TypeScript** | ~5.9.2 | Superset JavaScript com tipos | Type safety |
| **Expo Router** | ~6.0.14 | Sistema de navegação file-based | Roteamento de telas |
| **React Navigation** | 7.x | Navegação entre telas | Bottom tabs, stack navigation |
| **React Native Maps** | 1.20.1 | Componente de mapas | Visualização GPS |
| **Expo Location** | ^19.0.7 | API de geolocalização | Permissões e coordenadas |
| **Expo Image Picker** | ^17.0.8 | Seletor de imagens | Upload de fotos |
| **Firebase SDK** | 12.3.0 | Backend as a Service | Auth, Firestore, Storage |
| **Async Storage** | 2.2.0 | Armazenamento local | Cache e persistência |

### Backend

| Tecnologia | Versão | Descrição | Uso no Projeto |
|------------|--------|-----------|----------------|
| **Firebase Auth** | Latest | Autenticação de usuários | Login/Registro |
| **Cloud Firestore** | Latest | Banco NoSQL em tempo real | Dados de carros, GPS, usuários |
| **Firebase Storage** | Latest | Armazenamento de arquivos | Backup de imagens |
| **Python** | 3.8+ | Linguagem de programação | Gateway Arduino-Firebase |
| **pySerial** | Latest | Comunicação serial | Conexão com Arduino |
| **Firebase Admin SDK** | Latest | SDK servidor do Firebase | Acesso privilegiado ao Firestore |
| **Java Spring Boot** | Latest | Framework web Java | Servidor de imagens |
| **MongoDB Atlas** | Cloud | Banco de dados NoSQL | GridFS para imagens |

### Hardware/Embedded

| Componente | Modelo | Especificação | Função |
|------------|--------|---------------|--------|
| **Microcontrolador** | Arduino Nano | ATmega328P, 16MHz, 5V | Processamento e I/O |
| **GPS** | NEO-6M | UART, 10Hz, precisão 2.5m | Localização |
| **Módulo Relé** | 1 Canal | Active Low, 5V/10A | Controle ignição |
| **Biblioteca GPS** | TinyGPS | Versão 13+ | Parse NMEA |
| **Biblioteca Serial** | SoftwareSerial | Incluída no Arduino | Comunicação GPS |

---

## 📦 Instalação

### ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

#### Software Essencial

- ✅ **Node.js** 18.x ou superior ([Download](https://nodejs.org/))
- ✅ **npm** ou **yarn** (incluído com Node.js)
- ✅ **Python** 3.8 ou superior ([Download](https://www.python.org/))
- ✅ **Java JDK** 11 ou superior ([Download](https://www.oracle.com/java/technologies/downloads/))
- ✅ **Arduino IDE** 1.8.x ou 2.x ([Download](https://www.arduino.cc/en/software))
- ✅ **Git** ([Download](https://git-scm.com/))

#### Ferramentas de Desenvolvimento

```bash
# Instalar Expo CLI globalmente
npm install -g expo-cli

# Instalar EAS CLI (opcional, para builds)
npm install -g eas-cli
```

#### Contas Necessárias

- 🔥 **Firebase** - Criar conta em [firebase.google.com](https://firebase.google.com/)
- 🍃 **MongoDB Atlas** - Criar conta em [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- 📱 **Expo** (opcional) - Criar conta em [expo.dev](https://expo.dev/)

---

## 🚀 Configuração Completa

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/rafatrilhaf/TrackCar.git
cd TrackCar
```

---

### 2️⃣ Configuração do Firebase

#### **Passo 1: Criar Projeto no Firebase**

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `TrackCar` (ou nome de sua preferência)
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

#### **Passo 2: Configurar Authentication**

1. No menu lateral, vá em **Authentication**
2. Clique em "Começar"
3. Habilite o método **E-mail/senha**
4. (Opcional) Configure domínios autorizados

#### **Passo 3: Criar Firestore Database**

1. No menu lateral, vá em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha **Modo de produção**
4. Selecione a localização: **us-central1** (ou mais próximo)
5. Clique em "Ativar"

#### **Passo 4: Configurar Regras do Firestore**

Vá em **Firestore Database > Regras** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar autenticação
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Função para verificar se é o dono do documento
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Usuários
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    // Carros
    match /cars/{carId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    // Localizações GPS
    match /gps_locations/{locationId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    // Carros roubados
    match /stolen_cars/{stolenId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    // Avistamentos
    match /sightings/{sightingId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    // Comandos de carro
    match /car_commands/{commandId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
  }
}
```

Clique em **Publicar**.

#### **Passo 5: Configurar Storage**

1. No menu lateral, vá em **Storage**
2. Clique em "Começar"
3. Use as regras padrão
4. Escolha a mesma localização do Firestore
5. Clique em "Concluído"

#### **Passo 6: Obter Credenciais Web (para Mobile App)**

1. No menu lateral, vá em **Visão geral do projeto** (ícone de engrenagem) > **Configurações do projeto**
2. Role até "Seus apps"
3. Clique no ícone **Web** (`</>`)
4. Nome do app: `TrackCar Mobile`
5. Copie o objeto `firebaseConfig`

#### **Passo 7: Configurar Mobile App**

Abra o arquivo `services/firebase.ts` e substitua:

```typescript
// services/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyDnSHMp2-RzHXPfO8JHnbIebrwxU_gPnXw",
  authDomain: "trackcar-27dbe.firebaseapp.com",
  projectId: "trackcar-27dbe",
  storageBucket: "trackcar-27dbe.firebasestorage.app",
  messagingSenderId: "356219983317",
  appId: "1:356219983317:web:972822cac6c0562dcc195c",
  measurementId: "G-Q9REGMCMVQ"
};
```

> ⚠️ **IMPORTANTE**: Estas credenciais serão removidas antes da publicação pública.

#### **Passo 8: Obter Credenciais Admin (para Python Server)**

1. Vá em **Configurações do projeto** > **Contas de serviço**
2. Clique em **Gerar nova chave privada**
3. Confirme clicando em **Gerar chave**
4. Um arquivo JSON será baixado

**Salve o arquivo como:**
```
TrackCar/python-server/credentials/firebase-adminsdk.json
```

Crie a pasta se não existir:
```bash
mkdir -p python-server/credentials
```

---

### 3️⃣ Configuração do MongoDB Atlas

#### **Passo 1: Criar Cluster**

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Faça login ou crie uma conta
3. Clique em **Build a Database**
4. Escolha **M0 Free** (Shared)
5. Provedor: **AWS**
6. Região: **N. Virginia (us-east-1)** ou mais próxima
7. Nome do cluster: `ClusterTC`
8. Clique em **Create**

#### **Passo 2: Configurar Network Access**

1. Menu lateral: **Network Access**
2. Clique em **Add IP Address**
3. **Para desenvolvimento**: Clique em **Allow Access from Anywhere** (0.0.0.0/0)
4. **Para produção**: Adicione apenas IPs confiáveis
5. Clique em **Confirm**

#### **Passo 3: Criar Usuário de Banco de Dados**

1. Menu lateral: **Database Access**
2. Clique em **Add New Database User**
3. Authentication Method: **Password**
4. **Username**: `trackcar_admin`
5. **Password**: Gere uma senha forte (ex: `Tr@ckC@r2025!Secure`)
6. Database User Privileges: **Atlas Admin** (ou `readWrite` apenas no trackcardb)
7. Clique em **Add User**

#### **Passo 4: Obter Connection String**

1. Volte para **Database**
2. Clique em **Connect** no seu cluster
3. Escolha **Connect your application**
4. Driver: **Java** (versão 4.3 or later)
5. Copie a connection string:

```
mongodb+srv://trackcar_admin:<password>@clustertc.66e8ozq.mongodb.net/?retryWrites=true&w=majority&appName=ClusterTC
```

#### **Passo 5: Configurar Servidor Java**

**⚠️ NUNCA commite credenciais! Use variáveis de ambiente.**

##### Opção A: Variáveis de Ambiente (Recomendado)

Crie o arquivo `imageserver/src/main/resources/application.properties`:

```properties
# -------------------------------------------------------------------
# Configuração da aplicação TrackCar Image Server
# -------------------------------------------------------------------
spring.application.name=imageserver
server.port=8080

# -------------------------------------------------------------------
# MongoDB Atlas (GridFS) - USA VARIÁVEIS DE AMBIENTE
# -------------------------------------------------------------------
spring.data.mongodb.uri=${MONGODB_URI}
spring.data.mongodb.database=${MONGODB_DATABASE:trackcardb}

# -------------------------------------------------------------------
# Multipart upload
# -------------------------------------------------------------------
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB

# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------
logging.level.org.springframework.data.mongodb.core.MongoTemplate=DEBUG
logging.level.org.mongodb.driver=INFO
```

**Configure variáveis de ambiente no seu sistema:**

**Linux/macOS** (`~/.bashrc` ou `~/.zshrc`):
```bash
export MONGODB_URI="mongodb+srv://trackcar_admin:Tr@ckC@r2025!Secure@clustertc.66e8ozq.mongodb.net/trackcardb?retryWrites=true&w=majority&tls=true"
export MONGODB_DATABASE="trackcardb"
```

**Windows** (CMD):
```cmd
setx MONGODB_URI "mongodb+srv://trackcar_admin:Tr@ckC@r2025!Secure@clustertc.66e8ozq.mongodb.net/trackcardb?retryWrites=true&w=majority&tls=true"
setx MONGODB_DATABASE "trackcardb"
```

**Windows** (PowerShell):
```powershell
[System.Environment]::SetEnvironmentVariable('MONGODB_URI', 'mongodb+srv://trackcar_admin:Tr@ckC@r2025!Secure@clustertc.66e8ozq.mongodb.net/trackcardb?retryWrites=true&w=majority&tls=true', 'User')
[System.Environment]::SetEnvironmentVariable('MONGODB_DATABASE', 'trackcardb', 'User')
```

##### Opção B: Arquivo .env Local (Alternativa)

Crie `imageserver/.env` (e adicione ao `.gitignore`):

```env
MONGODB_URI=mongodb+srv://trackcar_admin:Tr@ckC@r2025!Secure@clustertc.66e8ozq.mongodb.net/trackcardb?retryWrites=true&w=majority&tls=true
MONGODB_DATABASE=trackcardb
```

**Adicione ao `.gitignore`:**
```bash
echo ".env" >> imageserver/.gitignore
echo "**/.env" >> .gitignore
echo "application.properties" >> imageserver/.gitignore
```

#### **Passo 6: Criar Banco de Dados**

1. No Atlas, clique em **Browse Collections**
2. Clique em **Add My Own Data**
3. Database name: `trackcardb`
4. Collection name: `images.files` (GridFS cria automaticamente)
5. Clique em **Create**

---

### 4️⃣ Instalação do Mobile App

```bash
# Na raiz do projeto TrackCar

# Instalar todas as dependências
npm install

# OU usando yarn
yarn install
```

**Dependências principais que serão instaladas:**
- React Native 0.81.5
- Expo 54.0.23
- Firebase 12.3.0
- React Navigation 7.x
- React Native Maps 1.20.1
- TypeScript 5.9.2

**Verificar instalação:**
```bash
npm list react-native expo firebase
```

---

### 5️⃣ Configuração do Arduino

#### **Passo 1: Instalar Arduino IDE**

1. Baixe em [arduino.cc/en/software](https://www.arduino.cc/en/software)
2. Instale e abra o Arduino IDE

#### **Passo 2: Instalar Bibliotecas**

Via **Library Manager** (Ctrl+Shift+I):

1. **TinyGPS**
   - Pesquise: `TinyGPS`
   - Autor: Mikal Hart
   - Versão: 13 ou superior
   - Clique em **Instalar**

2. **SoftwareSerial**
   - Já incluída no Arduino IDE (não precisa instalar)

#### **Passo 3: Upload do Código**

1. Abra o código Arduino fornecido no projeto
2. Conecte o Arduino Nano via USB
3. Configurações:
   - **Tools > Board**: Arduino Nano
   - **Tools > Processor**: ATmega328P (Old Bootloader)
   - **Tools > Port**: Selecione a porta COM/USB correta
4. Clique em **Upload** (→)

#### **Passo 4: Verificar Funcionamento**

Abra o **Serial Monitor** (Ctrl+Shift+M):
- Baud Rate: **9600**
- Você deve ver: `TRACKCAR_READY_V2.3_INVERTED`

---

### 6️⃣ Configuração do Python Gateway

#### **Passo 1: Instalar Dependências**

```bash
cd python-server

# Criar ambiente virtual (recomendado)
python -m venv venv

# Ativar ambiente virtual
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependências
pip install firebase-admin pyserial
```

#### **Passo 2: Configurar IDs e Porta Serial**

Abra `python-server/trackcar_mac.py` e configure:

```python
# ==============================================================================
# CONFIGURAÇÕES - EDITE AQUI
# ==============================================================================

# Serial do Arduino - Configuração multiplataforma
if platform.system() == "Windows":
    SERIAL_PORT = 'COM8'  # ⬅️ ALTERE para sua porta COM (ex: COM3, COM4, COM5)
elif platform.system() == "Darwin":  # macOS
    SERIAL_PORT = '/dev/cu.usbserial-1140'  # ⬅️ ALTERE se necessário
else:  # Linux
    SERIAL_PORT = '/dev/ttyUSB0'  # ⬅️ ALTERE se necessário

SERIAL_BAUD = 9600

# ID do veículo e usuário - CONFIGURE NO FIREBASE PRIMEIRO
CAR_ID = "I3d6lzJ2aMzvantGyYXz"  # ⬅️ ALTERE para o ID do seu carro no Firestore
USER_ID = "87If5SbgxrePsQX761VTfYBz5GF2"  # ⬅️ ALTERE para o ID do usuário Firebase
```

**Como obter CAR_ID e USER_ID:**

1. **USER_ID**:
   - Crie um usuário no app mobile
   - Vá no Firebase Console > Authentication
   - Copie o **User UID**

2. **CAR_ID**:
   - Cadastre um carro no app mobile
   - Vá no Firebase Console > Firestore > Collection `cars`
   - Copie o **Document ID**

#### **Passo 3: Listar Portas Disponíveis (se necessário)**

```bash
# Windows
python -c "import serial.tools.list_ports; [print(p.device) for p in serial.tools.list_ports.comports()]"

# Linux/macOS
ls /dev/tty*
ls /dev/cu.*
```

#### **Passo 4: Executar Gateway**

```bash
python trackcar_mac.py
```

**Saída esperada:**
```
============================================================
  TRACKCAR - WINDOWS GATEWAY v2.3
  Arduino Nano → Firebase + Controle Relé + GPS Debug
============================================================

[INFO] ✅ Firebase inicializado com sucesso usando credentials/firebase-adminsdk.json
[INFO] ✅ Serial conectada: COM8
[INFO] 🧪 Testando conexão Firebase...
[INFO] ✅ Carro encontrado: Toyota Corolla
[INFO] 🔧 Estado inicial da ignição: off

🚗 Veículo monitorado: I3d6lzJ2aMzvantGyYXz
📡 Aguardando dados do Arduino...
🔔 Escutando mudanças de ignitionState...
```

---

### 7️⃣ Configuração do Servidor Java de Imagens

#### **Passo 1: Configurar application.properties**

Já configurado no passo do MongoDB. Verifique se as variáveis de ambiente estão definidas.

#### **Passo 2: Compilar e Executar**

```bash
cd imageserver

# Usando Maven Wrapper (recomendado)
# Linux/macOS:
./mvnw clean install
./mvnw spring-boot:run

# Windows:
mvnw.cmd clean install
mvnw.cmd spring-boot:run
```

**Saída esperada:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.x.x)

2025-11-10 14:00:00.000  INFO 12345 --- [main] c.t.imageserver.ImageServerApplication   : Started ImageServerApplication in 3.456 seconds
2025-11-10 14:00:00.001  INFO 12345 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http)
```

#### **Passo 3: Testar Servidor**

Abra no navegador: [http://localhost:8080](http://localhost:8080)

Ou teste via curl:
```bash
curl http://localhost:8080/actuator/health
```

#### **Passo 4: Configurar IP no Mobile App**

Abra `services/carService.ts` e configure:

```typescript
// 🔧 Configura BASE_URL para API Java de imagens
const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080'  // Emulador Android
  : 'http://192.168.1.185:8080'; // ⬅️ ALTERE para o IP da sua máquina
```

**Como descobrir seu IP:**

**Windows:**
```cmd
ipconfig
# Procure por "IPv4 Address" na sua rede Wi-Fi/Ethernet
```

**Linux/macOS:**
```bash
ifconfig
# ou
ip addr show
# Procure por inet 192.168.x.x
```

---

## 🔌 Montagem do Hardware

### Componentes Necessários

| Quantidade | Item | Especificação | Link/Loja |
|------------|------|---------------|-----------|
| 1x | Arduino Nano | ATmega328P, 5V, 16MHz | Mercado Livre, AliExpress |
| 1x | Módulo GPS NEO-6M | Com antena cerâmica | Mercado Livre, AliExpress |
| 1x | Módulo Relé 1 Canal | 5V, Active Low, 10A | Mercado Livre, AliExpress |
| 1x | Cabo USB Mini-B | Para programar Arduino | Qualquer loja de eletrônica |
| 6x | Jumpers macho-fêmea | 20cm | Qualquer loja de eletrônica |
| 1x | Fonte 5V 2A | Para alimentação | Qualquer loja de eletrônica |
| 1x | Protoboard | 400 pontos (opcional para teste) | Qualquer loja de eletrônica |

### Diagrama de Conexões

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARDUINO NANO                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [USB]  [D13] [D12] [D11] [D10] [D9] [D8] [D7] [D6] [D5] │   │
│  │         LED                                 ↓    ↓    ↓   │   │
│  │                                            GPS  GPS  RELÉ │   │
│  │                                            TX   RX   IN   │   │
│  │  [RST] [GND] [D2] [D3] [D4] [A7] [A6] [A5] [A4] [A3] [A2]│   │
│  │         ↓                                                  │   │
│  │        GND                                                 │   │
│  │                                                            │   │
│  │  [VIN] [GND] [RESET] [5V] [A0] [A1] [AREF] [3V3]         │   │
│  │               GND     ↓                                    │   │
│  │                      5V                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐      ┌──────────────────────────────┐
│    GPS NEO-6M Module    │      │   Relay Module (Active Low)  │
│  ┌───────────────────┐  │      │  ┌────────────────────────┐  │
│  │  VCC  [●]─────────┼──┼──────┼──┼─[●] VCC (5V)           │  │
│  │  GND  [●]─────────┼──┼──────┼──┼─[●] GND                │  │
│  │  TX   [●]─────────┼──┼──────┼──┼─[●] IN (Signal)        │  │
│  │  RX   [●]─────────┼──┘      │  │                         │  │
│  └───────────────────┘         │  │  [COM] [NC] [NO]        │  │
│         ↓ Antena               │  │   ↓     ↓    ↓          │  │
└─────────────────────────────────┘  │  Para controlar ignição │  │
                                     └────────────────────────┘  │
```

### Conexões Passo a Passo

#### **Conexão GPS NEO-6M ↔ Arduino Nano**

| GPS NEO-6M | Arduino Nano | Cor Sugerida | Observação |
|------------|--------------|--------------|------------|
| VCC | 5V | Vermelho | Alimentação 5V |
| GND | GND | Preto | Terra comum |
| TX | D6 (RX) | Amarelo | ⚠️ TX do GPS vai no RX do Arduino |
| RX | D7 (TX) | Laranja | ⚠️ RX do GPS vai no TX do Arduino |

> ⚠️ **IMPORTANTE**: TX e RX são invertidos! TX do GPS conecta no RX do Arduino e vice-versa.

#### **Conexão Módulo Relé ↔ Arduino Nano**

| Módulo Relé | Arduino Nano | Cor Sugerida | Observação |
|-------------|--------------|--------------|------------|
| VCC | 5V | Vermelho | Alimentação 5V |
| GND | GND | Preto | Terra comum |
| IN | D5 | Verde | Sinal de controle |

#### **Saída do Relé (Controle da Ignição)**

O relé tem 3 terminais de saída:

- **COM** (Common): Conecte ao fio de ignição do veículo
- **NO** (Normally Open): Conecte ao fio que ativa a ignição
- **NC** (Normally Closed): Não usar neste projeto

```
Circuito da Ignição do Veículo:
┌────────┐
│Bateria │ +12V ────┬─────────────────> [Sistema de Ignição]
└────────┘          │
                    │
                 ┌──┴──┐
                 │ COM │ Relé
                 └──┬──┘
                    │
              ┌─────┴─────┐
              │           │
           ┌──┴──┐     ┌──┴──┐
           │  NO │     │ NC  │
           └─────┘     └─────┘
              │
              └──────────────────> [Ignição Controlada]
```

### Montagem Física

#### **Passo 1: Protoboard (Teste)**

1. Fixe o Arduino Nano na protoboard
2. Conecte o GPS NEO-6M seguindo a tabela acima
3. Conecte o Módulo Relé seguindo a tabela acima
4. Verifique todas as conexões antes de ligar

#### **Passo 2: Teste Inicial**

1. Conecte apenas o Arduino via USB (sem relé ainda)
2. Faça upload do código
3. Abra Serial Monitor (9600 baud)
4. Verifique se aparecem dados do GPS

#### **Passo 3: Teste do Relé**

1. Com tudo desligado, conecte o relé
2. Ligue o Arduino via USB
3. Via Serial Monitor, envie: `TEST_LED_ON`
4. O LED do relé deve **acender** (módulo Active Low)
5. Envie: `TEST_LED_OFF`
6. O LED do relé deve **apagar**

#### **Passo 4: Instalação no Veículo (CUIDADO!)**

> ⚠️ **ATENÇÃO**: Esta etapa requer conhecimento em elétrica automotiva. Se não tiver experiência, contrate um profissional!

1. **Identifique o fio de ignição** do veículo (geralmente no painel, cor vermelha com listra preta)
2. **Corte o fio de ignição**
3. Conecte uma ponta ao **COM** do relé
4. Conecte a outra ponta ao **NO** do relé
5. Isole todas as conexões com fita isolante de alta qualidade
6. Fixe o Arduino e módulos em local protegido
7. Passe os cabos de forma organizada e segura

**Diagrama do Corte:**
```
Antes:
[Chave Ignição] ────────────────> [Sistema Elétrico]

Depois:
[Chave Ignição] ────> [COM] Relé [NO] ────> [Sistema Elétrico]
                           ↑
                      Arduino D5
```

### Posicionamento da Antena GPS

Para melhor recepção:
- ✅ Posicione próximo ao para-brisa
- ✅ Mantenha a face da antena voltada para cima (céu)
- ✅ Evite proximidade com peças metálicas
- ✅ Não cubra com películas ou insulfilm metalizado
- ❌ Não coloque dentro do porta-luvas
- ❌ Não coloque próximo ao motor (interferência)

---

## 🎮 Como Usar

### Primeiro Uso

#### **1. Iniciar Sistema**

**Terminal 1 - Servidor Java:**
```bash
cd imageserver
./mvnw spring-boot:run
```

**Terminal 2 - Python Gateway:**
```bash
cd python-server
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate    # Windows
python trackcar_mac.py
```

**Terminal 3 - Mobile App:**
```bash
cd TrackCar
npm start
```

#### **2. Criar Conta no App**

1. Abra o app no seu dispositivo (Expo Go ou emulador)
2. Tela de login: Toque em **"Criar Conta"**
3. Preencha:
   - Nome completo
   - E-mail
   - Senha (mínimo 6 caracteres)
   - Telefone (opcional)
4. Toque em **"Cadastrar"**
5. Faça login com as credenciais criadas

#### **3. Completar Perfil**

1. Na tela inicial, toque no ícone de perfil
2. Toque em **"Editar Perfil"**
3. Adicione uma foto (opcional)
4. Confirme seus dados
5. Toque em **"Salvar"**

#### **4. Cadastrar Primeiro Veículo**

1. Na tela principal, toque em **"+"** ou **"Adicionar Veículo"**
2. Preencha os dados obrigatórios:
   - **Marca**: Ex: Toyota
   - **Modelo**: Ex: Corolla
   - **Ano**: Ex: 2020
   - **Placa**: Ex: ABC-1234
   - **Cor**: Selecione uma cor
3. Dados opcionais:
   - Motor
   - RENAVAM
   - Chassi
   - Combustível
   - Descrição
4. Toque em **"Adicionar Foto"** e selecione uma imagem
5. Toque em **"Salvar"**

#### **5. Obter IDs e Configurar Gateway**

1. **Obter USER_ID**:
   - Firebase Console > Authentication
   - Copie o **User UID** do usuário criado

2. **Obter CAR_ID**:
   - Firebase Console > Firestore > Collection `cars`
   - Copie o **Document ID** do carro cadastrado

3. **Editar `trackcar_mac.py`**:
   ```python
   CAR_ID = "SeuCarIdAqui"
   USER_ID = "SeuUserIdAqui"
   ```

4. **Reinicie o Python Gateway**

### Rastreamento em Tempo Real

#### **Visualizar no Mapa**

1. Na lista de veículos, toque no carro desejado
2. A tela do mapa será aberta
3. Você verá:
   - 📍 Pin da localização atual
   - 🛰️ Número de satélites conectados
   - ⏱️ Última atualização
   - 🎯 Precisão em metros

#### **Interpretar Status GPS**

| Status | Descrição | Ação |
|--------|-----------|------|
| 🛰️ **GPS OK (8 sats)** | GPS funcionando perfeitamente | Nenhuma |
| ⏳ **Aguardando fix GPS (4 sats)** | GPS buscando mais satélites | Aguarde alguns minutos |
| 🔍 **Procurando GPS...** | GPS ainda não inicializou | Verifique antena e conexões |
| ⚠️ **GPS sem sinal há 30s** | Conexão perdida | Verifique Arduino/Python |

### Controle Remoto de Ignição

#### **Ligar/Desligar Ignição**

1. Na tela do veículo, localize o botão de ignição
2. **Estado atual**:
   - 🔴 **Desligado**: Botão vermelho
   - 🟢 **Ligado**: Botão verde
   - ⚪ **Desconhecido**: Botão cinza

3. **Para ligar**:
   - Toque no botão
   - Confirme a ação
   - Aguarde confirmação (LED do relé acende)

4. **Para desligar**:
   - Toque no botão novamente
   - Confirme a ação
   - Aguarde confirmação (LED do relé apaga)

#### **Fluxo Completo do Comando**

```
[App Mobile]
    ↓ Toque no botão
    ↓ Atualiza Firestore: ignitionState = "on"
    ↓
[Firebase Firestore]
    ↓ Trigger onSnapshot()
    ↓
[Python Gateway]
    ↓ Detecta mudança
    ↓ Envia comando serial: "IGNITION_ON\n"
    ↓
[Arduino]
    ↓ Recebe comando
    ↓ digitalWrite(RELE_PIN, LOW); // Active Low = Liga
    ↓ Envia ACK: {"type":"ack","ignitionState":"on"}
    ↓
[Python Gateway]
    ↓ Recebe ACK
    ↓ Log: "✅ Arduino confirmou: Ignição ON"
    ↓
[App Mobile]
    ↓ Atualiza UI: Botão verde
```

**Tempo médio**: 1-3 segundos

### Sistema Anti-Furto

#### **Reportar Veículo Roubado**

1. Na tela do veículo, toque em **"⋮" (menu)**
2. Selecione **"Reportar como Roubado"**
3. Confirme a data e hora do roubo
4. Toque em **"Confirmar"**
5. O veículo aparecerá na lista de **Veículos Roubados** para toda a comunidade

#### **Reportar Avistamento**

1. Na tela **"Roubados"**, navegue pelos veículos
2. Se avistar um veículo roubado, toque nele
3. Toque em **"Reportar Avistamento"**
4. Adicione:
   - Localização (usa GPS do celular automaticamente)
   - Foto (opcional)
   - Descrição (opcional)
5. Toque em **"Enviar"**
6. O proprietário receberá notificação

#### **Marcar como Recuperado**

1. Se encontrou seu veículo roubado
2. Entre na tela do veículo
3. Toque em **"⋮" (menu)**
4. Selecione **"Marcar como Recuperado"**
5. Confirme
6. O veículo será removido da lista de roubados

### Histórico e Relatórios

#### **Ver Trajeto Percorrido**

1. Na tela do veículo, toque em **"Histórico"**
2. Selecione o período:
   - Hoje
   - Últimos 7 dias
   - Últimos 30 dias
   - Personalizado
3. O mapa mostrará a rota com timestamps

#### **Exportar Dados**

1. Na tela de histórico, toque em **"⋮"**
2. Selecione **"Exportar"**
3. Escolha formato:
   - CSV
   - KML (Google Earth)
   - JSON
4. Compartilhe ou salve

---

## 🔧 Troubleshooting

### Problemas com GPS

#### ❌ GPS não obtém fix (fica em "Procurando...")

**Causas possíveis:**
- Antena mal posicionada
- Obstrução do sinal
- Cold start (primeira vez)

**Soluções:**
```bash
# 1. Verifique posição da antena
# - Deve estar voltada para o céu
# - Sem obstruções metálicas

# 2. Aguarde cold start
# Primeira inicialização pode levar 5-15 minutos

# 3. Reset GPS via Python Gateway
# Digite no terminal:
GPS_RESET
```

#### ❌ GPS funciona mas perde sinal frequentemente

**Causas:**
- Interferência eletromagnética
- Cabos muito longos
- Alimentação instável

**Soluções:**
```bash
# 1. Afaste de fontes de interferência
# - Motor do carro
# - Sistema de som potente
# - Carregadores USB baratos

# 2. Verifique alimentação
# Meça tensão no pino VCC do GPS (deve ser 4.5-5.5V)

# 3. Use cabos blindados
# Ou reduza comprimento dos jumpers
```

#### ❌ Coordenadas inválidas (0,0) ou muito erradas

**Soluções:**
```python
# Verifique conexões TX/RX
# TX do GPS deve ir no RX do Arduino (D6)
# RX do GPS deve ir no TX do Arduino (D7)

# Teste com Serial Monitor
# 1. Desconecte D6 e D7 do GPS
# 2. Conecte GPS direto no Serial do Arduino (RX=0, TX=1)
# 3. Abra Serial Monitor em 9600 baud
# 4. Você deve ver sentenças NMEA: $GPGGA, $GPRMC, etc.
```

### Problemas com Relé

#### ❌ Relé não responde a comandos

**Verificações:**

1. **Teste manual via Serial Monitor:**
```bash
# 1. Abra Serial Monitor (9600 baud)
# 2. Digite e envie:
TEST_LED_ON

# LED do relé deve acender
# Digite:
TEST_LED_OFF

# LED do relé deve apagar
```

2. **Verifique tipo do módulo:**
```cpp
// Módulo Active Low (maioria):
digitalWrite(RELE_PIN, LOW);  // Liga (LED acende)
digitalWrite(RELE_PIN, HIGH); // Desliga (LED apaga)

// Módulo Active High (raro):
// Se LED acende com HIGH, inverta a lógica no código
```

3. **Verifique alimentação:**
```bash
# Meça tensão no VCC do relé: deve ser ~5V
# Meça corrente: não deve ultrapassar 500mA
# Se ultrapassar, use fonte externa
```

#### ❌ Relé clica mas ignição não liga

**Causas:**
- Fiação do veículo errada
- Relé subdimensionado
- Fio de ignição errado

**Soluções:**
```bash
# 1. Teste o relé com multímetro
# - Modo continuidade
# - Sem energia: COM e NC têm continuidade
# - Com energia: COM e NO têm continuidade

# 2. Verifique corrente do circuito de ignição
# Pode ser maior que 10A
# Considere usar relé automotivo 30A

# 3. Confirme fio de ignição correto
# Use um multímetro para identificar
# Fio deve ter 12V quando chave ligada
```

### Problemas com Python Gateway

#### ❌ "Permission denied" ao acessar porta serial

**Linux:**
```bash
# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# Logout e login novamente
# Ou:
newgrp dialout

# Dar permissão à porta
sudo chmod 666 /dev/ttyUSB0
```

**Windows:**
```bash
# Verifique se porta está em uso
# Feche Arduino IDE Serial Monitor
# Feche outros programas que usam serial

# Liste portas disponíveis
python -c "import serial.tools.list_ports; [print(p.device) for p in serial.tools.list_ports.comports()]"
```

#### ❌ Firebase "Permission denied"

**Verificações:**

1. **Credenciais corretas:**
```bash
# Arquivo existe?
ls python-server/credentials/firebase-adminsdk.json

# Tem permissões?
chmod 644 python-server/credentials/firebase-adminsdk.json
```

2. **Conta de serviço tem permissões:**
```
Firebase Console > Configurações > Contas de Serviço
Verifique se o e-mail tem role: "Firebase Admin SDK Service Agent"
```

3. **IDs corretos:**
```python
# CAR_ID e USER_ID devem existir no Firestore
# Verifique no Firebase Console
```

#### ❌ Porta serial não encontrada

```bash
# Listar portas (Windows)
python -c "import serial.tools.list_ports; [print(f'{p.device}: {p.description}') for p in serial.tools.list_ports.comports()]"

# Listar portas (Linux/macOS)
ls /dev/tty*
ls /dev/cu.*

# Edite SERIAL_PORT em trackcar_mac.py
# Windows: 'COM3', 'COM4', 'COM5', etc.
# macOS: '/dev/cu.usbserial-XXXX'
# Linux: '/dev/ttyUSB0', '/dev/ttyACM0'
```

### Problemas com Mobile App

#### ❌ "Erro ao carregar veículos"

**Soluções:**

1. **Verifique conexão Firebase:**
```typescript
// services/firebase.ts
// Confirme que firebaseConfig está correto
console.log(app.name); // Deve mostrar "[DEFAULT]"
```

2. **Verifique regras Firestore:**
```javascript
// Firebase Console > Firestore > Regras
// Deve permitir leitura para usuários autenticados
match /cars/{carId} {
  allow read: if request.auth != null;
}
```

3. **Limpe cache:**
```bash
# Limpar cache do Expo
expo start -c

# Ou
npm start -- --clear
```

#### ❌ Upload de foto falha

**Verificações:**

1. **Servidor Java rodando:**
```bash
# Teste endpoint
curl http://localhost:8080/actuator/health

# Ou abra no navegador
http://localhost:8080
```

2. **IP correto no código:**
```typescript
// services/carService.ts
// Se usando dispositivo físico, use IP da sua máquina
const BASE_URL = 'http://SEU_IP:8080';

// Para descobrir IP:
# Windows: ipconfig
# Linux/macOS: ifconfig ou ip addr
```

3. **Firewall/antivírus:**
```bash
# Windows: Permita porta 8080 no Firewall
# Adicione exceção para Java

# macOS: System Preferences > Security > Firewall
# Permita conexões para Java
```

#### ❌ Mapa não carrega

**Android:**
```bash
# Adicione API Key do Google Maps
# android/app/src/main/AndroidManifest.xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="SUA_API_KEY_AQUI"/>
```

**iOS:**
```bash
# Adicione em ios/Runner/AppDelegate.swift
import GoogleMaps

GMSServices.provideAPIKey("SUA_API_KEY_AQUI")
```

### Problemas com MongoDB/Servidor Java

#### ❌ "MongoTimeoutException"

**Causas:**
- Whitelist de IPs incorreta
- Credenciais erradas
- Cluster pausado/deletado

**Soluções:**
```bash
# 1. Verifique Network Access no Atlas
# MongoDB Atlas > Network Access
# Deve ter 0.0.0.0/0 (desenvolvimento) ou seu IP

# 2. Verifique credenciais
# Teste connection string manualmente:
mongo "mongodb+srv://USER:PASS@cluster.mongodb.net/test"

# 3. Verifique status do cluster
# MongoDB Atlas > Database
# Status deve ser verde (Active)
```

#### ❌ "Authentication failed"

```bash
# 1. Verifique senha do usuário
# MongoDB Atlas > Database Access
# Resete senha se necessário

# 2. Verifique connection string
# Senha deve estar URL-encoded
# Caracteres especiais: @ = %40, # = %23, $ = %24

# 3. Recrie usuário se persistir
# Delete e crie novo usuário
```

### Comandos de Debug

#### Python Gateway

```bash
# Modo verbose (adicione ao código)
import logging
logging.basicConfig(level=logging.DEBUG)

# Teste de conectividade
python -c "import firebase_admin; print('Firebase OK')"
python -c "import serial; print('PySerial OK')"

# Teste serial sem Firebase
python -c "import serial; s=serial.Serial('COM8',9600); print(s.readline())"
```

#### Arduino

```cpp
// Adicione debug ao código
void loop() {
  Serial.println("Loop running");
  delay(1000);
}

// Verifique memória RAM livre
Serial.print("Free RAM: ");
Serial.println(getFreeRAM());
```

#### Firebase

```bash
# Teste regras do Firestore
# Firebase Console > Firestore > Regras > Simulador
# Teste com documento específico e usuário

# Ver logs em tempo real
# Firebase Console > Firestore > Dados de uso
```

---

## 📊 Monitoramento e Logs

### Logs do Python Gateway

O gateway exibe logs coloridos no terminal:

```bash
[INFO] 14:30:45 - ✅ Firebase inicializado com sucesso
[INFO] 14:30:46 - ✅ Serial conectada: COM8
[INFO] 14:30:50 - 💓 Heartbeat - Uptime: 45.2s | Comandos: 0 | Relé: desligado
[INFO] 14:31:00 - ✅ GPS salvo: -23.550520, -46.633309 (8 sats, 1234ms)
[WARN] 14:31:30 - ⏳ GPS procurando satélites... (4 sats encontrados)
[ERROR] 14:32:00 - ❌ Erro ao salvar GPS: Permission denied
```

**Tipos de log:**
- `[INFO]`: Informações normais
- `[WARN]`: Avisos (não crítico)
- `[ERROR]`: Erros (requer atenção)
- `[DEBUG]`: Debug detalhado

### Verificar Saúde do Sistema

#### Status do Arduino
```bash
# Via Python Gateway, digite:
STATUS

# Resposta esperada:
{
  "type": "status",
  "relay": "desligado",
  "ignition": "off",
  "commands": 5,
  "validGPS": 42,
  "gpsInit": true,
  "uptime": 3600
}
```

#### Status do Firebase
```bash
# Firebase Console > Firestore > cars/[CAR_ID]
# Verifique campos:
lastLocationUpdate: [deve ser recente]
ignitionState: "on" | "off" | "unknown"
gpsStatus.active: true
gpsStatus.satellites: [número > 4]
```

#### Status do MongoDB
```bash
# MongoDB Atlas > Metrics
# Verifique:
- Connections: Deve ter pelo menos 1
- Network In/Out: Deve ter atividade
- Operations: Deve mostrar reads/writes
```

---

## 🔐 Segurança e Boas Práticas

### Antes de Publicar (Tornar Repositório Público)

#### ✅ Checklist de Segurança

```markdown
- [ ] Remover todas as API Keys do código
- [ ] Remover credenciais do MongoDB
- [ ] Remover credenciais do Firebase
- [ ] Remover IDs de carros e usuários
- [ ] Criar arquivos .example
- [ ] Atualizar .gitignore
- [ ] Limpar histórico do Git (se necessário)
- [ ] Adicionar instruções de configuração no README
- [ ] Testar instalação em máquina limpa
```

#### Arquivos a Serem Criados

1. **`services/firebase.ts.example`**
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

2. **`python-server/config.example.py`**
```python
CAR_ID = "YOUR_CAR_DOCUMENT_ID"
USER_ID = "YOUR_FIREBASE_USER_ID"
SERIAL_PORT = 'COM8'  # Adjust for your system
```

3. **`imageserver/src/main/resources/application.properties.example`**
```properties
spring.data.mongodb.uri=${MONGODB_URI}
spring.data.mongodb.database=${MONGODB_DATABASE:trackcardb}
```

#### Atualizar .gitignore

```bash
# Adicione ao .gitignore
echo "services/firebase.ts" >> .gitignore
echo "python-server/config.py" >> .gitignore
echo "python-server/credentials/" >> .gitignore
echo "imageserver/src/main/resources/application.properties" >> .gitignore
echo "**/.env" >> .gitignore
echo "*.env" >> .gitignore
```

### Proteção do MongoDB

```bash
# 1. Use variáveis de ambiente
export MONGODB_URI="mongodb+srv://..."

# 2. Whitelist apenas IPs necessários
# MongoDB Atlas > Network Access
# Remova 0.0.0.0/0

# 3. Use senhas fortes
# Mínimo 16 caracteres, com letras, números e símbolos

# 4. Ative auditoria
# MongoDB Atlas > Database > Advanced > Audit Logs
```

### Proteção do Firebase

```javascript
// Regras de segurança rígidas
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Apenas donos podem modificar
    match /cars/{carId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
        isOwner(resource.data.userId);
    }
  }
}
```

---

## 👥 Desenvolvedores

<div align="center">

### Equipe TrackCar

| Rafael Trilha | João Pedro |
|:-------------:|:----------:|
| [![Rafael](https://img.shields.io/badge/GitHub-rafatrilhaf-181717?style=for-the-badge&logo=github)](https://github.com/rafatrilhaf) | [![João](https://img.shields.io/badge/GitHub-joaojotarc-181717?style=for-the-badge&logo=github)](https://github.com/joaojotarc) |
| Backend & Hardware | Frontend & Mobile |

</div>

---

## 🎓 Trabalho de Conclusão de Curso

Este projeto foi desenvolvido como **Trabalho de Conclusão de Curso (TCC)** pelos alunos Rafael Trilha e João Pedro.

**Instituição**: [Nome da Instituição]  
**Curso**: [Nome do Curso]  
**Orientador**: [Nome do Orientador]  
**Ano**: 2025

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

```
MIT License

Copyright (c) 2025 Rafael Trilha e João Pedro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Agradecimentos

- **Arduino Community** - Pela plataforma open-source e bibliotecas
- **Expo Team** - Pela excelente ferramenta de desenvolvimento mobile
- **Firebase** - Pela infraestrutura backend robusta e gratuita
- **MongoDB Atlas** - Pelo banco de dados cloud confiável
- **Mikal Hart** - Pela biblioteca TinyGPS
- **Comunidade Open Source** - Por todas as ferramentas e inspiração
- **Orientador(a)** - Pelo suporte e orientação durante o desenvolvimento
- **Família e Amigos** - Pelo apoio incondicional

---

## 📞 Suporte e Contato

### Reportar Bugs

Encontrou um bug? Por favor, abra uma [Issue no GitHub](https://github.com/rafatrilhaf/TrackCar/issues) com:

- 🐛 Descrição detalhada do problema
- 📋 Passos para reproduzir
- 💻 Sistema operacional e versões
- 📸 Screenshots (se aplicável)
- 📝 Logs de erro

### Contribuir

Quer contribuir? Veja nosso [Guia de Contribuição](CONTRIBUTING.md) (em breve).

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Contato

- 📧 **E-mail**: [criar e-mail do projeto]
- 💬 **Discord**: [criar servidor Discord] (em breve)
- 📱 **WhatsApp**: [Grupo de Suporte] (em breve)

---

## 🗺️ Roadmap

### Versão 2.0 (Planejado)

- [ ] **App**
  - [ ] Notificações push
  - [ ] Modo escuro
  - [ ] Múltiplos idiomas
  - [ ] Widget para tela inicial
  
- [ ] **Backend**
  - [ ] API REST própria
  - [ ] Websockets para real-time
  - [ ] Sistema de notificações
  
- [ ] **Hardware**
  - [ ] Suporte a ESP32 (WiFi/Bluetooth)
  - [ ] Sensores adicionais (temperatura, velocidade)
  - [ ] Bateria backup
  
- [ ] **Funcionalidades**
  - [ ] Geofencing (cercas virtuais)
  - [ ] Alertas de velocidade
  - [ ] Relatórios detalhados
  - [ ] Compartilhamento de veículos

### Versão 3.0 (Futuro)

- [ ] Machine Learning para detecção de padrões
- [ ] Integração com assistentes virtuais (Alexa, Google)
- [ ] Aplicativo para smartwatch
- [ ] Dashboard web completo
- [ ] API pública para desenvolvedores

---

## 📚 Documentação Adicional

- 📖 [Wiki do Projeto](https://github.com/rafatrilhaf/TrackCar/wiki) - Em breve
- 🎥 [Vídeos Tutoriais](https://youtube.com/...) - Em breve
- 📊 [Apresentação do TCC](docs/apresentacao.pdf) - Em breve
- 📄 [Artigo Científico](docs/artigo.pdf) - Em breve

---

## ⭐ Estatísticas

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/rafatrilhaf/TrackCar?style=social)
![GitHub forks](https://img.shields.io/github/forks/rafatrilhaf/TrackCar?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/rafatrilhaf/TrackCar?style=social)

![GitHub repo size](https://img.shields.io/github/repo-size/rafatrilhaf/TrackCar)
![GitHub language count](https://img.shields.io/github/languages/count/rafatrilhaf/TrackCar)
![GitHub top language](https://img.shields.io/github/languages/top/rafatrilhaf/TrackCar)
![GitHub last commit](https://img.shields.io/github/last-commit/rafatrilhaf/TrackCar)

</div>

---

<div align="center">

### 🚗 TrackCar - Seu Veículo Sempre Conectado 📍

**Desenvolvido com ❤️ por Rafael Trilha e João Pedro**

[![GitHub](https://img.shields.io/badge/GitHub-TrackCar-181717?style=for-the-badge&logo=github)](https://github.com/rafatrilhaf/TrackCar)

---

**Se este projeto foi útil para você, deixe uma ⭐!**

</div>