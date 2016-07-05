all:	mbget modbuspi modread modbusrtu server mbset

mbglxroll: mbglxroll.c
	cc -std=c99 `pkg-config --cflags --libs libmodbus` -lGL -lGLU -lX11 mbglxroll.c -o mbglxroll

modread: modread.c
	cc -I/usr/local/include/modbus -lmodbus modread.c -o modread

mbset: mbset.c
	cc -I/usr/local/include/modbus -lmodbus mbset.c -o mbset

mbget: mbget.c
	cc -I/usr/local/include/modbus -lmodbus mbget.c -o mbget

modbuspi: modbuspi.c
	cc -I/usr/local/include/modbus -lmodbus modbuspi.c -o modbuspi

modbusrtu: modbusrtu.c
	cc -I/usr/local/include/modbus -lmodbus modbusrtu.c -o modbusrtu

server: server.c
	cc -I/usr/local/include/modbus -lmodbus server.c -o server

i2cserver: i2cserver.c
	cc -I/usr/local/include/modbus -lmodbus i2cserver.c -o i2cserver

clean:
	rm modbus modbuspi modread modbusrtu server

