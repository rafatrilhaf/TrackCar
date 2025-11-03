#!/usr/bin/env python3
"""
TRACKCAR - WINDOWS GATEWAY v2.2
Arduino Nano → Firebase + Controle Relé
Versão adaptada para Windows
"""

import json
import serial
import time
from datetime import datetime
from threading import Thread, Lock
import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os
import platform

# ==============================================================================
# CONFIGURAÇÕES
# ==============================================================================

# Serial do Arduino - Configuração multiplataforma
if platform.system() == "Windows":
    SERIAL_PORT = 'COM8'  # Altere conforme necessário (COM3, COM4, COM5, etc.)
elif platform.system() == "Darwin":  # macOS
    SERIAL_PORT = '/dev/cu.usbserial-1140'
else:  # Linux
    SERIAL_PORT = '/dev/ttyUSB0'

SERIAL_BAUD = 9600

# ID do veículo
CAR_ID = "N5B2e9xahFllTGASIDLE"
USER_ID = "87If5SbgxrePsQX761VTfYBz5GF2"

# Variáveis globais
ser = None
db = None
serial_lock = Lock()
last_heartbeat = 0

# ✅ NOVO: Controle de estado para evitar comandos repetitivos
last_ignition_state = 'unknown'
last_command_time = 0
COMMAND_COOLDOWN = 5  # 5 segundos entre comandos iguais

# Setup de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trackcar.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==============================================================================
# INICIALIZAÇÃO
# ==============================================================================

def init_firebase():
    """Inicializa Firebase Admin SDK usando arquivo JSON"""
    global db
    try:
        if firebase_admin._apps:
            db = firestore.client()
            return db
        
        # Procura arquivo de credenciais
        credential_files = [
            'firebase-credentials.json',
            'serviceAccountKey.json',
            'trackcar-firebase-key.json'
        ]
        
        credential_path = None
        for file in credential_files:
            if os.path.exists(file):
                credential_path = file
                break
        
        if not credential_path:
            logger.error("❌ Arquivo de credenciais Firebase não encontrado!")
            logger.info("📋 Crie um arquivo 'firebase-credentials.json' com suas credenciais")
            logger.info("   Baixe do Firebase Console > Project Settings > Service accounts")
            input("Pressione Enter para sair...")
            exit(1)
        
        cred = credentials.Certificate(credential_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        
        logger.info(f"✅ Firebase inicializado com sucesso usando {credential_path}")
        return db
        
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar Firebase: {e}")
        logger.info("💡 Verifique se o arquivo de credenciais está correto")
        input("Pressione Enter para sair...")
        exit(1)

def listar_portas_disponiveis():
    """Lista portas seriais disponíveis no Windows"""
    import serial.tools.list_ports
    
    portas = list(serial.tools.list_ports.comports())
    if portas:
        logger.info("Portas COM disponíveis no Windows:")
        for porta in portas:
            logger.info(f"  - {porta.device}: {porta.description}")
        return [porta.device for porta in portas]
    else:
        logger.warning("Nenhuma porta COM encontrada")
        return []

def init_serial():
    """Inicializa conexão serial com Arduino - Versão Windows"""
    global ser
    try:
        ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
        time.sleep(2)  # Aguarda reset do Arduino
        logger.info(f"✅ Serial conectada: {SERIAL_PORT}")
        return ser
    except Exception as e:
        logger.error(f"❌ Erro ao conectar serial: {e}")
        logger.info(f"\n⚠️  Porta esperada: {SERIAL_PORT}")
        
        # Lista portas disponíveis no Windows
        portas_disponiveis = listar_portas_disponiveis()
        
        if portas_disponiveis:
            logger.info(f"\n💡 Tente alterar SERIAL_PORT para uma dessas portas:")
            for porta in portas_disponiveis:
                logger.info(f"   SERIAL_PORT = '{porta}'")
        
        response = input("\n🤔 Continuar sem Arduino para teste? (s/N): ")
        if response.lower() == 's':
            logger.warning("⚠️  Modo teste: continuando sem Arduino")
            return None
        else:
            input("Pressione Enter para sair...")
            exit(1)

# ==============================================================================
# FUNÇÕES FIREBASE (mantidas iguais)
# ==============================================================================

def save_gps_location(data):
    """Salva localização no Firestore"""
    try:
        if not data.get('valid', False):
            logger.warning("⚠️  GPS sem fix válido - ignorando")
            return False
        
        lat = data.get('lat', 0)
        lon = data.get('lon', 0)
        sats = data.get('sats', 0)
        age = data.get('age', 0)
        
        if lat == 0 and lon == 0:
            logger.warning("⚠️  Coordenadas inválidas - ignorando")
            return False
        
        location_data = {
            'carId': CAR_ID,
            'userId': USER_ID,
            'latitude': lat,
            'longitude': lon,
            'satellites': sats,
            'accuracy': age,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'status': 'active',
            'source': 'arduino'
        }
        
        db.collection('gps_locations').add(location_data)
        
        # Atualiza carro mas SEM alterar ignitionState
        car_ref = db.collection('cars').document(CAR_ID)
        car_ref.update({
            'lastLatitude': lat,
            'lastLongitude': lon,
            'lastLocationUpdate': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        logger.info(f"✅ GPS salvo: {lat:.6f}, {lon:.6f} ({sats} sats)")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao salvar GPS: {e}")
        return False

# ==============================================================================
# CONTROLE DO RELÉ (mantidas iguais)
# ==============================================================================

def enviar_comando_arduino(comando):
    """Envia comando para Arduino via Serial com retry"""
    global ser
    
    if ser is None:
        logger.warning("⚠️  Modo teste: simulando comando Arduino")
        logger.info(f"🎭 SIMULADO: {comando}")
        return True
    
    with serial_lock:
        for tentativa in range(3):
            try:
                if not ser.is_open:
                    logger.warning("⚠️  Serial não disponível")
                    return False
                
                comando_completo = f"{comando}\n"
                ser.write(comando_completo.encode())
                ser.flush()
                
                logger.info(f"📤 Comando enviado (tentativa {tentativa + 1}): {comando}")
                
                time.sleep(0.5)
                if ser.in_waiting > 0:
                    response = ser.readline().decode('utf-8', errors='ignore').strip()
                    logger.info(f"📥 Resposta do Arduino: {response}")
                
                return True
                
            except Exception as e:
                logger.error(f"❌ Erro ao enviar comando (tentativa {tentativa + 1}): {e}")
                time.sleep(1)
        
        return False

def processar_mudanca_ignicao(new_state):
    """Processa mudança de ignição do app"""
    global last_ignition_state, last_command_time
    
    current_time = time.time()
    
    # Evita comandos repetitivos
    if (new_state == last_ignition_state and 
        (current_time - last_command_time) < COMMAND_COOLDOWN):
        logger.debug(f"🚫 Comando {new_state} ignorado (cooldown de {COMMAND_COOLDOWN}s)")
        return
    
    logger.info(f"\n🔔 Firebase → ignitionState = {new_state}")
    
    if new_state == 'on':
        success = enviar_comando_arduino('IGNITION_ON')
        emoji = "🔓" if success else "❌"
        logger.info(f"{emoji} Comando LIGAR ignição - {'Enviado' if success else 'Falhou'}")
    elif new_state == 'off':
        success = enviar_comando_arduino('IGNITION_OFF')
        emoji = "🔒" if success else "❌"
        logger.info(f"{emoji} Comando DESLIGAR ignição - {'Enviado' if success else 'Falhou'}")
    else:
        logger.warning(f"⚠️  Estado desconhecido: {new_state}")
        return
    
    # Atualiza controle de estado
    last_ignition_state = new_state
    last_command_time = current_time

def escutar_ignition_state():
    """Thread que escuta mudanças no ignitionState do Firebase"""
    
    def on_snapshot(doc_snapshot, changes, read_time):
        for doc in doc_snapshot:
            data = doc.to_dict()
            ignition_state = data.get('ignitionState', 'unknown')
            processar_mudanca_ignicao(ignition_state)
    
    try:
        car_ref = db.collection('cars').document(CAR_ID)
        doc_watch = car_ref.on_snapshot(on_snapshot)
        
        logger.info(f"👂 Escutando mudanças: cars/{CAR_ID}/ignitionState")
        return doc_watch
    except Exception as e:
        logger.error(f"❌ Erro ao configurar listener: {e}")
        return None

# ==============================================================================
# PROCESSAMENTO DE DADOS DO ARDUINO (mantidas iguais)
# ==============================================================================

def processar_linha_arduino(line):
    """Processa linha recebida do Arduino"""
    global last_heartbeat
    
    if not line.strip():
        return
    
    if line.startswith("TRACKCAR_READY"):
        logger.info("✅ Arduino pronto!\n")
        return
    
    try:
        data = json.loads(line)
        data_type = data.get('type', 'unknown')
        
        if data_type == 'gps':
            save_gps_location(data)
            
        elif data_type == 'ack':
            ignition_state = data.get('ignitionState', 'unknown')
            emoji = "🔓" if ignition_state == "on" else "🔒"
            logger.info(f"{emoji} Arduino confirmou: Ignição {ignition_state.upper()}")
            
        elif data_type == 'heartbeat':
            last_heartbeat = time.time()
            uptime = data.get('uptime', 0) / 1000
            commands = data.get('commands', 0)
            rele = data.get('rele', 'unknown')
            logger.info(f"💓 Heartbeat - Uptime: {uptime:.1f}s | Comandos: {commands} | Relé: {rele}")
            
        elif data_type == 'debug':
            logger.debug(f"🐛 Debug: {data.get('received', 'N/A')}")
            
        elif data_type == 'error':
            logger.error(f"❌ Arduino erro: {data.get('message', 'Erro desconhecido')}")
            
        elif data_type == 'system':
            logger.info(f"🔧 Sistema: {data.get('message', 'Mensagem do sistema')}")
            
    except json.JSONDecodeError:
        logger.warning(f"⚠️  Linha não é JSON: {line}")
    except Exception as e:
        logger.error(f"❌ Erro ao processar linha: {e}")

# ==============================================================================
# TESTE DE FIREBASE (mantidas iguais)
# ==============================================================================

def teste_firebase():
    """Testa conexão com Firebase"""
    try:
        logger.info("🧪 Testando conexão Firebase...")
        
        car_ref = db.collection('cars').document(CAR_ID)
        car_doc = car_ref.get()
        
        if car_doc.exists:
            data = car_doc.to_dict()
            logger.info(f"✅ Carro encontrado: {data.get('brand', 'N/A')} {data.get('model', 'N/A')}")
            logger.info(f"🔧 Estado ignição: {data.get('ignitionState', 'unknown')}")
            return True
        else:
            logger.warning(f"⚠️  Documento do carro não encontrado: {CAR_ID}")
            logger.info("💡 Verifique se o CAR_ID está correto ou crie o carro no app")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erro no teste Firebase: {e}")
        return False

# ==============================================================================
# MAIN LOOP (mantidas iguais)
# ==============================================================================

def main():
    global ser, db, last_heartbeat, last_ignition_state
    
    print("\n" + "="*60)
    print("  TRACKCAR - WINDOWS GATEWAY v2.2")
    print("  Arduino Nano → Firebase + Controle Relé")
    print("  Versão adaptada para Windows")
    print("="*60 + "\n")
    
    # Inicializa Firebase
    db = init_firebase()
    
    # Testa Firebase
    if teste_firebase():
        # Carrega estado inicial da ignição
        try:
            car_ref = db.collection('cars').document(CAR_ID)
            car_doc = car_ref.get()
            if car_doc.exists:
                data = car_doc.to_dict()
                last_ignition_state = data.get('ignitionState', 'unknown')
                logger.info(f"🔧 Estado inicial da ignição: {last_ignition_state}")
        except:
            pass
    
    # Inicializa Serial
    ser = init_serial()
    
    # Inicia listener do Firebase
    print(f"\n🚗 Veículo monitorado: {CAR_ID}")
    print(f"📡 Aguardando dados do Arduino...")
    print(f"🔔 Escutando mudanças de ignitionState...")
    print(f"⏱️  Cooldown entre comandos: {COMMAND_COOLDOWN}s\n")
    
    listener = escutar_ignition_state()
    last_heartbeat = time.time()
    
    # Loop principal
    try:
        contador = 0
        while True:
            if ser and ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                processar_linha_arduino(line)
            
            elif ser is None:
                contador += 1
                if contador >= 300:  # 30 segundos
                    contador = 0
                    logger.info("🎭 Modo teste: simulando dados GPS...")
                    fake_gps = {
                        'type': 'gps',
                        'lat': -23.5505 + (time.time() % 100) * 0.0001,
                        'lon': -46.6333 + (time.time() % 100) * 0.0001,
                        'sats': 8,
                        'age': 1000,
                        'valid': True
                    }
                    save_gps_location(fake_gps)
            
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Encerrando...")
        if listener:
            listener.unsubscribe()
        if ser:
            ser.close()
        logger.info("✅ Sistema encerrado com sucesso")
        print("Até logo! 👋\n")
        input("Pressione Enter para sair...")

if __name__ == "__main__":
    main()
