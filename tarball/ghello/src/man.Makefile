all:	gtk

gtk:	ghello ghello2

clean:
	rm ghello ghello2 *.o *~

ghello.o ghello2.o:	CFLAGS += $(shell pkg-config --cflags gtk+-3.0)
ghello ghello2:		LDLIBS += $(shell pkg-config --libs gtk+-3.0)

