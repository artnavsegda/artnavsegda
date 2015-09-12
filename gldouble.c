#include <windows.h>
#include <gl\gl.h>
#include "font.h"

GLuint fontOffset;
typedef BOOL (APIENTRY *PFNWGLSWAPINTERVALFARPROC)(int);
PFNWGLSWAPINTERVALFARPROC wglSwapIntervalEXT;

HDC hDC;
HGLRC hRC;

LRESULT CALLBACK WndProc(HWND hWnd,UINT	message,WPARAM	wParam,LPARAM	lParam)
{
	switch (message)
	{
	case WM_CREATE:
		hDC = GetDC(hWnd);		
		PIXELFORMATDESCRIPTOR pfd = {sizeof(PIXELFORMATDESCRIPTOR),1,PFD_DRAW_TO_WINDOW|PFD_SUPPORT_OPENGL|PFD_DOUBLEBUFFER,PFD_TYPE_RGBA,8,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,PFD_MAIN_PLANE,0,0,0,0 };
		SetPixelFormat(hDC, ChoosePixelFormat(hDC, &pfd), &pfd);
		hRC = wglCreateContext(hDC);
		wglMakeCurrent(hDC, hRC);
		wglSwapIntervalEXT = (PFNWGLSWAPINTERVALFARPROC)wglGetProcAddress("wglSwapIntervalEXT");
		wglSwapIntervalEXT(1);
		glPixelStorei(GL_UNPACK_ALIGNMENT,1);
		fontOffset = glGenLists(128);
		for (GLuint i = 32; i < 127; i++)
		{
			glNewList(i+fontOffset, GL_COMPILE);
			glBitmap(8,13,0.0,2.0,10.0,0.0,font[i-32]);
			glEndList();
		}
		break;
	case WM_DESTROY:
		wglMakeCurrent(hDC,NULL);
		wglDeleteContext(hRC);
		PostQuitMessage(0);
		exit(0);
		break;
	case WM_SIZE:
		glViewport(0, 0, LOWORD(lParam), HIWORD(lParam));
		break;
	default:
		return (DefWindowProc(hWnd, message, wParam, lParam));
	}
	return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR lpCmdLine, int nCmdShow)
{
	GLfloat spin = 0.0;
	MSG Msg;
	WNDCLASS wc = {0,WndProc,0,0,hInstance,LoadIcon(hInstance, "Window"),LoadCursor(NULL, IDC_ARROW),NULL,"Menu","MainWindowClass"};
	RegisterClass(&wc);
	HMENU menu = GetSubMenu(LoadMenu(hInstance,"Menu"),0);
	HWND hwnd = CreateWindow("MainWindowClass","Window",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,300,300,NULL,NULL,hInstance,NULL);
	ShowWindow(hwnd,SW_SHOWDEFAULT);
	while (1)
	{
		while(PeekMessage(&Msg, NULL, 0, 0, PM_REMOVE) > 0)
		{
			TranslateMessage(&Msg);
			DispatchMessage(&Msg);
		}
		spin = spin + 2.0;
		if (spin > 360)
			spin = spin - 360.0;
		glClearColor(0.0, 0.0, 0.0, 0.0);
		glClear(GL_COLOR_BUFFER_BIT);
		glPushMatrix();
		glRotatef(spin,0.0,0.0,1.0);
		glColor3f(1.0, 1.0, 1.0);
		//glRectf(-0.5, -0.5, 0.5, 0.5);
		glBegin(GL_LINE_LOOP);
			glVertex2f(-0.5,-0.5);
			glVertex2f(-0.5,0.5);
			glVertex2f(0.5,0.5);
			glVertex2f(0.5,-0.5);
		glEnd();

		glRasterPos2f(0.5,0.5);
		glPushAttrib(GL_LIST_BIT);
		glListBase(fontOffset);
		glCallLists(5, GL_UNSIGNED_BYTE,(GLubyte *)"hello");
		glPopAttrib();

		glPopMatrix();
		glFlush();
		SwapBuffers(hDC);
		ValidateRect(hwnd,NULL);
//		Sleep(1);
	}
	return 0;
}
