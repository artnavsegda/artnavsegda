#include <windows.h>
#include <gl\gl.h>

HMENU menu;
HPALETTE hPalette = NULL;
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

void RenderScene(void)
{
	glClearColor(0.0f, 0.0f, 1.0f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT);
	glColor3f(1.0f, 0.0f, 0.0f);
	glRectf(100.0f, 100.0f, 200.0f, 200.0f);
	glFlush();
}

void SetDCPixelFormat(HDC hDC)
{
	int nPixelFormat;
	static PIXELFORMATDESCRIPTOR pfd = {sizeof(PIXELFORMATDESCRIPTOR),1,PFD_DRAW_TO_WINDOW|PFD_SUPPORT_OPENGL|PFD_DOUBLEBUFFER,PFD_TYPE_RGBA,8,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,PFD_MAIN_PLANE,0,0,0,0 };
	nPixelFormat = ChoosePixelFormat(hDC, &pfd);
	SetPixelFormat(hDC, nPixelFormat, &pfd);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR lpCmdLine, int nCmdShow)
{
	MSG Msg;
	HWND hwnd;
	WNDCLASS wc = {0,WndProc,0,0,hInstance,LoadIcon(hInstance, "Window"),LoadCursor(NULL, IDC_ARROW),(HBRUSH)(COLOR_WINDOW+1),"Menu","MainWindowClass"};
	RegisterClass(&wc);
	menu = GetSubMenu(LoadMenu(hInstance,"Menu"),0);
	hwnd = CreateWindow("MainWindowClass","Window",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,300,300,NULL,NULL,hInstance,NULL);
	ShowWindow(hwnd,SW_SHOWDEFAULT);
	while(GetMessage(&Msg, NULL, 0, 0) > 0)
	{
		TranslateMessage(&Msg);
		DispatchMessage(&Msg);
	}
	return 0;
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
			break;
		case WM_DESTROY:
			KillTimer(hWnd,101);
			wglMakeCurrent(hDC,NULL);
			wglDeleteContext(hRC);
			PostQuitMessage(0);
			break;
		case WM_SIZE:
			ChangeSize(LOWORD(lParam), HIWORD(lParam));
			break;
		case WM_PAINT:
			RenderScene();
			SwapBuffers(hDC);
			ValidateRect(hWnd,NULL);
			break;
        default:
            return (DefWindowProc(hWnd, message, wParam, lParam));
    }
    return (0L);
}
