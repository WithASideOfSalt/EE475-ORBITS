// Basic demo for accelerometer & gyro readings from Adafruit
// LSM6DSOX sensor

#include <Adafruit_LSM6DSOX.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>

const char* ssid = "ORBITSground";
const char* password = "ORBITSLaunch";
const char* hostname = "ORBITSUnit00";

TwoWire internalI2CBus = TwoWire(0);
unsigned long lastTime = 0;


Adafruit_LSM6DSOX sox;
void setup(void) {
  Serial.begin(115200);

  while (!Serial)
    delay(10);  // Makes sure the serial monitor has been configured and ready

  Serial.println("Begin Operations...");

  internalI2CBus.begin(2,1, 100000);

  if (!sox.begin_I2C(0x6A,&internalI2CBus)) {
    //check if the MPU has been connected and discoverable
  }

  Serial.println("LSM6DSOX Found!");

  //Configure Wifi and connect to ground station hotspot
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
  }
  WiFi.setHostname(hostname);

  //Display connection info
  Serial.print("\nESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("ESP32 HostName: ");
  Serial.println(WiFi.getHostname());
  Serial.print("RRSI: ");
  Serial.println(WiFi.RSSI());

  //Just Use Default Sensor Settings for now, can be changed as needed

}

void loop() {
  //get MPU data and send it to the ground station
  unsigned long currentMillis = millis();
  if(currentMillis - lastTime >= 10000) {
    lastTime = currentMillis;



  }
}

void reconnect_mqtt(){
  while(!mqtt.connected()){
    Serial.print("Connecting to MQTT...");
  }
}

void send_imu_data(){
  StaticJsonDocument<256> doc;

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
}