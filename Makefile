all:	hello.exe winhello.exe

clean:
	del *.obj

hello.exe:	hello.obj
	link hello.obj

winhello.exe:	winhello.obj
	link winhello.obj user32.lib
