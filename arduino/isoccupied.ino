#include <Arduino.h>
#include <SPI.h>
#include <Ethernet.h>
#include "PubSubClient.h"

#define GREEN_LED 13
#define RED_LED 12
#define OCCUPATION_PERIOD_SECONDS 1

#define MQTT_ID "67B5AD17-0491-476B-BB0A-7E2982AC3435"

void callback(char* topic, byte* payload, unsigned int length) 
{
    // Ignored Porposely
}

byte _serverIpAddress[] = { 10,0,0,19 };
EthernetClient _ethernetClient;
PubSubClient _pubSubClient(_serverIpAddress, 1883, callback, _ethernetClient);

byte _macAddress[] = { 0x00, 0xAA, 0xBB, 0xAB, 0xDE, 0x02 };
IPAddress _ipAddress(10, 0, 0, 50);
IPAddress _subnetMask(255, 255, 255, 0);
IPAddress _defaultGateway(10, 0, 0, 138);
IPAddress _dns(8, 8, 8, 8);

bool _previewsState;
bool _boot;
long _lastOccupied;

bool checkOccupied();
void notifyServer(bool isOccupied);
void notifyServer(bool isOccupied);

void setup()
{
	pinMode(GREEN_LED, OUTPUT);
	pinMode(RED_LED, OUTPUT);
	pinMode(PIN0, INPUT);

	Serial.begin(9600);

	_lastOccupied = -1 * OCCUPATION_PERIOD_SECONDS * 1000;
	_boot = true;

	digitalWrite(GREEN_LED, HIGH);
	digitalWrite(RED_LED, HIGH);

	// Static IP 
	Ethernet.begin(_macAddress, _ipAddress, _dns, _defaultGateway, _subnetMask);

	digitalWrite(GREEN_LED, LOW);
	digitalWrite(RED_LED, LOW);
}


void loop()
{
	bool isOccupied = checkOccupied();

	// If it's not the first time this arduino is up
	// or the occupation state hasn't changed
	if (!_boot && _previewsState == isOccupied)
	{
		return;
	}

	notifyUser(isOccupied);
	notifyServer(isOccupied);

	_previewsState = isOccupied;
	_boot = false;
}


bool checkOccupied()
{
    bool isOccupied = digitalRead(PIN2);

    if (isOccupied)
    {
        _lastOccupied = millis();
    }
    else
    {
        // Check if the last occupied date was in the last OCCUPATION_PERIOD_SECONDS seconds
        long now = millis();
        long diff = now - _lastOccupied;

        if (diff <= OCCUPATION_PERIOD_SECONDS * 1000)
        {
            isOccupied = true;
        }
    }

    return isOccupied;
};

void notifyServer(bool isOccupied)
{

    if (!_pubSubClient.connected())
    {
        Serial.println("not connected. trying to connect");

        bool result = _pubSubClient.connect(MQTT_ID);

		if (!result)
		{
			Serial.println("connection error");

			return;
		}
    }

    char* message;
    if (isOccupied)
    {
        message = "{\"occupied\":true}";
    }
    else
    {
        message = "{\"occupied\":false}";
    }

    _pubSubClient.publish("messages", message);
}

void notifyUser(bool isOccupied)
{
    if (isOccupied)
    {
        Serial.println("occupied");
        digitalWrite(GREEN_LED, HIGH);
        digitalWrite(RED_LED, LOW);
    }
    else
    {
        Serial.println("un-occupied");
        digitalWrite(GREEN_LED, LOW);
        digitalWrite(RED_LED, HIGH);
    }
}
