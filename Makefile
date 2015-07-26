all:	hello.exe winhello.exe glhello.exe glxhello

clean:
	rm *.o
	del *.obj

hello.exe:	hello.obj
	link hello.obj

winhello.exe:	winhello.obj
	link winhello.obj user32.lib

glhello.exe:	glhello.obj
	link glhello.obj user32.lib gdi32.lib opengl32.lib glu32.lib

glxhello:	glxhello.o
	cc -o glxhello glxhello.o -lGL -lXext -lX11

