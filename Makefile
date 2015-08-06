#CFLAGS = /FC

all:	hello.exe hello winhello.exe glhello.exe glxhello sdlhello xhello ghello xlibjpeg xliban winbmp.exe sdlopengl
build:	hello.exe winhello.exe glhello.exe winbmp.exe

clean:
	rm *.o
	del *.obj

hello.exe:	hello.obj
	link hello.obj

hello:	hello.o
	cc -o hello hello.o

winbmp.obj:	winbmp.c
	cl /FC /c winbmp.c

winbmp.exe:	winbmp.obj
	link winbmp.obj user32.lib gdi32.lib

winhello.exe:	winhello.obj
	link winhello.obj user32.lib

glhello.exe:	glhello.obj
	link glhello.obj user32.lib gdi32.lib opengl32.lib glu32.lib

glxhello:	glxhello.o
	cc -o glxhello glxhello.o -lGL -lXext -lX11

sdlhello.o:	sdlhello.c
	cc -c -o sdlhello.o sdlhello.c `sdl-config --cflags`

sdlhello:	sdlhello.o
	cc -o sdlhello sdlhello.o `sdl-config --libs`

sdlopengl.o:	sdlopengl.c
	cc -c -o sdlopengl.o sdlopengl.c `sdl-config --cflags`

sdlopengl:	sdlopengl.o
	cc -o sdlopengl sdlopengl.o `sdl-config --libs` -lGL -lGLU

xhello:		xhello.o
	cc -o xhello xhello.o -L/usr/X11R6/lib -lGL -lXext -lX11

xlibjpeg:	xlibjpeg.o
	cc xlibjpeg.o -o xlibjpeg -L/usr/X11R6/lib -lX11 -ljpeg -lm

xliban:	xliban.o
	cc xliban.o -o xliban -L/usr/X11R6/lib -lX11 -lm

anjpeg:	anjpeg.o
	cc anjpeg.o -o anjpeg -ljpeg -lm

ghello.o:	ghello.c
	cc -c -o ghello.o ghello.c `pkg-config --cflags gtk+-3.0`

ghello:		ghello.o
	cc -o ghello ghello.o `pkg-config --libs gtk+-3.0`

xlibpng:	xlibpng.o
	cc xlibpng.o -o xlibpng -L/usr/X11R6/lib -lX11 -lpng -lm

