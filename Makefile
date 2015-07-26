all:	hello.exe

clean:
	del *.obj

hello.exe:	hello.obj
	link hello.obj
