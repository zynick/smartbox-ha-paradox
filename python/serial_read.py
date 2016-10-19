#!/usr/bin/env python

import time
import serial

ser = serial.Serial(
    port='/dev/tty.usbserial-a40069b4',
    baudrate = 2400,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS,
    timeout=1
)

counter=0

while 1:
    x=ser.readline()
    time.sleep(1)
    print(x)
