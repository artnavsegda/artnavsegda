#CFLAGS = /FC
#CFLAGS="-std=gnu99"

all:	hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble
build:	hello.exe winhello.exe glhello.exe winbmp.exe winchota.exe settings.exe

clean:
	rm *.o
	rm hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble

winclean:
	del *.obj *.exe

#hello.exe:	$*.obj
#	link $*.obj

winbmp.obj:	winbmp.c
	cl /FC /c winbmp.c

winbmp.exe:	winbmp.obj
	link winbmp.obj user32.lib gdi32.lib

winhello.exe:	$*.obj
	link $*.obj user32.lib
	
glchota.exe:	glchota.obj glchota.res
	link glchota.obj user32.lib gdi32.lib glchota.res comdlg32.lib opengl32.lib glu32.lib

winchota.exe:	winchota.obj winchota.res
	link winchota.obj user32.lib gdi32.lib winchota.res comdlg32.lib

glhello.exe gldouble.exe:	$*.obj
	link $*.obj user32.lib gdi32.lib opengl32.lib glu32.lib

glxhello:	glxhello.o
	cc -o glxhello glxhello.o -lGLEW -lGL -lXext -lX11

glxdouble:	glxdouble.o
	cc -o glxdouble glxdouble.o -lGLEW -lGL -lXext -lX11

sdlhello.o:	sdlhello.c
	cc -c -o sdlhello.o sdlhello.c `sdl-config --cflags`

sdlhello:	sdlhello.o
	cc -o sdlhello sdlhello.o `sdl-config --libs` -lGL -lGLU

sdldouble.o:	sdldouble.c
	cc -c -o sdldouble.o sdldouble.c `sdl-config --cflags`

sdldouble:	sdldouble.o
	cc -o sdldouble sdldouble.o `sdl-config --libs` -lGL -lGLU

sdlopengl.o:	sdlopengl.c
	cc -fprofile-arcs -pg -c -o sdlopengl.o sdlopengl.c `sdl-config --cflags`

sdlopengl:	sdlopengl.o
	cc -fprofile-arcs -pg -o sdlopengl sdlopengl.o `sdl-config --libs` -lGLEW -lGL -lGLU

xhello:		xhello.o
	cc -o xhello xhello.o -L/usr/X11R6/lib -lXext -lX11

xchota:		xchota.o
	cc -o xchota xchota.o -L/usr/X11R6/lib -lXext -lX11

xlibjpeg:	xlibjpeg.o
	cc xlibjpeg.o -o xlibjpeg -L/usr/X11R6/lib -lX11 -ljpeg -lm

xliban:	xliban.o
	cc xliban.o -o xliban -L/usr/X11R6/lib -lX11 -lm

xlibstdin:	xlibstdin.o
	cc xlibstdin.o -o xlibstdin -L/usr/X11R6/lib -lX11 -lm

anjpeg:	anjpeg.o
	cc anjpeg.o -o anjpeg -ljpeg -lm

ghello.o:	ghello.c
	cc -c -o ghello.o ghello.c `pkg-config --cflags gtk+-3.0`

ghello:		ghello.o
	cc -o ghello ghello.o `pkg-config --libs gtk+-3.0`

ghello2.o:	ghello2.c
	cc -c -o ghello2.o ghello2.c `pkg-config --cflags gtk+-3.0`

ghello2:		ghello2.o
	cc -o ghello2 ghello2.o `pkg-config --libs gtk+-3.0`

xlibpng:	xlibpng.o
	cc xlibpng.o -o xlibpng -L/usr/X11R6/lib -lX11 -lpng -lm

