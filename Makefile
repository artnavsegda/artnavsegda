WINCC = cl
#WINCC = clang-cl
#WINCFLAGS="-std=gnu99"
WINCFLAGS="/DUNICODE /D_UNICODE"
WINCOMPILE.c = $(WINCC) $(WINCFLAGS) /c
WINCOMPILE.cpp = $(WINCC) $(WINCFLAGS) /c
LINK.o = link
#CFLAGS = /FC
#CFLAGS=-std=gnu99 -mwindows
CFLAGS=-std=gnu99
#LDFLAGS=-mwindows
#LINK="user32.lib"
#WINDRES=x86_64-w64-mingw32-windres
WINDRES=i686-w64-mingw32-windres

#all:	hello interactive image anjpeg chota count debug read x

win:	hello.exe winhello.exe glhello.exe winbmp.exe winchota.exe settings.exe glchota.exe wintouch.exe xinput.exe

#x:	xhello xchota xliban xlibjpeg xlibpng xlibstdin
x:	xlibjpeg xlibpng 
#glx:	glxhello glxdouble
#vala:	vhello vghello vglade vgtext
#gtk:	ghello ghello2
#sdl:	sdlhello sdlopengl sdldouble

clean:
	rm hello glxhello sdlhello xhello ghello xlibjpeg xliban sdlopengl interactive image xlibstdin anjpeg xchota ghello2 anjpeg chota count debug ghello ghello2 image interactive read sdlhello sdlopengl xchota xhello xliban xlibjpeg xlibpng xlibstdin sdldouble glxdouble vhello vghello vglade vgtext *.exe *.o *.obj *.res *~

winclean:
	del *.o *.obj *.exe *.res *~

%.res:	%.rc
#	$(WINDRES) -O coff $*.rc $*.res
	rc $*.rc

%.obj:	%.c
	$(WINCOMPILE.c) $<

%.obj:	%.cpp
	$(WINCOMPILE.cpp) $<

%.exe:	%.obj
	$(LINK.o) $(WINLDFLAGS) $^ $(LOADLIBES) $(LDLIBS) /out:$@


#%.exe:	CC = x86_64-w64-mingw32-gcc
#%.exe:	CXX = x86_64-w64-mingw32-gcc
#%.exe:	CC = i686-w64-mingw32-gcc
#%.exe:	CXX = i686-w64-mingw32-gcc
#%.exe:	%.o
#	$(LINK.o) $^ $(LOADLIBES) $(LDLIBS) /out:$@

winhello.exe winbmp.exe winchota.exe glchota.exe glhello.exe gldouble.exe wintouch.exe gltouch.exe xinput.exe:	LDLIBS += user32.lib
winbmp.exe winchota.exe glchota.exe glhello.exe gldouble.exe gltouch.exe xinput.exe:	LDLIBS += gdi32.lib
winchota.exe glchota.exe:	LDLIBS += comdlg32.lib
glchota.exe glhello.exe gldouble.exe gltouch.exe:	LDLIBS += opengl32.lib glu32.lib
xinput.exe:	LDLIBS += ole32.lib

winhello.exe wintouch.exe:	winhello.res
winchota.exe:	winchota.res
glchota.exe:	glchota.res

xlibjpeg anjpeg xliban xlibstdin xlibpng:	LDLIBS += -lm
xlibjpeg anjpeg:	LDLIBS += -ljpeg
glxhello glxdouble xhello xchota xlibjpeg xliban xlibstdin xlibpng:	LDLIBS += $(shell pkg-config --libs x11)
#glxhello glxdouble xhello xchota:	LDLIBS += $(shell pkg-config --libs xext)
#glxhello glxdouble sdlopengl:	LDLIBS += $(shell pkg-config --libs glew)
#glxhello glxdouble sdlopengl:	LDLIBS += $(shell pkg-config --libs gl)
#sdlhello sdldouble sdlopengl:	LDLIBS += $(shell pkg-config --libs glu)
#sdlhello sdldouble sdlopengl:	LDLIBS += $(shell pkg-config --libs sdl) 
#sdlhello.o sdldouble.o sdlopengl.o:	CFLAGS = $(shell sdl-config --cflags)
#ghello.o ghello2.o:	CFLAGS += $(shell pkg-config --cflags gtk+-3.0)
#ghello ghello2:		LDLIBS += $(shell pkg-config --libs gtk+-3.0)
xlibpng:	LDLIBS += $(shell pkg-config --libs libpng)

#vhello vghello vgtext vglade:	CFLAGS += $(shell pkg-config --cflags glib-2.0 gobject-2.0) -rdynamic
#vhello vghello vgtext vglade:	LDLIBS += $(shell pkg-config --libs glib-2.0 gobject-2.0)
#vghello vgtext vglade:	VALAFLAGS += --pkg gtk+-3.0
#vglade:	VALAFLAGS += --pkg gmodule-2.0
#vghello vgtext vglade:	CFLAGS += $(shell pkg-config --cflags gtk+-3.0)
#vghello vgtext vglade:	LDLIBS += $(shell pkg-config --libs gtk+-3.0)
#%.c:	%.vala
#	valac $(VALAFLAGS) -C $<

