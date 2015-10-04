#include <SDL/SDL.h>
#include <GL/gl.h>
#include <GL/glu.h>
#include <stdio.h>
#include <stdlib.h>
#include "font.h"

int main(int argc, char *argv[])
{
	GLint values[4];
	GLfloat spin = 0.0;
	SDL_Event event;
	atexit(SDL_Quit);
	if (SDL_Init(SDL_INIT_VIDEO) < 0) exit(1);
	if (SDL_SetVideoMode(300, 300, 0, SDL_OPENGL|SDL_RESIZABLE) == 0) exit(1);
	glViewport(0, 0, 300, 300);
	glPixelStorei(GL_UNPACK_ALIGNMENT,1);
	GLuint fontOffset = glGenLists(128);
	for (GLuint i = 32; i < 127; i++)
	{
		glNewList(i+fontOffset, GL_COMPILE);
		glBitmap(8,13,0.0,2.0,10.0,0.0,font[i-32]);
		glEndList();
	}
	GLuint myList = glGenLists(1);
	/*glNewList(myList, GL_COMPILE);
	glBegin(GL_LINE_LOOP);
		glVertex2f(-0.5,-0.5);
		glVertex2f(-0.5,0.5);
		glVertex2f(0.5,0.5);
		glVertex2f(0.5,-0.5);
	glEnd();
	glEndList();*/
	//glMatrixMode(GL_PROJECTION);
	//glLoadIdentity();
	
	while (1)
	{
		while (SDL_PollEvent(&event))
		{
			switch (event.type)
			{
			case SDL_VIDEORESIZE:
				SDL_SetVideoMode(event.resize.w, event.resize.h, 0, SDL_OPENGL|SDL_RESIZABLE);
				glViewport(0,0,event.resize.w, event.resize.h);
				break;
			case SDL_QUIT:
				exit(0);
				break;
			}
		}
		spin = spin + 2.0;
		if (spin > 360)
			spin = spin - 360.0;
		glClearColor(0.0, 0.0, 0.0, 0.0);
		glClear(GL_COLOR_BUFFER_BIT);
		glPushMatrix();
		glRotatef(spin,0.0,0.0,1.0);

		glColor3f(1.0, 1.0, 1.0);
		//glCallList(myList);
		//glRasterPos2f(0.5,0.5);
		glRasterPos2f(0.5,0.5);
		glGetIntegerv(GL_CURRENT_RASTER_POSITION,values);
		printf("%d %d\n",values[0],values[1]);
		glPushAttrib(GL_LIST_BIT);
		glListBase(fontOffset);
		glCallLists(5, GL_UNSIGNED_BYTE,(GLubyte *)"hello");
		//glRectf(-0.5,0.5,0.5,-0.5);

		glPopAttrib();

		glPopMatrix();
		SDL_GL_SwapBuffers();
	}
	return 0;
}
