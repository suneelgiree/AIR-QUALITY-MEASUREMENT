#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Make sure to install this library
#include <time.h>

// --- 1. Enter your WiFi Credentials ---
const char* ssid = "bishal759_5";
const char* password = "88t93TJ7rP55+63";

// --- 2. Enter your Backend Server Address ---
// Example: "http://192.168.1.100:8000" or your public server URL
const char* server_address = "192.168.1.72:8000"; // Replace with your server address

// --- 3. Enter the API Key you just generated ---
const char* api_key = "2c6d1ae8bf46d24cc31497d7625ae80dc2deb6eaf021a2e4c94f0ff375926560"; 

// --- Constants ---
const char* ntp_server = "pool.ntp.org";
const unsigned long upload_interval_ms = 600000; // 10 minutes
unsigned long last_upload_time = 0;

void setup() {
  Serial.begin(115200);
  // Serial2 connects to the Raspberry Pi Pico
  Serial2.begin(9600, SERIAL_8N1, 13, 14); // RXD2, TXD2

  connectToWiFi();
  syncTime();
}

void loop() {
  unsigned long current_time = millis();

  // Use a non-blocking check for the interval
  if (current_time - last_upload_time >= upload_interval_ms || last_upload_time == 0) {
    Serial.println("----------------------------------------");
    Serial.println("Time to fetch data and upload.");

    // Fetch data from the Pico
    String aqi_json_str = getDataFromPico("GET_JSON");
    String pm_csv_str = getDataFromPico("GET_CSV");

    if (aqi_json_str.length() > 0 && pm_csv_str.length() > 0) {
        Serial.println("\n[PICO DATA - AQI JSON]:");
        Serial.println(aqi_json_str);
        Serial.println("\n[PICO DATA - PM CSV]:");
        Serial.println(pm_csv_str);

        // Parse the data and upload it to the new API endpoint
        parseAndUpload(aqi_json_str, pm_csv_str);
    } else {
        Serial.println("Failed to get complete data from Pico. Skipping upload.");
    }
    
    last_upload_time = current_time;
  }

  // A small delay to keep the loop from running too fast
  delay(1000);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected.");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed. Please check credentials. Halting.");
    while(1); // Stop execution
  }
}

void syncTime() {
    Serial.print("Syncing time with NTP server...");
    configTime(0, 0, ntp_server);
    time_t now = time(nullptr);
    int retries = 0;
    while (now < 8 * 3600 * 2 && retries < 15) { // Wait for a valid timestamp
        delay(500);
        Serial.print(".");
        now = time(nullptr);
        retries++;
    }
    if (now > 8 * 3600 * 2) {
        struct tm timeinfo;
        gmtime_r(&now, &timeinfo);
        Serial.print("\n✅ Time synchronized: ");
        Serial.print(asctime(&timeinfo));
    } else {
        Serial.println("\n❌ Failed to sync time. Check network connection.");
    }
}

String getDataFromPico(String command) {
  Serial.printf("Requesting '%s' from Pico...\n", command.c_str());
  Serial2.println(command);
  String result = "";
  unsigned long timeout = millis() + 5000; // 5-second timeout for response

  while (millis() < timeout) {
    if (Serial2.available()) {
      result += (char)Serial2.read();
    }
  }
  // Clean up potential dangling newlines
  result.trim();
  return result;
}

void parseAndUpload(const String& aqi_json_str, const String& pm_csv_str) {
    // --- 1. Parse the AQI JSON from the Pico ---
    JsonDocument aqi_doc;
    DeserializationError error = deserializeJson(aqi_doc, aqi_json_str);

    if (error) {
        Serial.print("❌ Failed to parse AQI JSON: ");
        Serial.println(error.c_str());
        return;
    }

    // --- 2. Parse the PM Data CSV from the Pico ---
    // Expected format: pm1,pm2.5,pm10
    float pm1 = 0, pm25 = 0, pm10 = 0;
    int first_comma = pm_csv_str.indexOf(',');
    int second_comma = pm_csv_str.lastIndexOf(',');

    if (first_comma != -1 && second_comma != -1 && first_comma != second_comma) {
        pm1 = pm_csv_str.substring(0, first_comma).toFloat();
        pm25 = pm_csv_str.substring(first_comma + 1, second_comma).toFloat();
        pm10 = pm_csv_str.substring(second_comma + 1).toFloat();
    } else {
        Serial.println("❌ Failed to parse PM CSV data.");
        return;
    }

    // --- 3. Build the new JSON payload for the backend ---
    JsonDocument payload_doc;
    payload_doc["source"] = "ESP32_SENSOR";
    
    // Use the timestamp from the AQI data if available, otherwise use current time
    if (aqi_doc.containsKey("timestamp")) {
        payload_doc["timestamp"] = aqi_doc["timestamp"];
    } else {
        char iso_timestamp[25];
        time_t now = time(nullptr);
        strftime(iso_timestamp, sizeof(iso_timestamp), "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
        payload_doc["timestamp"] = iso_timestamp;
    }

    payload_doc["aqi"] = aqi_doc["overall_aqi"];
    payload_doc["pm25"] = pm25;
    payload_doc["pm10"] = pm10;
    payload_doc["category"] = aqi_doc["category"]["Category"];

    // Add other sensor data if available
    if (aqi_doc.containsKey("temperature")) {
        payload_doc["temperature"] = aqi_doc["temperature"];
    }
    if (aqi_doc.containsKey("humidity")) {
        payload_doc["humidity"] = aqi_doc["humidity"];
    }

    String payload_str;
    serializeJson(payload_doc, payload_str);
    
    Serial.println("\n[UPLOADING TO SERVER]");
    Serial.println("Payload:");
    Serial.println(payload_str);
    
    // --- 4. Send the POST request ---
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String api_endpoint = String(server_address) + "/api/readings/";
        http.begin(api_endpoint);
        
        // Set headers
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", "API-Key " + String(api_key));

        int httpResponseCode = http.POST(payload_str);

        Serial.print("HTTP Response Code: ");
        Serial.println(httpResponseCode);

        String response = http.getString();
        Serial.println("Server Response:");
        Serial.println(response);

        if (httpResponseCode >= 200 && httpResponseCode < 300) {
            Serial.println("✅ Upload successful.");
        } else {
            Serial.println("❌ Upload failed. Check API Key, server address, and logs.");
        }

        http.end();
    } else {
        Serial.println("WiFi not connected. Cannot upload.");
    }
}