#!/usr/bin/env python3
"""
TRACKCAR - WINDOWS GATEWAY v2.3
Arduino Nano → Firebase + Controle Relé + GPS Debug
Versão adaptada para Windows
"""

import json
import serial
import time
from datetime import datetime
from threading import Thread, Lock
import firebase_admin
from firebase_admin import credentials, firestore
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
CAR_ID = "Ddvv3GsUr7G62kKnPepq"
USER_ID = "27qJowctifNiM8AOlhI2Q7aw6Vn1"

# Variáveis globais
ser = None
db = None
serial_lock = Lock()
last_heartbeat = 0

# ✅ NOVO: Controle de estado para evitar comandos repetitivos
last_ignition_state = 'unknown'
last_command_time = 0
COMMAND_COOLDOWN = 5  # 5 segundos entre comandos iguais

# ✅ NOVO: Status GPS para atualização na tela
gps_status = {
    'initialized': False,
    'satellites': 0,
    'last_valid': 0,
    'total_reads': 0,
    'valid_count': 0,
    'last_age': 999999,
    'fix_time': None
}

# ==============================================================================
# FUNÇÕES DE LOG PERSONALIZADAS (sem arquivo)
# ==============================================================================

def log_info(message):
    """Log de informações (apenas console)"""
    print(f"[INFO] {datetime.now().strftime('%H:%M:%S')} - {message}")

def log_warning(message):
    """Log de avisos (apenas console)"""
    print(f"[WARN] {datetime.now().strftime('%H:%M:%S')} - {message}")

def log_error(message):
    """Log de erros (apenas console)"""
    print(f"[ERROR] {datetime.now().strftime('%H:%M:%S')} - {message}")

def log_debug(message):
    """Log de debug (apenas console)"""
    print(f"[DEBUG] {datetime.now().strftime('%H:%M:%S')} - {message}")

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
        
        # ✅ ATUALIZADO: Procura na pasta credentials primeiro
        credential_files = [
            'credentials/firebase-adminsdk.json',  # Nova localização
            'credentials/trackcar-firebase-adminsdk.json',
            'firebase-credentials.json',  # Fallback
            'serviceAccountKey.json',
            'trackcar-firebase-key.json'
        ]
        
        credential_path = None
        for file in credential_files:
            if os.path.exists(file):
                credential_path = file
                break
        
        if not credential_path:
            log_error("❌ Arquivo de credenciais Firebase não encontrado!")
            log_info("📋 Coloque o arquivo JSON na pasta 'credentials/':")
            log_info("   credentials/firebase-adminsdk.json")
            log_info("   Baixe do Firebase Console > Project Settings > Service accounts")
            input("Pressione Enter para sair...")
            exit(1)
        
        cred = credentials.Certificate(credential_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        
        log_info(f"✅ Firebase inicializado com sucesso usando {credential_path}")
        return db
        
    except Exception as e:
        log_error(f"❌ Erro ao inicializar Firebase: {e}")
        log_info("💡 Verifique se o arquivo de credenciais está correto")
        input("Pressione Enter para sair...")
        exit(1)

def listar_portas_disponiveis():
    """Lista portas seriais disponíveis no Windows"""
    import serial.tools.list_ports
    
    portas = list(serial.tools.list_ports.comports())
    if portas:
        log_info("Portas COM disponíveis no Windows:")
        for porta in portas:
            log_info(f"  - {porta.device}: {porta.description}")
        return [porta.device for porta in portas]
    else:
        log_warning("Nenhuma porta COM encontrada")
        return []

def init_serial():
    """Inicializa conexão serial com Arduino - Versão Windows"""
    global ser
    try:
        ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
        time.sleep(2)  # Aguarda reset do Arduino
        log_info(f"✅ Serial conectada: {SERIAL_PORT}")
        return ser
    except Exception as e:
        log_error(f"❌ Erro ao conectar serial: {e}")
        log_info(f"\n⚠️  Porta esperada: {SERIAL_PORT}")
        
        # Lista portas disponíveis no Windows
        portas_disponiveis = listar_portas_disponiveis()
        
        if portas_disponiveis:
            log_info(f"\n💡 Tente alterar SERIAL_PORT para uma dessas portas:")
            for porta in portas_disponiveis:
                log_info(f"   SERIAL_PORT = '{porta}'")
        
        response = input("\n🤔 Continuar sem Arduino para teste? (s/N): ")
        if response.lower() == 's':
            log_warning("⚠️  Modo teste: continuando sem Arduino")
            return None
        else:
            input("Pressione Enter para sair...")
            exit(1)

# ==============================================================================
# FUNÇÕES FIREBASE
# ==============================================================================

def save_gps_location(data):
    """Salva localização no Firestore"""
    try:
        if not data.get('valid', False):
            # ✅ MELHORADO: Log mais detalhado
            age = data.get('age', 999999)
            sats = data.get('sats', 0)
            gps_init = data.get('gpsInit', False)
            
            if not gps_init:
                log_warning(f"⏳ GPS procurando satélites... ({sats} sats encontrados)")
            elif age > 10000:
                log_warning(f"⏰ GPS dados muito antigos - {age/1000:.1f}s ({sats} sats)")
            else:
                log_warning(f"❌ GPS inválido - Age: {age}ms, Sats: {sats}")
            return False
        
        lat = data.get('lat', 0)
        lon = data.get('lon', 0)
        sats = data.get('sats', 0)
        age = data.get('age', 0)
        
        if lat == 0 and lon == 0:
            log_warning("⚠️  Coordenadas inválidas (0,0) - ignorando")
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
        
        # ✅ NOVO: Atualiza carro E salva status GPS no Firebase
        car_ref = db.collection('cars').document(CAR_ID)
        car_ref.update({
            'lastLatitude': lat,
            'lastLongitude': lon,
            'lastLocationUpdate': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            # ✅ NOVO: Status GPS para o app
            'gpsStatus': {
                'active': True,
                'satellites': sats,
                'accuracy': age,
                'lastUpdate': firestore.SERVER_TIMESTAMP
            }
        })
        
        # ✅ NOVO: Atualiza status local
        global gps_status
        gps_status.update({
            'initialized': True,
            'satellites': sats,
            'last_valid': time.time(),
            'last_age': age,
            'fix_time': datetime.now().strftime('%H:%M:%S') if not gps_status['fix_time'] else gps_status['fix_time']
        })
        
        log_info(f"✅ GPS salvo: {lat:.6f}, {lon:.6f} ({sats} sats, {age}ms)")
        return True
        
    except Exception as e:
        log_error(f"❌ Erro ao salvar GPS: {e}")
        return False

# ✅ NOVA: Função para atualizar status GPS na tela
def update_gps_status_in_firebase():
    """Atualiza status do GPS no Firebase para exibir na tela"""
    try:
        car_ref = db.collection('cars').document(CAR_ID)
        
        # Calcula tempo sem GPS válido
        time_without_gps = 0
        if gps_status['last_valid'] > 0:
            time_without_gps = int(time.time() - gps_status['last_valid'])
        
        status_text = "🔍 Procurando GPS..."
        if gps_status['initialized']:
            if time_without_gps <= 30:
                status_text = f"🛰️ GPS OK ({gps_status['satellites']} sats)"
            else:
                status_text = f"⚠️ GPS sem sinal há {time_without_gps}s"
        elif gps_status['satellites'] > 0:
            status_text = f"⏳ Aguardando fix GPS ({gps_status['satellites']} sats)"
        
        car_ref.update({
            'gpsStatusText': status_text,
            'gpsStatusDetails': {
                'initialized': gps_status['initialized'],
                'satellites': gps_status['satellites'],
                'lastValidSeconds': time_without_gps,
                'totalReads': gps_status['total_reads'],
                'validCount': gps_status['valid_count'],
                'lastAge': gps_status['last_age'],
                'fixTime': gps_status['fix_time']
            },
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
    except Exception as e:
        log_debug(f"Erro ao atualizar status GPS: {e}")

# ==============================================================================
# CONTROLE DO RELÉ
# ==============================================================================

def enviar_comando_arduino(comando):
    """Envia comando para Arduino via Serial com retry"""
    global ser
    
    if ser is None:
        log_warning("⚠️  Modo teste: simulando comando Arduino")
        log_info(f"🎭 SIMULADO: {comando}")
        return True
    
    with serial_lock:
        for tentativa in range(3):
            try:
                if not ser.is_open:
                    log_warning("⚠️  Serial não disponível")
                    return False
                
                comando_completo = f"{comando}\n"
                ser.write(comando_completo.encode())
                ser.flush()
                
                log_info(f"📤 Comando enviado (tentativa {tentativa + 1}): {comando}")
                
                time.sleep(0.5)
                if ser.in_waiting > 0:
                    response = ser.readline().decode('utf-8', errors='ignore').strip()
                    log_info(f"📥 Resposta do Arduino: {response}")
                
                return True
                
            except Exception as e:
                log_error(f"❌ Erro ao enviar comando (tentativa {tentativa + 1}): {e}")
                time.sleep(1)
        
        return False

def resetar_gps():
    """Envia comando para resetar GPS"""
    if enviar_comando_arduino('GPS_RESET'):
        log_info("🔄 GPS resetado - aguardando novo fix...")
        # Reset status local
        global gps_status
        gps_status.update({
            'initialized': False,
            'fix_time': None
        })
    return True

def processar_mudanca_ignicao(new_state):
    """Processa mudança de ignição do app"""
    global last_ignition_state, last_command_time
    
    current_time = time.time()
    
    # Evita comandos repetitivos
    if (new_state == last_ignition_state and 
        (current_time - last_command_time) < COMMAND_COOLDOWN):
        log_debug(f"🚫 Comando {new_state} ignorado (cooldown de {COMMAND_COOLDOWN}s)")
        return
    
    log_info(f"\n🔔 Firebase → ignitionState = {new_state}")
    
    if new_state == 'on':
        success = enviar_comando_arduino('IGNITION_ON')
        emoji = "🔓" if success else "❌"
        log_info(f"{emoji} Comando LIGAR ignição - {'Enviado' if success else 'Falhou'}")
    elif new_state == 'off':
        success = enviar_comando_arduino('IGNITION_OFF')
        emoji = "🔒" if success else "❌"
        log_info(f"{emoji} Comando DESLIGAR ignição - {'Enviado' if success else 'Falhou'}")
    else:
        log_warning(f"⚠️  Estado desconhecido: {new_state}")
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
        
        log_info(f"👂 Escutando mudanças: cars/{CAR_ID}/ignitionState")
        return doc_watch
    except Exception as e:
        log_error(f"❌ Erro ao configurar listener: {e}")
        return None

# ==============================================================================
# PROCESSAMENTO DE DADOS DO ARDUINO
# ==============================================================================

def processar_linha_arduino(line):
    """Processa linha recebida do Arduino"""
    global last_heartbeat, gps_status
    
    if not line.strip():
        return
    
    if line.startswith("TRACKCAR_READY"):
        log_info("✅ Arduino pronto!\n")
        return
    
    try:
        data = json.loads(line)
        data_type = data.get('type', 'unknown')
        
        if data_type == 'gps':
            # ✅ NOVO: Atualiza estatísticas GPS
            gps_status['total_reads'] += 1
            gps_status['satellites'] = data.get('sats', 0)
            gps_status['last_age'] = data.get('age', 999999)
            
            if data.get('valid', False):
                gps_status['valid_count'] += 1
            
            save_gps_location(data)
            
        elif data_type == 'ack':
            ignition_state = data.get('ignitionState', 'unknown')
            emoji = "🔓" if ignition_state == "on" else "🔒"
            log_info(f"{emoji} Arduino confirmou: Ignição {ignition_state.upper()}")
            
        elif data_type == 'heartbeat':
            last_heartbeat = time.time()
            uptime = data.get('uptime', 0) / 1000
            commands = data.get('commands', 0)
            rele = data.get('rele', 'unknown')
            gps_status_text = data.get('gpsStatus', 'unknown')
            valid_gps = data.get('validGPS', 0)
            
            log_info(f"💓 Heartbeat - Uptime: {uptime:.1f}s | Comandos: {commands} | Relé: {rele} | GPS: {gps_status_text} ({valid_gps} válidos)")
            
            # ✅ NOVO: Atualiza status na tela a cada heartbeat
            update_gps_status_in_firebase()
            
        elif data_type == 'debug':
            log_debug(f"🐛 Debug: {data.get('received', 'N/A')}")
            
        elif data_type == 'error':
            log_error(f"❌ Arduino erro: {data.get('message', 'Erro desconhecido')}")
            
        elif data_type == 'system':
            message = data.get('message', 'Mensagem do sistema')
            log_info(f"🔧 Sistema: {message}")
            
            # ✅ NOVO: Detecta quando GPS consegue fix
            if "GPS fix obtido" in message:
                gps_status['initialized'] = True
                gps_status['fix_time'] = datetime.now().strftime('%H:%M:%S')
                log_info("🎉 PRIMEIRO FIX GPS OBTIDO!")
                
    except json.JSONDecodeError:
        log_warning(f"⚠️  Linha não é JSON: {line}")
    except Exception as e:
        log_error(f"❌ Erro ao processar linha: {e}")

# ==============================================================================
# TESTE DE FIREBASE
# ==============================================================================

def teste_firebase():
    """Testa conexão com Firebase"""
    try:
        log_info("🧪 Testando conexão Firebase...")
        
        car_ref = db.collection('cars').document(CAR_ID)
        car_doc = car_ref.get()
        
        if car_doc.exists:
            data = car_doc.to_dict()
            log_info(f"✅ Carro encontrado: {data.get('brand', 'N/A')} {data.get('model', 'N/A')}")
            log_info(f"🔧 Estado ignição: {data.get('ignitionState', 'unknown')}")
            return True
        else:
            log_warning(f"⚠️  Documento do carro não encontrado: {CAR_ID}")
            log_info("💡 Verifique se o CAR_ID está correto ou crie o carro no app")
            return False
            
    except Exception as e:
        log_error(f"❌ Erro no teste Firebase: {e}")
        return False

# ==============================================================================
# MAIN LOOP
# ==============================================================================

def main():
    global ser, db, last_heartbeat, last_ignition_state
    
    print("\n" + "="*60)
    print("  TRACKCAR - WINDOWS GATEWAY v2.3")
    print("  Arduino Nano → Firebase + Controle Relé + GPS Debug")
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
                log_info(f"🔧 Estado inicial da ignição: {last_ignition_state}")
        except:
            pass
    
    # Inicializa Serial
    ser = init_serial()
    
    # Inicia listener do Firebase
    print(f"\n🚗 Veículo monitorado: {CAR_ID}")
    print(f"📡 Aguardando dados do Arduino...")
    print(f"🔔 Escutando mudanças de ignitionState...")
    print(f"⏱️  Cooldown entre comandos: {COMMAND_COOLDOWN}s")
    print(f"🛰️  Status GPS será atualizado na tela do app automaticamente")
    print(f"\n💡 Comandos disponíveis:")
    print(f"   - Ctrl+C: Sair")
    print(f"   - Digite 'GPS_RESET' + Enter: Resetar GPS")
    print(f"   - Digite 'STATUS' + Enter: Status manual\n")
    
    listener = escutar_ignition_state()
    last_heartbeat = time.time()
    
    # ✅ NOVO: Thread para comandos manuais
    def input_thread():
        while True:
            try:
                cmd = input().strip().upper()
                if cmd == 'GPS_RESET':
                    resetar_gps()
                elif cmd == 'STATUS':
                    enviar_comando_arduino('STATUS')
                elif cmd:
                    enviar_comando_arduino(cmd)
            except:
                break
    
    import threading
    threading.Thread(target=input_thread, daemon=True).start()
    
    # Loop principal
    try:
        contador = 0
        status_update_counter = 0
        while True:
            if ser and ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                processar_linha_arduino(line)
            
            elif ser is None:
                contador += 1
                if contador >= 300:  # 30 segundos
                    contador = 0
                    log_info("🎭 Modo teste: simulando dados GPS...")
                    fake_gps = {
                        'type': 'gps',
                        'lat': -23.5505 + (time.time() % 100) * 0.0001,
                        'lon': -46.6333 + (time.time() % 100) * 0.0001,
                        'sats': 8,
                        'age': 1000,
                        'valid': True
                    }
                    save_gps_location(fake_gps)
            
            # ✅ NOVO: Atualiza status GPS na tela a cada 30 segundos
            status_update_counter += 1
            if status_update_counter >= 300:  # 30 segundos
                status_update_counter = 0
                update_gps_status_in_firebase()
            
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Encerrando...")
        if listener:
            listener.unsubscribe()
        if ser:
            ser.close()
        log_info("✅ Sistema encerrado com sucesso")
        print("Até logo! 👋\n")
        input("Pressione Enter para sair...")

if __name__ == "__main__":
    main()
