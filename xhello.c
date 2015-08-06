#include <stdio.h>
#include <stdlib.h>
#include <X11/Xlib.h>
#include <GL/glx.h>
#include <GL/gl.h>

static int dblBuf[] =  {GLX_RGBA, GLX_RED_SIZE, 1, GLX_GREEN_SIZE, 1, GLX_BLUE_SIZE, 1, GLX_DEPTH_SIZE, 12, GLX_DOUBLEBUFFER, None};

Display *dpy;
Window win;

void fatalError(char *message)
{
	fprintf(stderr, "glxsimple: %s\n", message);
	exit(1);
}

main(int argc, char **argv)
{
	XVisualInfo *vi;
	Colormap cmap;
	XSetWindowAttributes swa;
	GLXContext cx;
	XEvent event;
	Bool needRedraw = False, recalcModelView = True;
	int dummy;

	dpy = XOpenDisplay(NULL);
	if (dpy == NULL)
		fatalError("could not open display");

	if (!glXQueryExtension(dpy, &dummy, &dummy))
		fatalError("X server has no OpenGL GLX extension");

	vi = glXChooseVisual(dpy, DefaultScreen(dpy), dblBuf);
	cx = glXCreateContext(dpy, vi, None, True);
	if (cx == NULL)
		fatalError("could not create rendering context");

	cmap = XCreateColormap(dpy, RootWindow(dpy, vi->screen), vi->visual, AllocNone);
	swa.colormap = cmap;
	swa.border_pixel = 0;
	swa.event_mask = ExposureMask | ButtonPressMask | StructureNotifyMask;
	win = XCreateWindow(dpy, RootWindow(dpy, vi->screen), 0, 0, 300, 300, 0, vi->depth, InputOutput, vi->visual, CWBorderPixel | CWColormap | CWEventMask, &swa);
	XSetStandardProperties(dpy, win, "glxsimple", "glxsimple", None, argv, argc, NULL);
	glXMakeCurrent(dpy, win, cx);
	XMapWindow(dpy, win);
	Atom WM_DELETE_WINDOW = XInternAtom(dpy, "WM_DELETE_WINDOW", False);
	XSetWMProtocols(dpy, win, &WM_DELETE_WINDOW, 1);

	while (1)
	{
		XNextEvent(dpy, &event);
		switch (event.type)
		{
      			case ConfigureNotify:
				glViewport(0, 0, event.xconfigure.width, event.xconfigure.height);
			case Expose:
				glClearColor(0.0,0.0,0.0,0.0);
				glClear(GL_COLOR_BUFFER_BIT);
				glColor3f(1.0, 1.0, 1.0);
				glMatrixMode(GL_PROJECTION);
				glLoadIdentity();
				glOrtho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
				glBegin(GL_POLYGON);
				glVertex2f(-0.5, -0.5);
				glVertex2f(-0.5, 0.5);
				glVertex2f(0.5, 0.5);
				glVertex2f(0.5, -0.5);
				glEnd();
				glXSwapBuffers(dpy, win);
				glFlush();          
				break;
			case ClientMessage:
				XCloseDisplay(dpy);
				exit(0);
				break;
		}
	}
	return 0;
}
