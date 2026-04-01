#include <Arduino.h>
#include <Adafruit_INA260.h>
#include <Adafruit_ICM20948.h>
#include <Adafruit_Sensor.h>
#include <RTClib.h>
#include <SPI.h>
#include <Wire.h>

// Sensor objects
Adafruit_INA260 ina260 = Adafruit_INA260();
Adafruit_ICM20948 icm;
RTC_PCF8523 rtc;

// Forward declarations
void testI2CScan();
void testINA260();
void testICM20948();
void testPCF8523();
void testNRF24SPI();

float correctedICMTempC(float reportedTempC);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Sensor Validation Tests ===\n");

  // Initialize I2C
  Wire.begin(21,47,100000);
  delay(100);

  // Start Connection to each device
  ina260.begin();
  icm.begin_I2C();
  rtc.begin();


  // Run tests
  testI2CScan();
  testINA260();
  testICM20948();
  testPCF8523();
  testNRF24SPI();

  Serial.println("\n=== All Tests Complete ===\n");
}

void loop() {
  // Empty loop
  delay(1000);
  sensors_event_t accel;
  sensors_event_t gyro;
  sensors_event_t mag;
  sensors_event_t temp;
  icm.getEvent(&accel, &gyro, &temp, &mag);
  float correctedTemp = correctedICMTempC(temp.temperature);

  Serial.print("\t\tTemperature ");
  Serial.print(correctedTemp);
  Serial.println(" deg C");

  /* Display the results (acceleration is measured in m/s^2) */
  Serial.print("\t\tAccel X: ");
  Serial.print(accel.acceleration.x);
  Serial.print(" \tY: ");
  Serial.print(accel.acceleration.y);
  Serial.print(" \tZ: ");
  Serial.print(accel.acceleration.z);
  Serial.println(" m/s^2 ");

  Serial.print("\t\tMag X: ");
  Serial.print(mag.magnetic.x);
  Serial.print(" \tY: ");
  Serial.print(mag.magnetic.y);
  Serial.print(" \tZ: ");
  Serial.print(mag.magnetic.z);
  Serial.println(" uT");

  /* Display the results (acceleration is measured in m/s^2) */
  Serial.print("\t\tGyro X: ");
  Serial.print(gyro.gyro.x);
  Serial.print(" \tY: ");
  Serial.print(gyro.gyro.y);
  Serial.print(" \tZ: ");
  Serial.print(gyro.gyro.z);
  Serial.println(" radians/s ");
  Serial.println();

  delay(1000);
}

float correctedICMTempC(float reportedTempC) {
  // Workaround for ICM20X library signed-temperature conversion issue.
  // When temp raw value is negative, the library can report ~196 C too high.
  if (reportedTempC > 120.0f) {
    return reportedTempC - (65536.0f / 333.87f);
  }
  return reportedTempC;
}

// ===== I2C Scan Test =====
void testI2CScan() {
  Serial.println("TEST: I2C Device Scan");
  byte error, address;
  int nDevices = 0;

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("  I2C device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      nDevices++;
    }
  }

  if (nDevices == 0) {
    Serial.println("  ERROR: No I2C devices found!");
  } else {
    Serial.print("  SUCCESS: Found ");
    Serial.print(nDevices);
    Serial.println(" device(s)\n");
  }
}

// ===== INA260 Test =====
void testINA260() {
  Serial.println("TEST: INA260 (Voltage/Current Sensor)");

  if (!ina260.begin(0x40, &Wire)) {
    Serial.println("  ERROR: Could not find INA260 sensor!");
    return;
  }

  Serial.println("  INA260 found and initialized");

  // Read voltage and current
  float voltage = ina260.readBusVoltage() / 1000.0;  // Convert mV to V
  float current = ina260.readCurrent();               // in mA
  float power = ina260.readPower();                   // in mW

  Serial.print("  Voltage: ");
  Serial.print(voltage, 2);
  Serial.println(" V");

  Serial.print("  Current: ");
  Serial.print(current, 2);
  Serial.println(" mA");

  Serial.print("  Power: ");
  Serial.print(power, 2);
  Serial.println(" mW");

  if (voltage > 0 && current >= 0) {
    Serial.println("  SUCCESS: INA260 readings valid\n");
  } else {
    Serial.println("  WARNING: Check INA260 connections\n");
  }
}

// ===== ICM20948 Test =====
void testICM20948() {
  Serial.println("TEST: ICM20948 (IMU)");

  if (!icm.begin_I2C(0x69,&Wire)) {
    Serial.println("  ERROR: Could not find ICM20948 sensor!");
    return;
  }

  Serial.println("  ICM20948 found and initialized");

  // Read accelerometer and gyroscope
  sensors_event_t accel, gyro, temp, mag;
  accel.acceleration.x = 0;
  
  icm.getEvent(&accel, &gyro, &temp, &mag);

  Serial.print("  Accel X: ");
  Serial.print(accel.acceleration.x, 2);
  Serial.print(" m/s²  Y: ");
  Serial.print(accel.acceleration.y, 2);
  Serial.print(" m/s²  Z: ");
  Serial.print(accel.acceleration.z, 2);
  Serial.println(" m/s²");

  Serial.print("  Gyro X: ");
  Serial.print(gyro.gyro.x, 2);
  Serial.print(" rad/s  Y: ");
  Serial.print(gyro.gyro.y, 2);
  Serial.print(" rad/s  Z: ");
  Serial.print(gyro.gyro.z, 2);
  Serial.println(" rad/s");

  Serial.print("  Temp: ");
  Serial.print(temp.temperature, 2);
  Serial.println(" °C");

  Serial.print("  Mag X: ");
  Serial.print(mag.magnetic.x, 2);
  Serial.print("  Mag Y: ");
  Serial.print(mag.magnetic.y, 2);
  Serial.print("  Mag Z: ");
  Serial.print(mag.magnetic.z, 2);
  Serial.println(" uT");

  Serial.println("  SUCCESS: ICM20948 readings OK\n");
}

// ===== PCF8523 RTC Test =====
void testPCF8523() {
  Serial.println("TEST: PCF8523 (Real Time Clock)");

  if (!rtc.begin(&Wire)) {
    Serial.println("  ERROR: Could not find PCF8523 RTC!");
    return;
  }

  Serial.println("  PCF8523 found and initialized");

  // Check if time is set
  if (!rtc.initialized() || rtc.lostPower()) {
    Serial.println("  WARNING: RTC lost power or not initialized");
    Serial.println("  Setting RTC to compile time...");
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }

  // Read current time
  DateTime now = rtc.now();

  Serial.print("  Current Time: ");
  Serial.print(now.year(), DEC);
  Serial.print('/');
  Serial.print(now.month(), DEC);
  Serial.print('/');
  Serial.print(now.day(), DEC);
  Serial.print(" ");
  Serial.print(now.hour(), DEC);
  Serial.print(':');
  if (now.minute() < 10) Serial.print('0');
  Serial.print(now.minute(), DEC);
  Serial.print(':');
  if (now.second() < 10) Serial.print('0');
  Serial.println(now.second(), DEC);

  Serial.println("  SUCCESS: PCF8523 working\n");
}

// ===== NRF24L01+ SPI Access Test =====
void testNRF24SPI() {
  Serial.println("TEST: NRF24L01+ (SPI Access)");

  const uint8_t NRF_MOSI = 2;
  const uint8_t NRF_CSN = 42;
  const uint8_t NRF_CE = 41;
  const uint8_t NRF_SCK = 40;
  const uint8_t NRF_MISO = 39;

  pinMode(NRF_CSN, OUTPUT);
  pinMode(NRF_CE, OUTPUT);
  digitalWrite(NRF_CSN, HIGH);
  digitalWrite(NRF_CE, LOW);

  SPI.begin(NRF_SCK, NRF_MISO, NRF_MOSI, NRF_CSN);
  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));

  // NOP returns STATUS on MISO for NRF24L01+.
  digitalWrite(NRF_CSN, LOW);
  uint8_t status = SPI.transfer(0xFF);
  digitalWrite(NRF_CSN, HIGH);

  // Read SETUP_AW register (0x03), expected values are typically 0x01..0x03.
  digitalWrite(NRF_CSN, LOW);
  SPI.transfer(0x03);
  uint8_t setupAw = SPI.transfer(0xFF);
  digitalWrite(NRF_CSN, HIGH);

  SPI.endTransaction();

  Serial.print("  STATUS: 0x");
  Serial.println(status, HEX);
  Serial.print("  SETUP_AW: 0x");
  Serial.println(setupAw, HEX);

  bool statusLooksValid = (status != 0x00 && status != 0xFF);
  bool setupAwLooksValid = ((setupAw & 0x03) >= 0x01) && ((setupAw & 0x03) <= 0x03);

  if (statusLooksValid || setupAwLooksValid) {
    Serial.println("  SUCCESS: NRF24L01+ appears accessible over SPI\n");
  } else {
    Serial.println("  ERROR: NRF24L01+ not responding on SPI (check wiring/power/CSN/CE)\n");
  }
}