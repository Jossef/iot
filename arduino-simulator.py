#!/usr/bin/env python
import paho.mqtt.client as mqtt
import sys

if len(sys.argv[1:]) != 2:
    print 'wrong args; usage: ./.. [client-id] [is occupied? - true/false]'
    exit()

client = mqtt.Client(client_id=sys.argv[1])
client.connect("10.0.0.9", 1883)
client.publish("messages", '{"occupied":'+sys.argv[2]+'}', 0)
client.disconnect()