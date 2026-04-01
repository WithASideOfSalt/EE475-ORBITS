#ifndef ORBITS_H
#define ORBITS_H

#include <Arduino.h>

#define ssid "ORBITSground"
#define password "ORBITSLaunch"
#define hostname "ORBITSUnit00"
#define network_led_pin 38

//MQTT Broker Info
#define mqtt_server "orbitsground.local"
#define mqtt_port 1883

void reconnect_mqtt();
void mqtt_callback(char* topic, byte* payload, unsigned int length);
void send_imu_data();
void ORBITS_Setup(void);
void ORBITS_Loop(void);
void send_telemetry_data();
#endif // ORBITS_H