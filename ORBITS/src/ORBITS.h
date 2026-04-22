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

//MQTT Topic Handlers for custom routing to user defined functions
typedef void (*MQTTHandler)();

struct MQTTRoute{
    const char* topic;
    MQTTHandler handler;
};

void reconnect_mqtt();
void mqtt_callback(char* topic, byte* payload, unsigned int length);
void send_imu_data();
void ORBITS_Setup(MQTTRoute* routes = nullptr, int num_routes = 0);
void ORBITS_Loop(void);
void send_telemetry_data();
void print_to_serial(const char* message);
#endif // ORBITS_H