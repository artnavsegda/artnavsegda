#include <windows.h>
#include <gl\gl.h>

HPALETTE hPalette = NULL;
GLfloat x1 = 100.0f;
GLfloat y1 = 150.0f;
GLsizei rsize = 50;
GLfloat xstep = 1.0f;
GLfloat ystep = 1.0f;
GLfloat windowWidth;
GLfloat windowHeight;
static LPCTSTR lpszAppName = "GLRect";
LRESULT CALLBACK WndProc(HWND hWnd,	UINT message, WPARAM wParam, LPARAM	lParam);
void SetDCPixelFormat(HDC hDC);

void ChangeSize(GLsizei w, GLsizei h)
{
	if(h == 0)
	h = 1;
    glViewport(0, 0, w, h);
    glLoadIdentity();
	if (w <= h) 
	{
		windowHeight = 250.0f*h/w;
		windowWidth = 250.0f;
	}
    else 
	{
		windowWidth = 250.0f*w/h;
		windowHeight = 250.0f;
	}
	glOrtho(0.0f, windowWidth, 0.0f, windowHeight, 1.0f, -1.0f);
}

void IdleFunction(void)
{
	if(x1 > windowWidth-rsize || x1 < 0)
		xstep = -xstep;
	if(y1 > windowHeight-rsize || y1 < 0)
		ystep = -ystep;
	if(x1 > windowWidth-rsize)
		x1 = windowWidth-rsize-1;
	if(y1 > windowHeight-rsize)
		y1 = windowHeight-rsize-1;
	x1 += xstep;
	y1 += ystep;
}

void RenderScene(void)
{
	glClearColor(0.0f, 0.0f, 1.0f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT);
	glColor3f(1.0f, 0.0f, 0.0f);
	glRectf(x1, y1, x1+rsize, y1+rsize);
	glFlush();
}

HPALETTE GetOpenGLPalette(HDC hDC)
{
	HPALETTE hRetPal = NULL;
	PIXELFORMATDESCRIPTOR pfd;
	LOGPALETTE *pPal;
	int nPixelFormat;
	int nColors;
	int i;
	BYTE RedRange,GreenRange,BlueRange;
	nPixelFormat = GetPixelFormat(hDC);
	DescribePixelFormat(hDC, nPixelFormat, sizeof(PIXELFORMATDESCRIPTOR), &pfd);
	if(!(pfd.dwFlags & PFD_NEED_PALETTE))
		return NULL;
	nColors = 1 << pfd.cColorBits;	
	pPal = (LOGPALETTE*)malloc(sizeof(LOGPALETTE) +nColors*sizeof(PALETTEENTRY));
	pPal->palVersion = 0x300;
	pPal->palNumEntries = nColors; 
	RedRange = (1 << pfd.cRedBits) -1;
	GreenRange = (1 << pfd.cGreenBits) - 1;
	BlueRange = (1 << pfd.cBlueBits) -1;
	for(i = 0; i < nColors; i++)
	{
		pPal->palPalEntry[i].peRed = (i >> pfd.cRedShift) & RedRange;
		pPal->palPalEntry[i].peRed = (unsigned char)((double) pPal->palPalEntry[i].peRed * 255.0 / RedRange);
		pPal->palPalEntry[i].peGreen = (i >> pfd.cGreenShift) & GreenRange;
		pPal->palPalEntry[i].peGreen = (unsigned char)((double)pPal->palPalEntry[i].peGreen * 255.0 / GreenRange);
		pPal->palPalEntry[i].peBlue = (i >> pfd.cBlueShift) & BlueRange;
		pPal->palPalEntry[i].peBlue = (unsigned char)((double)pPal->palPalEntry[i].peBlue * 255.0 / BlueRange);
		pPal->palPalEntry[i].peFlags = (unsigned char) NULL;
	}
	hRetPal = CreatePalette(pPal);
	SelectPalette(hDC,hRetPal,FALSE);
	RealizePalette(hDC);
	free(pPal);
	return hRetPal;
}

void SetDCPixelFormat(HDC hDC)
{
	int nPixelFormat;
	static PIXELFORMATDESCRIPTOR pfd = {sizeof(PIXELFORMATDESCRIPTOR),1,PFD_DRAW_TO_WINDOW|PFD_SUPPORT_OPENGL|PFD_DOUBLEBUFFER,PFD_TYPE_RGBA,8,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,PFD_MAIN_PLANE,0,0,0,0 };
	nPixelFormat = ChoosePixelFormat(hDC, &pfd);
	SetPixelFormat(hDC, nPixelFormat, &pfd);
}

int APIENTRY WinMain(HINSTANCE hInstance,HINSTANCE 	hPrevInstance,LPSTR lpCmdLine,int nCmdShow)
{
	MSG			msg;
	WNDCLASS	wc;
	HWND		hWnd;
	wc.style			= CS_HREDRAW | CS_VREDRAW;
	wc.lpfnWndProc		= (WNDPROC) WndProc;
	wc.cbClsExtra		= 0;
	wc.cbWndExtra		= 0;
	wc.hInstance 		= hInstance;
	wc.hIcon			= NULL;
	wc.hCursor			= LoadCursor(NULL, IDC_ARROW);
	wc.hbrBackground	= NULL;		
	wc.lpszMenuName		= NULL;
	wc.lpszClassName	= lpszAppName;
	if(RegisterClass(&wc) == 0)
		return FALSE;
	hWnd = CreateWindow(lpszAppName,lpszAppName,WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN | WS_CLIPSIBLINGS,100, 100,250, 250,NULL,NULL,hInstance,NULL);
	if(hWnd == NULL)
		return FALSE;
	ShowWindow(hWnd,SW_SHOW);
	UpdateWindow(hWnd);
	while( GetMessage(&msg, NULL, 0, 0))
	{
		TranslateMessage(&msg);
		DispatchMessage(&msg);
	}
	return msg.wParam;
}

LRESULT CALLBACK WndProc(HWND hWnd,UINT	message,WPARAM	wParam,LPARAM	lParam)
{
	static HGLRC hRC;
	static HDC hDC;
	switch (message)
	{
		case WM_CREATE:
			hDC = GetDC(hWnd);		
			SetDCPixelFormat(hDC);		
			hRC = wglCreateContext(hDC);
			wglMakeCurrent(hDC, hRC);
			hPalette = GetOpenGLPalette(hDC);
			SetTimer(hWnd,101,1,NULL);
			break;
		case WM_DESTROY:
			KillTimer(hWnd,101);
			wglMakeCurrent(hDC,NULL);
			wglDeleteContext(hRC);
			if(hPalette != NULL)
				DeleteObject(hPalette);
			PostQuitMessage(0);
			break;
		case WM_SIZE:
			ChangeSize(LOWORD(lParam), HIWORD(lParam));
			break;
		case WM_TIMER:
		{
			IdleFunction();
			InvalidateRect(hWnd,NULL,FALSE);
		}
			break;
		case WM_PAINT:
		{
			RenderScene();
			SwapBuffers(hDC);
			ValidateRect(hWnd,NULL);
		}
			break;
		case WM_QUERYNEWPALETTE:
			if(hPalette)
			{
				int nRet;
				SelectPalette(hDC, hPalette, FALSE);
				nRet = RealizePalette(hDC);
				InvalidateRect(hWnd,NULL,FALSE);
				return nRet;
			}
			break;
		case WM_PALETTECHANGED:
			if((hPalette != NULL) && ((HWND)wParam != hWnd))
			{
				SelectPalette(hDC,hPalette,FALSE);
				RealizePalette(hDC);
				UpdateColors(hDC);
				return 0;
			}
			break;
        default:
            return (DefWindowProc(hWnd, message, wParam, lParam));
    }
    return (0L);
}