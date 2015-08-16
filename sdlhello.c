#include "SDL.h"
#include <stdio.h>

main(int argc, char *argv[])
{
	SDL_Surface *screen;
	SDL_Event event;
	const SDL_VideoInfo* info = NULL;

	if (SDL_Init(SDL_INIT_VIDEO|SDL_INIT_AUDIO)<0)
	{
		printf("error %s\n", SDL_GetError());
		exit(1);
	}
	atexit(SDL_Quit);

	info = SDL_GetVideoInfo();
	if (!info)
	{
		printf("query error %s\n", SDL_GetError());
		exit(1);
	}

	SDL_GL_SetAttribute( SDL_GL_RED_SIZE, 5 );
	SDL_GL_SetAttribute( SDL_GL_GREEN_SIZE, 5 );
	SDL_GL_SetAttribute( SDL_GL_BLUE_SIZE, 5 );
	SDL_GL_SetAttribute( SDL_GL_DEPTH_SIZE, 16 );
	SDL_GL_SetAttribute( SDL_GL_DOUBLEBUFFER, 1 );

	SDL_WM_SetCaption("My Game Window", "game");

	screen = SDL_SetVideoMode(640,480, 32, SDL_OPENGL);
	if (screen==NULL)
	{
		printf("video error %s\n", SDL_GetError());
		exit(1);
	}
	while (SDL_WaitEvent(&event))
	{
		switch(event.type)
		{
			case SDL_QUIT:
				exit(0);
				break;
		}
	}
	exit(1);
}
