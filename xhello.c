#include <X11/Xlib.h>
#include <X11/Xutil.h>

#include <GL/glx.h>
#include <GL/gl.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
 
Display *d;
Window w;
static int dblBuf[] =  {GLX_RGBA, GLX_RED_SIZE, 1, GLX_GREEN_SIZE, 1, GLX_BLUE_SIZE, 1, GLX_DEPTH_SIZE, 12, GLX_DOUBLEBUFFER, None};

main(void) {
	XVisualInfo *vi;
	Colormap cmap;
	XSetWindowAttributes swa;
	XEvent e;
	char *msg = "Hello, World!";
	int s;
 
	d = XOpenDisplay(NULL);
	if (d == NULL)
	{
		fprintf(stderr, "Cannot open display\n");
		exit(1);
	}
 
	s = DefaultScreen(d);
	vi = glXChooseVisual(d, DefaultScreen(d), dblBuf);
	cmap = XCreateColormap(d, RootWindow(d, vi->screen), vi->visual, AllocNone);
	swa.colormap = cmap;
	swa.border_pixel = 0;
	swa.event_mask = ExposureMask | ButtonPressMask | StructureNotifyMask;
	w = XCreateWindow(d, RootWindow(d, s), 10, 10, 100, 100, 1, vi->depth, InputOutput, vi->visual, CWBorderPixel | CWColormap | CWEventMask, &swa);
	XSelectInput(d, w, ExposureMask | KeyPressMask);
	XMapWindow(d, w);
	Atom WM_DELETE_WINDOW = XInternAtom(d, "WM_DELETE_WINDOW", False);
	XSetWMProtocols(d, w, &WM_DELETE_WINDOW, 1);
 
	while (1)
	{
		XNextEvent(d, &e);
		if (e.type == Expose) {
			XFillRectangle(d, w, DefaultGC(d, s), 20, 20, 10, 10);
			XDrawString(d, w, DefaultGC(d, s), 10, 50, msg, strlen(msg));
		}
		if (e.type == KeyPress)
			break;
		if (e.type == ClientMessage)
			break;
	}
 
	XCloseDisplay(d);
	return 0;
}

