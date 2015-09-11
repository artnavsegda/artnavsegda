#include <iostream>
#include <stdlib.h>
#include <SDL/SDL.h>

int main(int argc, char* argv[]){ //Our main program
        SDL_Surface *screen;
        SDL_Event event; //Events
        bool done = false; //Not done before we've started...

        if(SDL_Init(SDL_INIT_VIDEO) < 0){ //Could we start SDL_VIDEO?
                std::cerr << "Couldn't init SDL"; //Nope, output to stderr and quit
                exit(1);
        }

        atexit(SDL_Quit); //Now that we're enabled, make sure we cleanup

        screen = SDL_SetVideoMode(640, 480, 32, SDL_HWSURFACE | SDL_RESIZABLE); //Create a 640x480x32 resizable window

        if(!screen){ //Couldn't create window?
                std::cerr << "Couldn't create screen"; //Output to stderr and quit
                exit(1);
        }

        while(!done){ //While program isn't done
                while(SDL_PollEvent(&event)){ //Poll events
                        switch(event.type){ //Check event type
                        case SDL_QUIT: //User hit the X (or equivelent)
                                done = true; //Make the loop end
                                break; //We handled the event
                        case SDL_VIDEORESIZE: //User resized window
                                screen = SDL_SetVideoMode(event.resize.w, event.resize.h, 32,
                                        SDL_HWSURFACE | SDL_RESIZABLE); // Create new window
                                break; //Event handled, fetch next :)
                        } //Finished with current event
                } //Done with all events for now
        } //Program done, exited
}
