#include <windows.h>
#include <gl\gl.h>
#include "font.h"

GLuint fontOffset;

LRESULT CALLBACK WndProc(HWND hWnd,UINT	message,WPARAM	wParam,LPARAM	lParam)
{
	static HGLRC hRC;
	static HDC hDC;
	switch (message)
	{
	case WM_CREATE:
		hDC = GetDC(hWnd);		
		static PIXELFORMATDESCRIPTOR pfd = {sizeof(PIXELFORMATDESCRIPTOR),1,PFD_DRAW_TO_WINDOW|PFD_SUPPORT_OPENGL|PFD_DOUBLEBUFFER,PFD_TYPE_RGBA,8,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,PFD_MAIN_PLANE,0,0,0,0 };
		SetPixelFormat(hDC, ChoosePixelFormat(hDC, &pfd), &pfd);
		hRC = wglCreateContext(hDC);
		wglMakeCurrent(hDC, hRC);
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
		break;
	case WM_SIZE:
		glViewport(0, 0, LOWORD(lParam), HIWORD(lParam));
		break;
	case WM_PAINT:
		glClearColor(0.0, 0.0, 0.0, 0.0);
		glClear(GL_COLOR_BUFFER_BIT);
		glColor3f(1.0, 1.0, 1.0);

		glRectf(-0.5, -0.5, 0.5, 0.5);

		glRasterPos2f(0.5,0.5);
		glPushAttrib(GL_LIST_BIT);
		glListBase(fontOffset);
		glCallLists(5, GL_UNSIGNED_BYTE,(GLubyte *)"hello");
		glPopAttrib();
		glFlush();
		SwapBuffers(hDC);
		ValidateRect(hWnd,NULL);
		break;
	default:
		return (DefWindowProc(hWnd, message, wParam, lParam));
	}
	return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR lpCmdLine, int nCmdShow)
{
	HMENU menu;
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
