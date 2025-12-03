#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"
#include <TinyGPS.h>
#include <WiFi.h>              
#include <HTTPClient.h>        

// -------------------- LCD SETTINGS --------------------
LiquidCrystal_I2C lcd(0x27, 20, 4);

// -------------------- DHT11 SETTINGS --------------------
#define DHTPIN 4
#define DHTTYPE DHT11
#define LEDPIN 2
DHT dht(DHTPIN, DHTTYPE);

// -------------------- VOLTAGE SENSOR SETTINGS --------------------
const int analogPinVoltage = 34;
const float adcMax = 4095.0;
const float refVoltage = 4.0;
float R1 = 33000.0;
float R2 = 10000.0;

// -------------------- ACS712 CURRENT SENSOR SETTINGS --------------------
const int analogPinCurrent = 35;
float ACS_offset = 0.6;
float sensitivity = 0.10;

// -------------------- GPS & GSM --------------------
TinyGPS gps;
float latitude = 0, longitude = 0;

// -------------------- WIFI SETTINGS --------------------
const char* ssid = "Airtel_mahe_9475";          
const char* password = "air53178";  

// -------------------- BACKEND URL --------------------
String serverURL = "http://192.168.1.8:5000/data"; 

// ===================================================
// SEND DATA TO FASTAPI BACKEND
// ===================================================
void sendToServer(float volt, float curr, float temp, float lat, float lon) {
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    return;
  }

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  // Prepare JSON
  String jsonData = "{";
  jsonData += "\"voltage\":" + String(volt, 2) + ",";
  jsonData += "\"current\":" + String(curr, 2) + ",";
  jsonData += "\"temperature\":" + String(temp, 2) + ",";
  jsonData += "\"latitude\":" + String(lat, 6) + ",";
  jsonData += "\"longitude\":" + String(lon, 6);
  jsonData += "}";

  Serial.println("📤 Sending JSON to server:");
  Serial.println(jsonData);

  int httpCode = http.POST(jsonData);

  if (httpCode > 0) {
    Serial.print("✔ Server Response Code: ");
    Serial.println(httpCode);
    Serial.println(http.getString());
  } else {
    Serial.print("❌ Error sending POST: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}


// ===================================================
// SETUP
// ===================================================
void setup() {
  Serial.begin(9600);

  Serial1.begin(9600, SERIAL_8N1, 26, 27);  // GPS
  Serial2.begin(9600, SERIAL_8N1, 16, 17);  // GSM

  lcd.init();
  lcd.backlight();

  dht.begin();
  pinMode(LEDPIN, OUTPUT);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.println("📡 System Ready");

  // ---------------- WIFI CONNECT ----------------
  Serial.println("🌐 Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✔ WiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}



// ===================================================
// LOOP
// ===================================================
void loop() {

  // ------------ VOLTAGE READING ------------
  int rawVoltage = analogRead(analogPinVoltage);
  float adcVoltage = (rawVoltage / adcMax) * refVoltage;
  float batteryVoltage = adcVoltage * ((R1 + R2) / R2);

  // ------------ CURRENT READING ------------
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

  // ------------ TEMPERATURE READING ------------
  float temperature = dht.readTemperature();

  // ------------ GPS READING ------------
  while (Serial1.available()) {
    if (gps.encode(Serial1.read())) {
      gps.f_get_position(&latitude, &longitude);
    }
  }

  // ------------ LCD DISPLAY ------------
  lcd.clear();
  lcd.setCursor(0, 0);  lcd.print("V:"); lcd.print(batteryVoltage, 2);
  lcd.setCursor(0, 1);  lcd.print("I:"); lcd.print(current, 2);
  lcd.setCursor(0, 2);  lcd.print("Temp:"); lcd.print(temperature);
  lcd.setCursor(0, 3);  lcd.print("Lat:"); lcd.print(latitude, 2);
  lcd.setCursor(10, 3); lcd.print("Lon:"); lcd.print(longitude, 2);



  // ------------------------------
  // SEND TO BACKEND EVERY LOOP
  // ------------------------------
  sendToServer(batteryVoltage, current, temperature, latitude, longitude);



  // ===================================================
  // CONDITION 1: HIGH TEMPERATURE
  // ===================================================
  if (!isnan(temperature) && temperature > 35) {
    digitalWrite(LEDPIN, HIGH);
    sendTempAlertSMS(temperature, batteryVoltage, current, latitude, longitude);
    delay(5000);
  }

  // ===================================================
  // CONDITION 2: OVER-VOLTAGE
  // ===================================================
  if (batteryVoltage > 13.0) {
    digitalWrite(LEDPIN, HIGH);
    sendOverVoltageSMS(batteryVoltage, current, temperature, latitude, longitude);
    delay(5000);
  }

  // ===================================================
  // CONDITION 3: SEND FULL STATUS
  // ===================================================
  sendOverallStatus(batteryVoltage, current, temperature, latitude, longitude);
  delay(5000);

  delay(1000);
}
