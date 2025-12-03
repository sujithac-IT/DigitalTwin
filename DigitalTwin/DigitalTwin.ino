#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ----------- LCD SETTINGS -----------
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ----------- DHT11 SETTINGS -----------
#define DHTPIN 4
#define DHTTYPE DHT11
#define LEDPIN 2
DHT dht(DHTPIN, DHTTYPE);

// ----------- VOLTAGE SENSOR SETTINGS -----------
const int analogPinVoltage = 34;
const float adcMax = 4095.0;
const float refVoltage = 4.0;
float R1 = 33000.0;
float R2 = 10000.0;

// ----------- ACS712 CURRENT SENSOR SETTINGS -----------
const int analogPinCurrent = 35;
float ACS_offset = 0.6;
float sensitivity = 0.10;

// ----------- HARDWARE SERIAL (ESP32) -----------
HardwareSerial GSM(1);  // UART1 for SIM800L
HardwareSerial GPS(2);  // UART2 for GPS

// ----------- PHONE NUMBERS -----------
String phone1 = "+918148186059";
String phone2 = "+919842021273";
String phone3 = "+918760519157";

// ----------- GPS OBJECT ----------
TinyGPSPlus gps;

// ----------- WIFI SETTINGS ----------
const char* ssid = "iPhone";
const char* password = "albatross@18";

// ----------- BACKEND API URL ----------
String serverURL = "http://192.168.1.8:5000/data";

// ===================================================
// SEND SMS FUNCTION (uses GSM hardware serial)
// ===================================================
void sendSMS(const String &number, const String &message) {
  // set text mode
  GSM.println("AT+CMGF=1");
  delay(300);
  // send command to start SMS to number
  GSM.print("AT+CMGS=\"");
  GSM.print(number);
  GSM.println("\"");
  delay(300);
  // send message body
  GSM.print(message);
  // send ctrl+Z to transmit
  GSM.write(26);
  delay(2000);
}

// ===================================================
// SEND DATA TO FASTAPI SERVER
// ===================================================
void sendToServer(float volt, float curr, float temp, float lat, float lon) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi Not Connected - skipping POST");
    return;
  }

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"voltage\":" + String(volt, 2) + ",";
  json += "\"current\":" + String(curr, 2) + ",";
  json += "\"temperature\":" + String(temp, 2) + ",";
  json += "\"latitude\":" + String(lat, 6) + ",";
  json += "\"longitude\":" + String(lon, 6);
  json += "}";

  Serial.println("📤 Sending Data to " + serverURL);
  Serial.println(json);

  int code = http.POST(json);
  Serial.print("Server Response Code: ");
  Serial.println(code);
  if (code > 0) {
    String payload = http.getString();
    Serial.println("Response: " + payload);
  } else {
    Serial.println("HTTP POST failed, error: " + http.errorToString(code));
  }
  http.end();
}

// ===================================================
// SETUP
// ===================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // Start GSM and GPS UARTs (RX, TX)
  // UART1: RX=16  -> connect SIM800L TX to GPIO16
  //        TX=17  -> connect SIM800L RX to GPIO17
  GSM.begin(9600, SERIAL_8N1, 16, 17);

  // UART2: RX=26  -> connect GPS TX to GPIO26
  //        TX=27  -> connect GPS RX to GPIO27
  GPS.begin(9600, SERIAL_8N1, 26, 27);

  // Initialize peripherals
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  delay(1200);
  lcd.clear();

  dht.begin();
  pinMode(LEDPIN, OUTPUT);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // Connect WiFi
  Serial.print("🌐 Connecting to WiFi ");
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) { // try 15s
    Serial.print(".");
    delay(300);
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✔ WiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠ WiFi NOT connected (continuing without network).");
  }

  // Basic SIM800L check
  GSM.println("AT");
  delay(500);
  while (GSM.available()) {
    Serial.write(GSM.read()); // print any response from GSM module to Serial
  }

  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  delay(800);
  lcd.clear();
}

// ===================================================
// LOOP
// ===================================================
void loop() {
  // ----------- READ VOLTAGE -----------
  int rawVoltage = analogRead(analogPinVoltage);
  float adcVoltage = ( (float)rawVoltage / adcMax ) * refVoltage;
  float batteryVoltage = adcVoltage * ((R1 + R2) / R2);

  // ----------- READ CURRENT -----------
  const int samples = 100;
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(analogPinCurrent);
    delayMicroseconds(200);
  }
  float avgRaw = sum / (float)samples;
  float sensorVoltage = (avgRaw / adcMax) * refVoltage;
  float current = (sensorVoltage - ACS_offset) / sensitivity;
  if (abs(current) < 0.1) current = 0;

  // ----------- READ TEMPERATURE -----------
  float temperature = dht.readTemperature();

  // ----------- READ GPS DATA -----------
  while (GPS.available()) {
    gps.encode(GPS.read());
  }
  bool gpsValid = gps.location.isValid();
  float latitude  = gpsValid ? (float)gps.location.lat() : 0.0;
  float longitude = gpsValid ? (float)gps.location.lng() : 0.0;

  // ----------- PRINT TO SERIAL -----------
  Serial.println("===== SENSOR DATA =====");
  Serial.print("Voltage: "); Serial.println(batteryVoltage, 2);
  Serial.print("Current: "); Serial.println(current, 2);
  Serial.print("Temp: ");    Serial.println(temperature, 2);
  if (gpsValid) {
    Serial.print("Lat: "); Serial.println(latitude, 6);
    Serial.print("Lon: "); Serial.println(longitude, 6);
  } else {
    Serial.println("GPS: No Fix");
  }
  Serial.println("======================\n");

  // ----------- PRINT TO LCD -----------
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("V:");
  lcd.print(batteryVoltage, 2);
  lcd.print("V");

  lcd.setCursor(0, 1);
  lcd.print("I:");
  lcd.print(current, 2);
  lcd.print("A");

  lcd.setCursor(0, 2);
  lcd.print("T:");
  if (!isnan(temperature)) lcd.print(temperature, 1);
  else lcd.print("---");
  lcd.print("C");

  lcd.setCursor(0, 3);
  if (gpsValid) {
    lcd.print("Lat:");
    lcd.print(latitude, 4);
    lcd.print("L:");
    lcd.print(longitude, 4);
  } else {
    lcd.print("GPS No Fix");
  }

  // ----------- SEND DATA TO BACKEND (non-blocking attempt) -----------
  sendToServer(batteryVoltage, current, temperature, latitude, longitude);

  // ----------- TEMPERATURE ALERT SMS -----------
  if (!isnan(temperature) && temperature > 35.0) {
    digitalWrite(LEDPIN, HIGH);

    String msg =
      "ALERT!\nTemp=" + String(temperature, 1) + "C\n" +
      "Volt=" + String(batteryVoltage, 2) + "V\n" +
      "Curr=" + String(current, 2) + "A\n" +
      "Lat=" + String(latitude, 6) + "\n" +
      "Lon=" + String(longitude, 6);

    // Send to three numbers
    sendSMS(phone1, msg);
    delay(500);
    sendSMS(phone2, msg);
    delay(500);
    sendSMS(phone3, msg);
    delay(5000); // wait to avoid spam
  } else {
    digitalWrite(LEDPIN, LOW);
  }

  delay(1000); // main loop delay
}
