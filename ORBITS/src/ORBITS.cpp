// Basic demo for accelerometer & gyro readings from Adafruit
// LSM6DSOX sensor

#include <Adafruit_ICM20X.h>
#include <Adafruit_ICM20948.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <Adafruit_INA260.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoOTA.h>
#include <RTClib.h>
#include "RF24.h"
#include "ORBITS.h"

//Internal I2C Bus for sensor communications
TwoWire internalI2CBus = TwoWire(0);
unsigned long lastTime = 0;

//Wifi and MQTT credentials
WiFiClient espClient;
PubSubClient mqtt(espClient);

//Sensors
Adafruit_ICM20948 icm;
Adafruit_INA260 ina260;
RTC_PCF8523 rtc;

//OTA and MQTT timing variables
uint32_t last_ota_time = 0;
unsigned long lastMqttReconnectAttempt = 0;

// LED Pin
Adafruit_NeoPixel strip(1, 38, NEO_GRB + NEO_KHZ800);


void ORBITS_Setup(void) {
  Serial.begin(115200);

  while (!Serial)
    delay(10);  // Makes sure the serial monitor has been configured and ready

  Serial.println("Begin ORBITS initialisation Operations...");

  //Network LED
  pinMode(network_led_pin, OUTPUT);
  digitalWrite(network_led_pin, LOW);

  internalI2CBus.begin(21,47, 100000);

  //Check if sensors are connected and discoverable
  if (!icm.begin_I2C(0x69,&internalI2CBus)) {
      Serial.println("ICM20948 Not Found!");
  }

  if (!ina260.begin(0x40, &internalI2CBus)) {
    Serial.println("INA260 Not Found!");
  }

  if (!rtc.begin(&internalI2CBus)) {
    Serial.println("RTC Not Found!");
  }

  //Configure Wifi and connect to ground station hotspot
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(hostname);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
    //WiFi.begin(ssid, password);
  }
  Serial.println();
  strip.begin();
  strip.setPixelColor(0, strip.Color(0, 1, 0));
  strip.show();

  //Display connection info
  Serial.print("\nESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("ESP32 HostName: ");
  Serial.println(WiFi.getHostname());
  Serial.print("RRSI: ");
  Serial.println(WiFi.RSSI());

  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(mqtt_callback);

  //Just Use Default Sensor Settings for now, can be changed as needed
  reconnect_mqtt();

  // ArduinoOTA setup
  ArduinoOTA.setHostname(hostname);
  ArduinoOTA.begin();
  Serial.println("ArduinoOTA ready");
}

void ORBITS_Loop() {
  ArduinoOTA.handle();

  digitalWrite(network_led_pin, WiFi.status() == WL_CONNECTED ? HIGH : LOW);

  if (WiFi.status() == WL_CONNECTED) {
    if (!mqtt.connected() && millis() - lastMqttReconnectAttempt > 2000) {
      lastMqttReconnectAttempt = millis();
      reconnect_mqtt();
    }
    mqtt.loop();
  }

  //get MPU data and send it to the ground station
  unsigned long currentMillis = millis();
  if(currentMillis - lastTime >= 200) {
    lastTime = currentMillis;
    send_imu_data();
  }
}

void reconnect_mqtt(){
  if (!mqtt.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqtt.connect(hostname)) {
      Serial.println("connected");
    } else {
      Serial.print("failed with state ");
      Serial.print(mqtt.state());
      Serial.print("\n");
    }
  }
}

void mqtt_callback(char* topic, byte* payload, unsigned int length){
  //Handle incoming MQTT messages here.
  Serial.print("Message arrived in topic: ");
  Serial.println(topic);

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  String command = doc["command"];
  if(command == "Blink"){
    //Start sending data
  }
  else if(command == "Something"){
    //Stop sending data
  }
}

void send_imu_data(){
  JsonDocument doc;

  sensors_event_t accel;
  sensors_event_t gyro;
  sensors_event_t mag;
  sensors_event_t temp;
  icm.getEvent(&accel, &gyro, &mag, &temp);

  doc["mission_id"] = hostname;
  doc["accel_x"] = accel.acceleration.x;
  doc["accel_y"] = accel.acceleration.y;
  doc["accel_z"] = accel.acceleration.z;
  doc["gyro_x"] = gyro.gyro.x;
  doc["gyro_y"] = gyro.gyro.y;
  doc["gyro_z"] = gyro.gyro.z;
  doc["mag_x"] = mag.magnetic.x;
  doc["mag_y"] = mag.magnetic.y;
  doc["mag_z"] = mag.magnetic.z;


  //print the JSON document to the serial monitor for debugging
  serializeJson(doc, Serial);
  Serial.println();
  //send the JSON document to the MQTT broker
  if(!mqtt.connected()){
    reconnect_mqtt();
    if (!mqtt.connected()) {
      return;
    }
  }
  char buffer[256];
  serializeJson(doc, buffer);
  mqtt.publish("orbits/imu", buffer);
}