#include <ESP32Servo.h>
#include <NewPing.h>
#include <WiFi.h>
#include <WebSocketsClient.h>

#define trig_pin 12
#define echo_pin 14
#define max_dist 200

NewPing sonar(trig_pin, echo_pin, max_dist);
Servo servo;

const char* ssid = "KEKW";
const char* pass = "haekal123";
const char* host = "192.168.158.96";

WebSocketsClient webSocket;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("Disconnected!");
            break;
        case WStype_CONNECTED:
            Serial.println("Connected to server");
            break;
        case WStype_TEXT:
            Serial.printf("Received text: %s\n", payload);
            break;
        case WStype_BIN:
            Serial.println("Received binary data");
            break;
        case WStype_ERROR:
            Serial.println("Error occurred");
            break;
        case WStype_PING:
            Serial.println("Ping received");
            break;
        case WStype_PONG:
            Serial.println("Pong received");
            break;
    }
}

void setup() {
    Serial.begin(9600);
    servo.attach(13);
    servo.write(0);
    delay(2000);

    WiFi.begin(ssid, pass);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to wifi...");
    }
    Serial.println("WIfi Connected");

    webSocket.begin(host, 8080, "/ws");

    webSocket.onEvent(webSocketEvent);
}

int current_deg = 0;
bool in_reverse = false;

int readPing(){
  delay(10);
  int cm = sonar.ping_cm();
  if (cm <= 0 || cm > 100) return 100;
  return cm;
}

void loop() {
    webSocket.loop();

    servo.write(current_deg);
    int dis = readPing();

    Serial.print(current_deg);
    Serial.print(" : ");
    Serial.println(dis);

    webSocket.sendTXT(String(current_deg) + ":" + String(dis));

    if (!in_reverse) current_deg++;
    else current_deg--;

    if (current_deg > 180) {
        in_reverse = true;
        current_deg = 180;
    }
    if (current_deg < 0) {
        in_reverse = false;
        current_deg = 0;
    }
}
