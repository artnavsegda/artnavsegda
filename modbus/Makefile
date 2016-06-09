all:	modbus modbuspi modread mbglxroll modbusrtu

mbglxroll: mbglxroll.c
	cc `pkg-config --cflags --libs libmodbus` -lGL -lGLU -lX11 mbglxroll.c -o mbglxroll

modread: modread.c
	cc `pkg-config --cflags --libs libmodbus` modread.c -o modread

modbus: modbus.c
	cc `pkg-config --cflags --libs libmodbus` modbus.c -o modbus

modbuspi: modbuspi.c
	cc `pkg-config --cflags --libs libmodbus` modbuspi.c -o modbuspi

modbusrtu: modbusrtu.c
	cc `pkg-config --cflags --libs libmodbus` modbusrtu.c -o modbusrtu

server: server.c
	cc `pkg-config --cflags --libs libmodbus` server.c -o server

clean:
	rm modbus modbus.o

