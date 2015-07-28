//art navsegda image format
#include <stdio.h>
#include <stdlib.h>
#include <jpeglib.h>
#include <jerror.h>
#include "artnavsegda.h"
#define WIDTH 100
#define HEIGHT 100
#define R 'r'
#define G 'g'
#define B 'b'

void jpeg_error_exit (j_common_ptr cinfo) {
	cinfo->err->output_message (cinfo);
	exit (EXIT_FAILURE);
}

main(int argc, char *argv[])
{
	int lineoffset;
	register JSAMPARRAY lineBuf;
	FILE *inFile;
	struct jpeg_decompress_struct cinfo;
	struct jpeg_error_mgr err_mgr;
	int width;
	int height;
	int bpp;
	u_char *retBuf;
	int x = 0;
	int y = 0;
	if (2 != argc)
	{
		fprintf (stderr, "please specify a filename to %s\n", argv[0]);
		exit(1);
	}
	inFile = fopen(argv[1],"rb");
	if (NULL == inFile) {
		printf("no such file\n");
		exit(1);
	}
	fputs(artnavsegda,stdout);

	cinfo.err = jpeg_std_error(&err_mgr);
	err_mgr.error_exit = jpeg_error_exit;
	jpeg_create_decompress(&cinfo);
	jpeg_stdio_src(&cinfo, inFile);
	jpeg_read_header(&cinfo,1);
	cinfo.do_fancy_upsampling = 0;
	cinfo.do_block_smoothing = 0;
	jpeg_start_decompress(&cinfo);
	width = cinfo.output_width;
	fputc(width,stdout);
	height = cinfo.output_height;
	fputc(height,stdout);
	bpp = cinfo.output_components;
	lineBuf = cinfo.mem->alloc_sarray((j_common_ptr) &cinfo, JPOOL_IMAGE, (width*bpp),1);
	retBuf = malloc(3*(width*height));
	if (NULL == retBuf) {
		printf("no memory\n");
		exit(1);
	}
	for (y = 0; y<cinfo.output_height; ++y)
	{
		lineoffset = width*3;
		jpeg_read_scanlines(&cinfo, lineBuf, 1);
		for (x = 0; x < lineoffset; ++x)
		{
			fputc(lineBuf[0][x],stdout);
			//retBuf[(lineoffset*y)+x] = lineBuf[0][x];
			++x;	
			fputc(lineBuf[0][x],stdout);
			//retBuf[(lineoffset*y)+x] = lineBuf[0][x];
			++x;	
			fputc(lineBuf[0][x],stdout);
			//retBuf[(lineoffset*y)+x] = lineBuf[0][x];
		}
		//fputs("SCANLINE",stdout);
	}
	jpeg_finish_decompress(&cinfo);
	jpeg_destroy_decompress(&cinfo);
	fclose(inFile);

	x = 0;
	while (x != WIDTH)
	{
		y = 0;
		while (y != HEIGHT)
		{
			//fputc(R,stdout);
			//fputc(G,stdout);
			//fputc(B,stdout);
			y++;
		}
		//fputs("SCANLINE",stdout);
		x++;
	}
	return 0;
}
