#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

const char* ssid = ""; // Enter your WiFi SSID here
const char* password = ""; // Enter your WiFi password here

const char* endpoint = "";   // Enter you URL Endpoint here 

unsigned long lastUploadTime = 0;
const unsigned long uploadInterval = 600000;  // 10 minutes

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 13, 14);  // RXD2, TXD2

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi");

  // NTP time setup
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  if (!waitForTimeSync()) {
    Serial.println("Failed to sync time.");
  } else {
    Serial.println("Time synchronized.");
  }
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastUploadTime >= uploadInterval || lastUploadTime == 0) {
    Serial.println("Fetching data from Pico...");

    String aqiData = getFileFromPico("GET_JSON");
    String pmData = getFileFromPico("GET_CSV");

    Serial.println("Data fetched:");
    Serial.println("AQI JSON:");
    Serial.println(aqiData);
    Serial.println("PM CSV:");
    Serial.println(pmData);

    Serial.println("Uploading data to cloud...");

    uploadToCloud("aqi_log.json", aqiData);
    uploadToCloud("pm_data.csv", pmData);

    lastUploadTime = currentTime;
  }

  delay(1000);
}

String getFileFromPico(String command) {
  Serial2.println(command);
  String result = "";
  unsigned long timeout = millis() + 3000;

  while (millis() < timeout) {
    while (Serial2.available()) {
      char c = Serial2.read();
      result += c;
    }
  }

  return result;
}

void uploadToCloud(String filename, String content) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Retry later.");
    return;
  }

  HTTPClient http;
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");

  // Escape double quotes in content to make valid JSON
  content.replace("\"", "\\\"");
  content.replace("\n", "\\n");  // Optional: escape newlines
  content.replace("\r", "");     // Clean up carriage returns if present

  // Get current timestamp
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  char timestamp[32];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", timeinfo);

  // Build JSON payload
  String payload = "{\"filename\":\"" + filename + "\",\"timestamp\":\"" + String(timestamp) + "\",\"data\":\"" + content + "\"}";

  Serial.println("Payload to be sent:");
  Serial.println(payload);

  int httpResponseCode = http.POST(payload);

  Serial.print("HTTP Response Code: ");
  Serial.println(httpResponseCode);

  String response = http.getString();
  Serial.println("Server Response:");
  Serial.println(response);

  if (httpResponseCode == 200) {
    Serial.println("✅ Upload successful.");
  } else if (httpResponseCode >= 400) {
    Serial.println("❌ Upload failed - check server logs or payload formatting.");
  }

  http.end();
}

bool waitForTimeSync() {
  const int maxRetries = 10;
  for (int i = 0; i < maxRetries; ++i) {
    time_t now = time(nullptr);
    if (now > 100000) return true;
    delay(1000);
  }
  return false;
}
