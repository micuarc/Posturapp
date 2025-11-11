#include <Wire.h>
#include <WiFi.h>
#include <math.h>

#define MPU_ADDR 0x68
#define ACCEL_SENS 16384.0

const int motorPin = 12;
const int SDA_PIN = 27;
const int SCL_PIN = 14;

const char* ssid = "Lonquimay";
const char* pass = "Quinchamali#";
WiFiServer server(80);

float ax, ay, az;
float axOffset = 0, ayOffset = 0, azOffset = 0;
float pitchRef = 0, rollRef = 0;
float pitchFiltered = 0, rollFiltered = 0;

bool calibrating = false;
bool referenceReady = false;
bool vibrating = false;

unsigned long calibStart = 0;
unsigned long badPostureStart = 0;

const float pitchThreshold = 5.0;
const float rollThreshold = 4.0;

// variables de acumulación de calibración
long calibCount = 0;
float pitchAccum = 0, rollAccum = 0;

void setup() {
  Wire.begin(SDA_PIN, SCL_PIN);
  Serial.begin(115200);
  delay(500);

  // Despertar MPU
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);

  computeInitialOffsets(1000);
  pinMode(motorPin, OUTPUT);

  WiFi.begin(ssid, pass);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  server.begin();
}

void loop() {
  readMPU();

  float pitch = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0 / M_PI;
  float roll  = atan2(ay, az) * 180.0 / M_PI;

  pitchFiltered = 0.9 * pitchFiltered + 0.1 * pitch;
  rollFiltered  = 0.9 * rollFiltered  + 0.1 * roll;

  if (calibrating) {
    unsigned long elapsed = millis() - calibStart;

    if (elapsed < 5000) {
      // primeros 5s: usuario adopta postura correcta
    } 
    else if (elapsed < 15000) {
      pitchAccum += pitchFiltered;
      rollAccum  += rollFiltered;
      calibCount++;
    } 
    else {
      if (calibCount > 0) {
        pitchRef = pitchAccum / calibCount;
        rollRef  = rollAccum / calibCount;
      }
      calibrating = false;
      referenceReady = true;
      Serial.printf("Calibración lista: pitch=%.2f roll=%.2f\n", pitchRef, rollRef);
    }
  }

  if (referenceReady) {
    bool badPitch = fabs(pitchFiltered - pitchRef) > pitchThreshold;
    bool badRoll  = fabs(rollFiltered - rollRef)  > rollThreshold;
    bool badPosture = badPitch || badRoll;

    if (badPosture) {
      if (badPostureStart == 0) badPostureStart = millis();
      if (millis() - badPostureStart >= 2000 && !vibrating) {
        digitalWrite(motorPin, HIGH);
        vibrating = true;
      }
    } else {
      badPostureStart = 0;
      if (vibrating) {
        digitalWrite(motorPin, LOW);
        vibrating = false;
      }
    }
  }

  handleClient();
}

void handleClient() {
  WiFiClient client = server.available();
  if (!client) return;

  String req = client.readStringUntil('\r');
  client.flush();

  if (req.indexOf("/calibrate") != -1) {
    calibrating = true;
    referenceReady = false;
    pitchRef = 0;
    rollRef = 0;
    pitchAccum = 0;
    rollAccum = 0;
    calibCount = 0;
    calibStart = millis();
  }

  if (req.indexOf("/data") != -1) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.println();
  client.printf(
    "{\"pitch\":%.2f,\"roll\":%.2f,\"refPitch\":%.2f,\"refRoll\":%.2f,"
    "\"bad\":%d,\"calibrating\":%d}",
    pitchFiltered, rollFiltered, pitchRef, rollRef,
    vibrating ? 1 : 0, calibrating ? 1 : 0
  );
  client.stop();
  return;
}

  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html; charset=utf-8");
  client.println("Connection: close");
  client.println();
  client.println("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Postura</title>");
  client.println("<meta name='viewport' content='width=device-width, initial-scale=1'>");
  client.println("<style>");
  client.println("body{font-family:Helvetica;text-align:center;margin-top:40px;}button{background:#1976d2;color:white;border:none;padding:16px 32px;font-size:18px;cursor:pointer;border-radius:8px;}#bad{color:red;font-weight:bold;}");
  client.println("</style></head><body>");
  client.println("<h1>Corrector de Postura Cervical</h1>");
  client.println("<button onclick='fetch(\"/calibrate\")'>Calibrar postura buena</button>");
  client.println("<h2>Lecturas actuales</h2>");
  client.println("<p>Pitch: <span id='pitch'>--</span>°</p>");
  client.println("<p>Roll: <span id='roll'>--</span>°</p>");
  client.println("<p>Ref: <span id='refPitch'>--</span>° / <span id='refRoll'>--</span>°</p>");
  client.println("<p id='bad'></p>");
  client.println("<script>");
  client.println("async function update(){let r=await fetch('/data');let d=await r.json();document.getElementById('pitch').textContent=d.pitch.toFixed(2);document.getElementById('roll').textContent=d.roll.toFixed(2);document.getElementById('refPitch').textContent=d.refPitch.toFixed(2);document.getElementById('refRoll').textContent=d.refRoll.toFixed(2);document.getElementById('bad').textContent=d.bad?'Mala postura detectada':'';}");
  client.println("setInterval(update,1000);update();");
  client.println("</script></body></html>");
  client.stop();
}

void readMPU() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  int16_t ax_raw = Wire.read() << 8 | Wire.read();
  int16_t ay_raw = Wire.read() << 8 | Wire.read();
  int16_t az_raw = Wire.read() << 8 | Wire.read();
  ax = (ax_raw / ACCEL_SENS) - axOffset;
  ay = (ay_raw / ACCEL_SENS) - ayOffset;
  az = (az_raw / ACCEL_SENS) - azOffset;
}

void computeInitialOffsets(int samples) {
  float axSum = 0, aySum = 0, azSum = 0;
  for (int i = 0; i < samples; i++) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B);
    Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 6, true);
    int16_t ax_raw = Wire.read() << 8 | Wire.read();
    int16_t ay_raw = Wire.read() << 8 | Wire.read();
    int16_t az_raw = Wire.read() << 8 | Wire.read();
    axSum += ax_raw / ACCEL_SENS;
    aySum += ay_raw / ACCEL_SENS;
    azSum += (az_raw / ACCEL_SENS) - 1.0;
    delay(2);
  }
  axOffset = axSum / samples;
  ayOffset = aySum / samples;
  azOffset = azSum / samples;
}
