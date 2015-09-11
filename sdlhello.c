#include <SDL/SDL.h>
#include <GL/gl.h>
#include <GL/glu.h>
#include <stdio.h>
#include <stdlib.h>

int
main(int argc, char *argv[])
{
	SDL_Event event;
	atexit(SDL_Quit);
	if (SDL_Init(SDL_INIT_VIDEO) < 0)
		exit(1);
	if (SDL_SetVideoMode(300, 300, 0, SDL_OPENGL|SDL_RESIZABLE) == 0)
		exit(1);
	glViewport(0, 0, 300, 300);
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
		glClearColor(0.0, 0.0, 0.0, 0.0);
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
		SDL_GL_SwapBuffers();
	}
	return 0;
}
