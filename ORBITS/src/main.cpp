// Basic demo for accelerometer & gyro readings from Adafruit
// LSM6DSOX sensor

#include "ORBITS.h"

MQTTRoute mqtt_routes[] = {};

void setup(void) {
  ORBITS_Setup();
}

void loop() {
  ORBITS_Loop();
}