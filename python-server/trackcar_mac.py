#!/usr/bin/env python3
"""
TRACKCAR - MAC GATEWAY
Lê dados do Arduino via Serial e envia para Firebase
+ Escuta mudanças de ignitionState no Firebase e controla relé
"""

import serial
import json
import time
from datetime import datetime
from threading import Thread
import firebase_admin
from firebase_admin import credentials, firestore

# ==============================================================================
# CONFIGURAÇÕES
# ==============================================================================

# Serial do Arduino
SERIAL_PORT = '/dev/cu.usbserial-1140'
SERIAL_BAUD = 9600

# Firebase Config (suas credenciais)
FIREBASE_CONFIG = {
  "type": "service_account",
  "project_id": "trackcar-27dbe",
  "private_key_id": "c137f70ca946295b2de85d06b1f2ca9563626bf9",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCXvmQZt352/PzE\n6gfMhvUouMWGXEBPchDCWzYy0Jf3dMPLVw2fVDdTlm4VjfhC4pySJ9tAnYOlRbmR\ni1ubl2v98ghbH8OevjqpqHZB3TcmofoGiWY4DWhrKHKbAh7qsU20D16JxqseMtEH\nSbIwMvmXc6b+1eWT26Ivjt7ZbPiOBNUL9NfEdCz/m15jzOhb6ZxeUkEaNGbgxFkC\nNKwD2Zvt7jtrglQ9Zt4EK302oBCR/3JPKIgevt/u0adsuEmmNwFZPloK1wIoddhr\nIWXPvVEQr5aZdtAx/rO2qUia49tu/ZwD9s3rVH80o8beHmToPnubFLCJcGlpQYKq\nCPy8yFrTAgMBAAECggEAD0mQlyCr3nv1UTdMqtfL2hrnV3Zyyi4xLwt2Zd8q+DSs\nxw8RocQfwM2OcKB5au+em4Dlb1iPGzbvj5CtHXs/V3mrStbj49nBWjdNFqydMkiu\nQjtUb4A2TVlpVmF70OQk8md7/EBmG+g9s9DCYWW5TH9Lyy+sbd16NPVdUSVP0yrU\nuebdYw5RsNLH5Ebbeb63A6n5u3O96T9kABzurkYMOz6JqgPWawRVsspeepbYa39K\nXXQof98pd61Vdy3MTT0oRd4mPrtaX1OKBhbwxQiEG9mmyhOSn6L1O+kuyHahi8zc\nGH3h0v1XSossEVoTg/B2d/Ql9pJPhyeP0QeWIR6lgQKBgQDLoHPDm9eF3+0odAid\nv+M9OzcnV6tDEa6KtM7MFRq8x4C9PUA5RhtzDFq/5DB3l4DNd5b817NZVQuA0ylQ\nj6k97qHLdvDgBHiPj37ogw1DFi/0RzukyWQq4uN4cl3vAFKFnuhw9nDS49mzdl70\nG0a/1xKIXOf3Sjlw9SnP2bgjgQKBgQC+xcPB54XsE4uswTqx6qs+nHJsACqsntvo\nanr+pwGemc5o+D9CEwvhLsEfdWWTCGzuDkbPf28y0WvXrS/X/mZPqHopJtN/sX7e\n0+GoDEszNLnOzfsqqe7t6f4zgklSGSheIYOZ2tjEVw16ioCdIx9h82d0goV01jFO\nOlotWCDYUwKBgFIIR9rL052pQn+Dj10NytwGGQgOd35Dh09128G31teqf6C9Jjxs\nk+5bUcvwf94N+OPNg9REiYo5irLRXtmHpqS+mAvB1PRKmM8s/fFpqlQWgick81BF\nmcb1NLJ3UIRSWuxdwkKP5Y/wHun/i+1Hd88dM+gflYu4KT/qZHfJvDcBAoGAfl2b\nbM7Ci/zqcVVRXta19fRFarq1icB0pEAcFqBjVz5EVo3RwR/Cp7eDnyXxUXKsTQfR\n6dJcwwmraKLEZUuTU8KioK2iPRxCkLFC8UCrc1DCn3UboUgNBzUO9+meTa5yad/D\nP1+SZIPRXtFtnijMueI0Lh3i7uCOqmXGo/CTWRcCgYEAoqx+i8ZGckrW3ns/b+Pd\nfF/pKP7KCTu1VZIGsLKPtRqBtt7WnK9eVCoDUkNYZGwNWtSYsGaeEHj0lFcSoU8J\ny+z0saLdsCgU1/B2VEaGYPjNg8zESBahn/wk2ZWWx7VXKjuWNLKm1BI8PWKWBNK7\nLRZkoJV1vHF+BzloGCDSmks=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@trackcar-27dbe.iam.gserviceaccount.com",
  "client_id": "108050558538244521567",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40trackcar-27dbe.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

# ID do veículo
CAR_ID = "N5B2e9xahFllTGASIDLE"

# ID do usuário
USER_ID = "87If5SbgxrePsQX761VTfYBz5GF2"

# Serial global
ser = None

# ==============================================================================
# INICIALIZAÇÃO FIREBASE
# ==============================================================================

def init_firebase():
    """Inicializa Firebase Admin SDK"""
    try:
        if firebase_admin._apps:
            return firestore.client()
        
        cred = credentials.Certificate(FIREBASE_CONFIG)
        firebase_admin.initialize_app(cred)
        
        print("✅ Firebase inicializado com sucesso")
        return firestore.client()
    except Exception as e:
        print(f"❌ Erro ao inicializar Firebase: {e}")
        exit(1)

# ==============================================================================
# SERIAL
# ==============================================================================

def init_serial():
    """Inicializa conexão serial com Arduino"""
    try:
        s = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=2)
        time.sleep(2)  # Aguarda reset do Arduino
        print(f"✅ Serial conectada: {SERIAL_PORT}")
        return s
    except Exception as e:
        print(f"❌ Erro ao conectar serial: {e}")
        print(f"\n⚠️  Porta esperada: {SERIAL_PORT}")
        print("\nPortas disponíveis no Mac:")
        import glob
        ports = glob.glob('/dev/cu.*')
        for port in ports:
            print(f"  - {port}")
        exit(1)

# ==============================================================================
# FUNÇÕES FIREBASE
# ==============================================================================

def save_gps_location(db, data):
    """Salva localização no Firestore"""
    try:
        if not data.get('valid', False):
            print("⚠️  GPS sem fix válido - ignorando")
            return False
        
        lat = data.get('lat', 0)
        lon = data.get('lon', 0)
        sats = data.get('sats', 0)
        age = data.get('age', 0)
        
        if lat == 0 and lon == 0:
            print("⚠️  Coordenadas inválidas - ignorando")
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
        
        car_ref = db.collection('cars').document(CAR_ID)
        car_ref.update({
            'lastLatitude': lat,
            'lastLongitude': lon,
            'lastLocationUpdate': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        print(f"✅ GPS salvo: {lat:.6f}, {lon:.6f} ({sats} sats)")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao salvar GPS: {e}")
        return False

# ==============================================================================
# CONTROLE DO RELÉ
# ==============================================================================

def enviar_comando_rele(estado):
    """Envia comando para Arduino via Serial"""
    global ser
    
    try:
        if ser is None or not ser.is_open:
            print("⚠️  Serial não disponível")
            return False
        
        if estado == 'on':
            ser.write(b'RELE_ON\n')
            print("🔓 Comando enviado: RELÉ LIGADO")
        elif estado == 'off':
            ser.write(b'RELE_OFF\n')
            print("🔒 Comando enviado: RELÉ DESLIGADO")
        else:
            print(f"⚠️  Estado inválido: {estado}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao enviar comando: {e}")
        return False

def escutar_ignition_state(db):
    """Thread que escuta mudanças no ignitionState do Firebase"""
    
    def on_snapshot(doc_snapshot, changes, read_time):
        for doc in doc_snapshot:
            data = doc.to_dict()
            ignition_state = data.get('ignitionState', 'unknown')
            
            print(f"\n🔔 Firebase atualizado: ignitionState = {ignition_state}")
            
            if ignition_state == 'on':
                enviar_comando_rele('on')
            elif ignition_state == 'off':
                enviar_comando_rele('off')
            else:
                print(f"⚠️  Estado desconhecido: {ignition_state}")
    
    # Escuta em tempo real o documento do carro
    car_ref = db.collection('cars').document(CAR_ID)
    doc_watch = car_ref.on_snapshot(on_snapshot)
    
    print(f"👂 Escutando mudanças em: cars/{CAR_ID}/ignitionState")
    
    return doc_watch

# ==============================================================================
# MAIN LOOP
# ==============================================================================

def main():
    global ser
    
    print("\n" + "="*60)
    print("  TRACKCAR - MAC GATEWAY")
    print("  Arduino Nano → Firebase + Controle Relé")
    print("="*60 + "\n")
    
    # Inicializa Firebase
    db = init_firebase()
    
    # Inicializa Serial
    ser = init_serial()
    
    # Inicia thread para escutar ignitionState
    print(f"\n🚗 Veículo: {CAR_ID}")
    print(f"📡 Aguardando dados do Arduino...")
    print(f"⏱️  Intervalo GPS: 10 segundos")
    print(f"🔔 Escutando mudanças de ignitionState...\n")
    
    # Escuta Firebase em thread separada
    listener = escutar_ignition_state(db)
    
    # Loop principal (GPS)
    try:
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                
                if not line:
                    continue
                
                if line == "TRACKCAR_READY":
                    print("✅ Arduino pronto!\n")
                    continue
                
                try:
                    data = json.loads(line)
                    
                    if data.get('type') == 'gps':
                        save_gps_location(db, data)
                    
                    elif data.get('type') == 'ack':
                        rele_estado = data.get('rele', 'unknown')
                        emoji = "🔓" if rele_estado == "on" else "🔒"
                        print(f"{emoji} Arduino confirmou: Relé {rele_estado.upper()}")
                    
                except json.JSONDecodeError:
                    print(f"⚠️  Linha não é JSON: {line}")
            
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Encerrando...")
        listener.unsubscribe()
        ser.close()
        print("✅ Serial fechada")
        print("✅ Listener Firebase fechado")
        print("Até logo! 👋\n")

# ==============================================================================
# EXECUÇÃO
# ==============================================================================

if __name__ == "__main__":
    main()
