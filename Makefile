WINCC = gcc
WINCFLAGS="-std=gnu99"
WINCOMPILE.c = $(WINCC) $(WINCFLAGS) -c
#CFLAGS = /FC
CFLAGS="-std=gnu99"
#LINK="user32.lib"

all:	hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble vhello vghello vglade vgtext
build:	hello.exe winhello.exe glhello.exe winbmp.exe winchota.exe settings.exe

clean:
	rm hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble vhello vghello vglade vgtext
	rm *.o

winclean:
	del *.obj *.exe *.res *~

%.res:	%.rc
	windres -O coff $*.rc $*.res
#	rc $*.rc

#%.o:	%.c
#	$(WINCOMPILE.c) $<

#%.exe:	%.o
#	$(WINCC) $(WINLDFLAGS) $^ $(LOADLIBES) $(LDLIBS) -o $@


%.exe:	%.o
	$(LINK.o) $^ $(LOADLIBES) $(LDLIBS) -o $@


winbmp.obj:	winbmp.c
	cl /FC /c winbmp.c

winbmp.exe:	winbmp.obj
	link winbmp.obj user32.lib gdi32.lib

winhello.exe:	LDLIBS = -luser32
winhello.exe:	winhello.res

winchota.exe:	LDLIBS = -luser32 -lgdi32 -lcomdlg32
winchota.exe:	winchota.res

glchota.exe:	LDLIBS = user32.lib gdi32.lib comdlg32.lib opengl32.lib glu32.lib
glchota.exe:	glchota.res

glhello.exe:	LDLIBS = -luser32 -lgdi32 -lopengl32 -lglu32
gldouble.exe:	LDLIBS = user32.lib gdi32.lib opengl32.lib glu32.lib

xlibjpeg anjpeg xliban xlibstdin xlibpng:	LDLIBS += -lm
xlibjpeg anjpeg:	LDLIBS += -ljpeg
glxhello glxdouble xhello xchota xlibjpeg xliban xlibstdin xlibpng:	LDLIBS += $(shell pkg-config --libs x11)
glxhello glxdouble xhello xchota:	LDLIBS += $(shell pkg-config --libs xext)
glxhello glxdouble sdlopengl:	LDLIBS += $(shell pkg-config --libs glew)
glxhello glxdouble sdlopengl:	LDLIBS += $(shell pkg-config --libs gl)
sdlhello sdldouble sdlopengl:	LDLIBS += $(shell pkg-config --libs glu)
sdlhello sdldouble sdlopengl:	LDLIBS += $(shell pkg-config --libs sdl) 
#sdlhello.o sdldouble.o sdlopengl.o:	CFLAGS = $(shell sdl-config --cflags)
ghello.o ghello2.o:	CFLAGS += $(shell pkg-config --cflags gtk+-3.0)
ghello ghello2:		LDLIBS += $(shell pkg-config --libs gtk+-3.0)
xlibpng:	LDLIBS += $(shell pkg-config --libs libpng)

#CFLAGS += $(shell pkg-config --cflags glib-2.0 gobject-2.0) -rdynamic
#LDLIBS += $(shell pkg-config --libs glib-2.0 gobject-2.0)
vghello vgtext vglade:	VALAFLAGS += --pkg gtk+-3.0
vglade:	VALAFLAGS += --pkg gmodule-2.0
vghello vgtext vglade:	CFLAGS += $(shell pkg-config --cflags gtk+-3.0)
vghello vgtext vglade:	LDLIBS += $(shell pkg-config --libs gtk+-3.0)
%.c:	%.vala
	valac $(VALAFLAGS) -C $<

