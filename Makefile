#CC = cl
#COMPILE.c = $(CC) $(CFLAGS) /c
#CFLAGS = /FC
CFLAGS="-std=gnu99"
#LINK="user32.lib"

all:	hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble
#build:	hello.exe winhello.exe glhello.exe winbmp.exe winchota.exe settings.exe

clean:
	rm *.o
	rm hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble

winclean:
	del *.obj *.exe *.res *~

%.res:	%.rc
	rc $*.rc

%.obj:	%.c
	$(COMPILE.c) $<

%.exe:	%.obj
	link $(LDFLAGS) $^ $(LOADLIBES) $(LDLIBS) /out:$@

winbmp.obj:	winbmp.c
	cl /FC /c winbmp.c

winbmp.exe:	winbmp.obj
	link winbmp.obj user32.lib gdi32.lib

winhello.exe:	LDLIBS = user32.lib
winhello.exe:	winhello.res

winchota.exe:	LDLIBS = user32.lib gdi32.lib comdlg32.lib
winchota.exe:	winchota.res

glchota.exe:	LDLIBS = user32.lib gdi32.lib comdlg32.lib opengl32.lib glu32.lib
glchota.exe:	glchota.res

glhello.exe:	LDLIBS = user32.lib gdi32.lib opengl32.lib glu32.lib
gldouble.exe:	LDLIBS = user32.lib gdi32.lib opengl32.lib glu32.lib

glxhello glxdouble:	LDLIBS = $(shell pkg-config --libs glew gl xext x11)
#sdlhello.o sdldouble.o sdlopengl.o:	CFLAGS = $(shell sdl-config --cflags)
sdlhello sdldouble sdlopengl:	LDLIBS = $(shell pkg-config --libs sdl gl glu)
sdlopengl:	LDLIBS = $(shell pkg-config --libs sdl gl glu glew)
xhello xchota:	LDLIBS = $(shell pkg-config --libs x11 xext)
xlibjpeg:	LDLIBS = $(shell pkg-config --libs x11) -ljpeg -lm
xliban xlibstdin:	LDLIBS = $(shell pkg-config --libs x11) -lm
anjpeg:		LDLIBS = -ljpeg -lm
ghello.o ghello2.o:	CFLAGS = $(shell pkg-config --cflags gtk+-3.0)
ghello ghello2:		LDLIBS = $(shell pkg-config --libs gtk+-3.0)
xlibpng:	LDLIBS = $(shell pkg-config --libs x11 libpng) -lm

