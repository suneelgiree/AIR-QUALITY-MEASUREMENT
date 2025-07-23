#include <SoftwareSerial.h>

// PMS7003 sensor pins (Arduino RX -> Sensor TX)
SoftwareSerial pmsSerial(2, 3);  // RX: Pin 2, TX: Pin 3

struct PMS7003Data {
  uint16_t pm1_0_cf1;
  uint16_t pm2_5_cf1;
  uint16_t pm10_cf1;
};

// Data buffer and state tracking
uint8_t pmsBuffer[32];
uint8_t index = 0;
bool frameStart = false;

void setup() {
  Serial.begin(9600);
  pmsSerial.begin(9600);
  Serial.println("PMS7003 Sensor Reader");
  delay(2000);  // Sensor warm-up
}

unsigned long lastReadTime = 0;
const unsigned long readInterval = 600000;  // 10 minutes in milliseconds

void loop() {
  PMS7003Data data;

  // Continuously read serial to keep buffer clean
  if (readPMSData(&data)) {
    unsigned long currentTime = millis();
    
    // Only print every 10 minutes
    if (currentTime - lastReadTime >= readInterval) {
      lastReadTime = currentTime;

     Serial.print("[PMS]");
Serial.print("PM1.0: ");
Serial.print(data.pm1_0_cf1);
Serial.print(" µg/m3 | PM2.5: ");
Serial.print(data.pm2_5_cf1);
Serial.print(" µg/m3 | PM10: ");
Serial.print(data.pm10_cf1);
Serial.println(" µg/m3");

    }
  }
}


bool readPMSData(PMS7003Data* data) {
  while (pmsSerial.available()) {
    uint8_t ch = pmsSerial.read();
    
    // Detect frame start (0x42)
    if (!frameStart && ch == 0x42) {
      frameStart = true;
      pmsBuffer[index++] = ch;
      continue;
    }
    
    // If frame start detected, collect data
    if (frameStart) {
      pmsBuffer[index++] = ch;
      
      // Full frame received
      if (index >= 32) {
        frameStart = false;
        index = 0;
        
        // Verify checksum
        uint16_t calcChecksum = 0;
        uint16_t rcvChecksum = (pmsBuffer[30] << 8) | pmsBuffer[31];
        
        for (uint8_t i = 0; i < 30; i++) {
          calcChecksum += pmsBuffer[i];
        }
        
        if (calcChecksum == rcvChecksum) {
          // Parse PM values (big-endian)
          data->pm1_0_cf1  = (pmsBuffer[4] << 8) | pmsBuffer[5];
          data->pm2_5_cf1  = (pmsBuffer[6] << 8) | pmsBuffer[7];
          data->pm10_cf1   = (pmsBuffer[8] << 8) | pmsBuffer[9];
          return true;
        } else {
          Serial.println("Checksum error");
          return false;
        }
      }
    }
  }
  return false;
}