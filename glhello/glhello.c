#include <stdio.h>
#include <windows.h>
#include <windowsx.h>
#include <GL/gl.h>
#include <GL/glu.h>
#include "font.h"

GLuint fontOffset;
char configfile[] = ".\\glhello.ini";
char swidth[10] = "300";
char sheight[10] = "300";
GLfloat xscale = 1.0;
GLfloat yscale = 1.0;
GLint xoffset = 0;
GLint yoffset = 0;

LRESULT CALLBACK WndProc(HWND hWnd,UINT	message,WPARAM wParam,LPARAM lParam)
{
	static HGLRC hRC;
	static HDC hDC;
	switch (message)
	{
	case WM_MOUSEWHEEL:
		switch (LOWORD(wParam))
		{
		case MK_CONTROL|MK_SHIFT:
			glScalef(1.0,GET_WHEEL_DELTA_WPARAM(wParam),1.0);
			break;
		case MK_CONTROL:
			glScalef(GET_WHEEL_DELTA_WPARAM(wParam),1.0,1.0);
			break;
		case MK_SHIFT:
			glTranslatef(0.0,GET_WHEEL_DELTA_WPARAM(wParam),0.0);
			break;
		default:
			glTranslatef(GET_WHEEL_DELTA_WPARAM(wParam)/10,0.0,0.0);
			break;
		}
		InvalidateRect(hWnd,NULL,TRUE);
		break;
	case WM_KEYDOWN:
		if (GetKeyState(VK_CONTROL)<0)
			switch (wParam)
			{
			case VK_RIGHT:
				//glScalef(2.0,1.0,1.0);
				xscale = xscale * 2.0;
				break;
			case VK_LEFT:
				//glScalef(0.5,1.0,1.0);
				xscale = xscale * 0.5;
				break;
			case VK_UP:
				glScalef(1.0,2.0,1.0);
				break;
			case VK_DOWN:
				glScalef(1.0,0.5,1.0);
				break;
			default:
				break;
			}
		else
			switch (wParam)
			{
			case VK_RIGHT:
				glTranslatef(10.0,0.0,0.0);
				break;
			case VK_LEFT:
				glTranslatef(-10.0,0.0,0.0);
				break;
			case VK_UP:
				glTranslatef(0.0,10.0,0.0);
				break;
			case VK_DOWN:
				glTranslatef(0.0,-10.0,0.0);
				break;
			default:
				break;
			}
		InvalidateRect(hWnd,NULL,TRUE);
		break;
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
		glListBase(fontOffset);
		break;
	case WM_DESTROY:
		WritePrivateProfileString("window","height",sheight,configfile);
		WritePrivateProfileString("window","width",swidth,configfile);
		wglMakeCurrent(hDC,NULL);
		wglDeleteContext(hRC);
		PostQuitMessage(0);
		break;
	case WM_SIZE:
		snprintf(swidth,10,"%d",LOWORD(lParam));
		snprintf(sheight,10,"%d",HIWORD(lParam));
		glViewport(0, 0, LOWORD(lParam), HIWORD(lParam));
		glLoadIdentity();
		//gluOrtho2D(0.0,(GLdouble)LOWORD(lParam),0.0,(GLdouble)HIWORD(lParam));
		gluOrtho2D(0.0, (GLdouble)LOWORD(lParam), (GLdouble)HIWORD(lParam), 0.0);
		//gluOrtho2D((GLdouble)LOWORD(lParam)/-2,(GLdouble)LOWORD(lParam)/2,(GLdouble)HIWORD(lParam)/-2,(GLdouble)LOWORD(lParam)/2);
		//glOrtho(0.0,(GLdouble)LOWORD(lParam),0.0,(GLdouble)HIWORD(lParam),-1.0,1.0);
		InvalidateRect(hWnd,NULL,TRUE);
		break;
	case WM_PAINT:
		//glClear(GL_COLOR_BUFFER_BIT);
		glPushMatrix();
		//glScalef(xscale,yscale,1.0);
		glRectf(10, 10, 20, 20);
		//glRasterPos2f(50,50);
		//glCallLists(5, GL_UNSIGNED_BYTE,(GLubyte *)"hello");
		glPopMatrix();
		glFlush();
		SwapBuffers(hDC);
		ValidateRect(hWnd,NULL);
		break;
	case WM_MOUSEMOVE:
		glBegin(GL_POINTS);
		glVertex2f(GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam));
		glEnd();
		InvalidateRect(hWnd, NULL, TRUE);
		break;
	case WM_LBUTTONDOWN:
		break;
	case WM_LBUTTONUP:
		break;
	default:
		return (DefWindowProc(hWnd, message, wParam, lParam));
	}
	return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR lpCmdLine, int nCmdShow)
{
	MSG Msg;
	HWND hwnd;
	WNDCLASS wc = {0,WndProc,0,0,hInstance,LoadIcon(hInstance, "Window"),LoadCursor(NULL, IDC_ARROW),(HBRUSH)(COLOR_WINDOW+1),"Menu","MainWindowClass"};
	RegisterClass(&wc);
	hwnd = CreateWindow("MainWindowClass","Window",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,GetPrivateProfileInt("window","width",300,configfile),GetPrivateProfileInt("window","height",300,configfile),NULL,NULL,hInstance,NULL);
	ShowWindow(hwnd,SW_SHOWDEFAULT);
	while(GetMessage(&Msg, NULL, 0, 0) > 0)
	{
		TranslateMessage(&Msg);
		DispatchMessage(&Msg);
	}
	return 0;
}
