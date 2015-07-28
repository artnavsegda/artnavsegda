#include "SDL.h"
#include <stdio.h>

main(int argc, char *argv[])
{
	SDL_Surface *screen;
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

	screen = SDL_SetVideoMode(640,480, 32, SDL_OPENGL);
	if (screen==NULL)
	{
		printf("video error %s\n", SDL_GetError());
		exit(1);
	}
}
