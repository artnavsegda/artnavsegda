all:	vala

vala:	vhello vghello vglade vgtext
#gtk:	ghello ghello2
#sdl:	sdlhello sdlopengl sdldouble

clean:
	rm vhello vghello vglade vgtext *.o *.c *~

vhello vghello vgtext vglade:	CFLAGS += $(shell pkg-config --cflags glib-2.0 gobject-2.0) -rdynamic
vhello vghello vgtext vglade:	LDLIBS += $(shell pkg-config --libs glib-2.0 gobject-2.0)
vghello vgtext vglade:	VALAFLAGS += --pkg gtk+-3.0
vglade:	VALAFLAGS += --pkg gmodule-2.0
vghello vgtext vglade:	CFLAGS += $(shell pkg-config --cflags gtk+-3.0)
vghello vgtext vglade:	LDLIBS += $(shell pkg-config --libs gtk+-3.0)
%.c:	%.vala
	valac $(VALAFLAGS) -C $<

