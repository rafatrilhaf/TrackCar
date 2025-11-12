/*
 * TRACKCAR - ARDUINO NANO v2.3 - LÓGICA INVERTIDA PARA MÓDULO RELÉ
 * GPS NEO-6M + RELÉ com Active Low (lógica invertida)
 * ✅ CORRIGIDO: Para módulos relé que ligam com sinal LOW
 */


#include <SoftwareSerial.h>
#include <TinyGPS.h>


// Configurações
SoftwareSerial serialGPS(6, 7);  // RX=D6, TX=D7
TinyGPS gps;


// Pino do Relé
const int RELE_PIN = 5;  // D5
const int LED_STATUS = 13; // LED interno para debug


// Variáveis de estado
bool releState = false;  // false = desligado, true = ligado
unsigned long lastSend = 0;
unsigned long lastHeartbeat = 0;
const unsigned long SEND_INTERVAL = 5000;  // 5 segundos
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 segundos


// Controle de GPS melhorado
unsigned long lastValidGPS = 0;
bool gpsInitialized = false;


// Contadores para debug
int validGPSCount = 0;
int commandsReceived = 0;
int totalGPSReads = 0;


void setup() {
  // Comunicação com Python
  Serial.begin(9600);
  
  // Comunicação com GPS
  serialGPS.begin(9600);
  
  // ✅ CORRIGIDO: Lógica invertida para módulo relé Active Low
  pinMode(RELE_PIN, OUTPUT);
  pinMode(LED_STATUS, OUTPUT);
  digitalWrite(RELE_PIN, HIGH);  // ✅ HIGH = Relé DESLIGADO (lógica invertida)
  digitalWrite(LED_STATUS, LOW);
  releState = false;  // Estado inicial: desligado
  
  // Aguarda estabilização
  delay(2000);
  
  Serial.println("TRACKCAR_READY_V2.3_INVERTED");
  Serial.println("{\"type\":\"system\",\"message\":\"Arduino inicializado - Módulo relé Active Low detectado\"}");
}


void loop() {
  // Lê comandos do Python
  if (Serial.available()) {
    processarComando();
  }
  
  // Lê dados do GPS continuamente
  bool newGPSData = false;
  while (serialGPS.available()) {
    char c = serialGPS.read();
    totalGPSReads++;
    if (gps.encode(c)) {
      newGPSData = true;
    }
  }
  
  // Verifica se GPS obteve fix válido
  if (newGPSData) {
    float lat, lon;
    unsigned long age;
    gps.f_get_position(&lat, &lon, &age);
    int sats = gps.satellites();
    
    if (lat != TinyGPS::GPS_INVALID_F_ANGLE && 
        lon != TinyGPS::GPS_INVALID_F_ANGLE && 
        age < 10000 &&
        sats >= 4) {
      
      if (!gpsInitialized) {
        gpsInitialized = true;
        Serial.println("{\"type\":\"system\",\"message\":\"GPS fix obtido com sucesso!\"}");
      }
    }
  }
  
  // Envia dados GPS periodicamente
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    enviarDadosGPS();
  }
  
  // Heartbeat para monitoramento
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    enviarHeartbeat();
  }
  
  // Pisca LED para mostrar que está funcionando
  if (millis() % 2000 < 100) {
    digitalWrite(LED_STATUS, HIGH);
  } else {
    digitalWrite(LED_STATUS, LOW);
  }
}


void enviarDadosGPS() {
  float lat, lon;
  unsigned long age;
  int sats;
  
  gps.f_get_position(&lat, &lon, &age);
  sats = gps.satellites();
  
  bool isValid = (lat != TinyGPS::GPS_INVALID_F_ANGLE && 
                  lon != TinyGPS::GPS_INVALID_F_ANGLE && 
                  age < 10000 &&
                  sats >= 4 &&
                  lat != 0.0 && lon != 0.0);
  
  if (isValid) {
    validGPSCount++;
    lastValidGPS = millis();
  }
  
  Serial.print("{");
  Serial.print("\"type\":\"gps\",");
  Serial.print("\"lat\":");
  Serial.print(lat, 6);
  Serial.print(",\"lon\":");
  Serial.print(lon, 6);
  Serial.print(",\"sats\":");
  Serial.print(sats);
  Serial.print(",\"age\":");
  Serial.print(age);
  Serial.print(",\"ignitionState\":\"");
  Serial.print(releState ? "on" : "off");
  Serial.print("\",\"valid\":");
  Serial.print(isValid ? "true" : "false");
  Serial.print(",\"uptime\":");
  Serial.print(millis());
  Serial.print(",\"validCount\":");
  Serial.print(validGPSCount);
  Serial.print(",\"totalReads\":");
  Serial.print(totalGPSReads);
  Serial.print(",\"gpsInit\":");
  Serial.print(gpsInitialized ? "true" : "false");
  
  int year;
  byte month, day, hour, minute, second, hundredths;
  unsigned long dateAge;
  gps.crack_datetime(&year, &month, &day, &hour, &minute, &second, &hundredths, &dateAge);
  
  if (year > 2000) {
    Serial.print(",\"gpsTime\":\"");
    Serial.print(year); Serial.print("-");
    if (month < 10) Serial.print("0"); Serial.print(month); Serial.print("-");
    if (day < 10) Serial.print("0"); Serial.print(day); Serial.print(" ");
    if (hour < 10) Serial.print("0"); Serial.print(hour); Serial.print(":");
    if (minute < 10) Serial.print("0"); Serial.print(minute); Serial.print(":");
    if (second < 10) Serial.print("0"); Serial.print(second);
    Serial.print("\"");
  }
  
  Serial.println("}");
}


void enviarHeartbeat() {
  Serial.print("{");
  Serial.print("\"type\":\"heartbeat\",");
  Serial.print("\"uptime\":");
  Serial.print(millis());
  Serial.print(",\"commands\":");
  Serial.print(commandsReceived);
  Serial.print(",\"rele\":\"");
  Serial.print(releState ? "ligado" : "desligado");
  Serial.print("\",\"releLED\":\"");
  Serial.print(releState ? "aceso" : "apagado");
  Serial.print("\",\"freeRam\":");
  Serial.print(getFreeRAM());
  Serial.print(",\"gpsStatus\":\"");
  Serial.print(gpsInitialized ? "fixed" : "searching");
  Serial.print("\",\"validGPS\":");
  Serial.print(validGPSCount);
  Serial.print(",\"lastValid\":");
  Serial.print(lastValidGPS > 0 ? (millis() - lastValidGPS) / 1000 : 999);
  Serial.println("}");
}


void processarComando() {
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  commandsReceived++;
  
  Serial.print("{\"type\":\"debug\",\"received\":\"");
  Serial.print(cmd);
  Serial.println("\"}");
  
  // ✅ CORRIGIDO: Lógica INVERTIDA para módulo Active Low
  if (cmd == "IGNITION_ON" || cmd == "RELE_ON") {
    digitalWrite(RELE_PIN, LOW);   // ✅ LOW = Relé LIGADO (Active Low)
    releState = true;
    Serial.println("{\"type\":\"ack\",\"ignitionState\":\"on\",\"command\":\"executed\"}");
    Serial.println("{\"type\":\"system\",\"message\":\"Relé LIGADO - LED aceso (Active Low)\"}");
  } 
  else if (cmd == "IGNITION_OFF" || cmd == "RELE_OFF") {
    digitalWrite(RELE_PIN, HIGH);  // ✅ HIGH = Relé DESLIGADO (Active Low)
    releState = false;
    Serial.println("{\"type\":\"ack\",\"ignitionState\":\"off\",\"command\":\"executed\"}");
    Serial.println("{\"type\":\"system\",\"message\":\"Relé DESLIGADO - LED apagado (Active Low)\"}");
  }
  else if (cmd == "STATUS") {
    enviarStatus();
  }
  else if (cmd == "GPS_RESET") {
    gpsInitialized = false;
    validGPSCount = 0;
    totalGPSReads = 0;
    Serial.println("{\"type\":\"system\",\"message\":\"GPS resetado - aguardando novo fix\"}");
  }
  else if (cmd == "RESET") {
    Serial.println("{\"type\":\"ack\",\"message\":\"Reiniciando Arduino...\"}");
    delay(1000);
    asm volatile ("  jmp 0");
  }
  // Comandos de teste
  else if (cmd == "TEST_LED_ON") {
    digitalWrite(RELE_PIN, LOW);  // Active Low: LOW liga
    Serial.println("{\"type\":\"system\",\"message\":\"Teste: LED ligado (LOW - Active Low)\"}");
  }
  else if (cmd == "TEST_LED_OFF") {
    digitalWrite(RELE_PIN, HIGH);  // Active Low: HIGH desliga
    Serial.println("{\"type\":\"system\",\"message\":\"Teste: LED desligado (HIGH - Active Low)\"}");
  }
  else {
    Serial.print("{\"type\":\"error\",\"message\":\"Comando desconhecido: ");
    Serial.print(cmd);
    Serial.println("\"}");
  }
}


void enviarStatus() {
  Serial.print("{");
  Serial.print("\"type\":\"status\",");
  Serial.print("\"relay\":\"");
  Serial.print(releState ? "ligado" : "desligado");
  Serial.print("\",\"relayLED\":\"");
  Serial.print(releState ? "aceso" : "apagado");
  Serial.print("\",\"relayPin\":\"");
  Serial.print(digitalRead(RELE_PIN) == HIGH ? "HIGH" : "LOW");
  Serial.print("\",\"relayLogic\":\"Active Low (invertido)");
  Serial.print("\",\"ignition\":\"");
  Serial.print(releState ? "on" : "off");
  Serial.print("\",\"commands\":");
  Serial.print(commandsReceived);
  Serial.print(",\"validGPS\":");
  Serial.print(validGPSCount);
  Serial.print(",\"gpsInit\":");
  Serial.print(gpsInitialized ? "true" : "false");
  Serial.print(",\"uptime\":");
  Serial.print(millis() / 1000);
  Serial.println("}");
}


int getFreeRAM() {
  extern int __heap_start, *__brkval; 
  int v; 
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval); 
}
