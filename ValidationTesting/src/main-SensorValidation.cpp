#include <Arduino.h>
#include <Adafruit_INA260.h>
#include <Adafruit_ICM20948.h>
#include <Adafruit_Sensor.h>
#include <RTClib.h>
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
float correctedICMTempC(float reportedTempC);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Sensor Validation Tests ===\n");

  // Initialize I2C
  Wire.begin();
  delay(100);

  // Run tests
  testI2CScan();
  testINA260();
  testICM20948();
  testPCF8523();

  Serial.println("\n=== All Tests Complete ===\n");
}

void loop() {
  // Empty loop
  delay(1000);
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

  if (!ina260.begin()) {
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

  if (!icm.begin_I2C()) {
    Serial.println("  ERROR: Could not find ICM20948 sensor!");
    return;
  }

  Serial.println("  ICM20948 found and initialized");

  // Read accelerometer and gyroscope
  sensors_event_t accel, gyro, temp ,mag;
  accel.acceleration.x = 0;
  
  icm.getEvent(&accel, &gyro, &temp, &mag);
  float correctedTemp = correctedICMTempC(temp.temperature);

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

  Serial.print("  Temperature: ");
  Serial.print(correctedTemp, 2);
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

float correctedICMTempC(float reportedTempC) {
  // Workaround for ICM20X library signed-temperature conversion issue.
  // When temp raw value is negative, the library can report ~196 C too high.
  if (reportedTempC > 120.0f) {
    return reportedTempC - (65536.0f / 333.87f);
  }
  return reportedTempC;
}

// ===== PCF8523 RTC Test =====
void testPCF8523() {
  Serial.println("TEST: PCF8523 (Real Time Clock)");

  if (!rtc.begin()) {
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