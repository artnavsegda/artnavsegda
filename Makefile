#CFLAGS = /FC
#CFLAGS="-std=gnu99"

all:	hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble
build:	hello.exe winhello.exe glhello.exe winbmp.exe winchota.exe settings.exe

clean:
	rm *.o
	rm hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble

winclean:
	del *.obj *.exe *.res *~

%.res:	%.rc
	rc $*.rc

%.obj:	%.c
	cl /c $<

%.exe:	%.obj
	link $^ $(LDLIBS)

winbmp.obj:	winbmp.c
	cl /FC /c winbmp.c

winbmp.exe:	winbmp.obj
	link winbmp.obj user32.lib gdi32.lib

winhello.exe:	winhello.obj winhello.res
	link $^ user32.lib
	
glchota.exe:	glchota.obj glchota.res
	link glchota.obj user32.lib gdi32.lib glchota.res comdlg32.lib opengl32.lib glu32.lib

winchota.exe:	winchota.obj winchota.res
	link winchota.obj user32.lib gdi32.lib winchota.res comdlg32.lib

glhello.exe:	glhello.obj
	link $*.obj user32.lib gdi32.lib opengl32.lib glu32.lib

gldouble.exe:	gldouble.obj
	link $*.obj user32.lib gdi32.lib opengl32.lib glu32.lib

glxhello:	glxhello.o
	cc -o glxhello glxhello.o -lGLEW -lGL -lXext -lX11

glxdouble:	glxdouble.o
	cc -o glxdouble glxdouble.o -lGLEW -lGL -lXext -lX11

sdlhello.o sdldouble.o sdlopengl.o:	CFLAGS = $(shell sdl-config --cflags)
sdlhello sdldouble sdlopengl:	LDFLAGS = $(shell sdl-config --libs) -lGL -lGLU
sdlopengl:	LDFLAGS = $(shell sdl-config --libs) -lGLEW -lGL -lGLU
xhello xchota:	LDFLAGS = -L/usr/X11R6/lib -lXext -lX11
xlibjpeg:	LDFLAGS = -L/usr/X11R6/lib -lX11 -ljpeg -lm
xliban xlibstdin:	LDFLAGS = -L/usr/X11R6/lib -lX11 -lm
anjpeg:		LDFLAGS = -ljpeg -lm
ghello.o ghello2.o:	CFLAGS = $(shell pkg-config --cflags gtk+-3.0)
ghello ghello2:		LDFLAGS = $(shell pkg-config --libs gtk+-3.0)
xlibpng:	LDFLAGS = -L/usr/X11R6/lib -lX11 -lpng -lm

