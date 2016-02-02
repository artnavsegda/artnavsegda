all:	modbus modbuspi modread mbglxroll

mbglxroll: mbglxroll.c
	cc `pkg-config --cflags --libs libmodbus` -lGL -lGLU -lX11 mbglxroll.c -o mbglxroll

modread: modread.c
	cc `pkg-config --cflags --libs libmodbus` modread.c -o modread

modbus: modbus.c
	cc `pkg-config --cflags --libs libmodbus` modbus.c -o modbus

modbuspi: modbuspi.c
	cc `pkg-config --cflags --libs libmodbus` modbuspi.c -o modbuspi

clean:
	rm modbus modbus.o

