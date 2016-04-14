#!/usr/bin/env python


import serial

ser = serial.Serial(
    port='/dev/tty.usbserial-a40069ba',
    baudrate = 2400,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS,
    timeout=1
)


# request
data = b'RA001\r'   # area status
# data = b'RZ004\r'   # zone status
# data = b'ZL001\r'   # zone label 1 - 192 (evo panel)
# data = b'AL001\r'   # area label 1 - 8
# data = b'UL001\r'   # user label 1 - 999

# arm
# A-regular F-force S-stay I-instant
# data = b'AA001A1234\r'   # area arm
# data = b'AQ001A1234\r'   # area quick arm (The One-Touch feature must be enabled)

# area disarm
# data = b'AD0011234\r'
#
# panic (trigger in area only)
# data = b'PE001\r'   # emergency panic
# data = b'PM001\r'   # medical panic
# data = b'PF001\r'   # fire panic
#
# data = b'SR001\r'   # smoke reset
# data = b'UK001\r'   # utility key
# data = b'PGM000255001002\r' # PGM i dont know i dont give a fuck


print(data)
ser.write(data)
x=ser.readline()
print(x)
