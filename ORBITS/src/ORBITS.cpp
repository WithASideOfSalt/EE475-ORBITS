// Basic demo for accelerometer & gyro readings from Adafruit
// LSM6DSOX sensor

#include <Adafruit_LSM6DSOX.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <ArduinoOTA.h>
#include "ORBITS.h"

//Internal I2C Bus for sensor communications
TwoWire internalI2CBus = TwoWire(0);
unsigned long lastTime = 0;

WiFiClient espClient;
PubSubClient mqtt(espClient);



uint32_t last_ota_time = 0;
unsigned long lastMqttReconnectAttempt = 0;

Adafruit_LSM6DSOX sox;


void ORBITS_Setup(void) {
  Serial.begin(115200);

  while (!Serial)
    delay(10);  // Makes sure the serial monitor has been configured and ready

  Serial.println("Begin Operations...");

  pinMode(network_led_pin, OUTPUT);
  digitalWrite(network_led_pin, LOW);

  internalI2CBus.begin(2,1, 100000);

  if (!sox.begin_I2C(0x6A,&internalI2CBus)) {
    //check if the MPU has been connected and discoverable
  }

  Serial.println("LSM6DSOX Found!");

  //Configure Wifi and connect to ground station hotspot
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(hostname);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
    digitalWrite(network_led_pin, LOW);
  }
  Serial.println();
  digitalWrite(network_led_pin, HIGH);

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
  sensors_event_t temp;
  sox.getEvent(&accel, &gyro, &temp);

  doc["mission_id"] = hostname;
  doc["accel_x"] = accel.acceleration.x;
  doc["accel_y"] = accel.acceleration.y;
  doc["accel_z"] = accel.acceleration.z;
  doc["gyro_x"] = gyro.gyro.x;
  doc["gyro_y"] = gyro.gyro.y;
  doc["gyro_z"] = gyro.gyro.z;

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