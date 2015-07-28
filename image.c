//art navsegda image format
#include <stdio.h>
#include "artnavsegda.h"
#define WIDTH 100
#define HEIGHT 100
#define R 'r'
#define G 'g'
#define B 'b'

main()
{
	int x = 0;
	int y = 0;
	fputs(artnavsegda,stdout);
	fputc(WIDTH,stdout);
	fputc(HEIGHT,stdout);
	while (x != WIDTH)
	{
		y = 0;
		while (y != HEIGHT)
		{
			fputc(R,stdout);
			fputc(G,stdout);
			fputc(B,stdout);
			y++;
		}
		//fputs("SCANLINE",stdout);
		x++;
	}
	return 0;
}
