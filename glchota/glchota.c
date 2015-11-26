#include <stdio.h>
#include <windows.h>
#include <windowsx.h>
#include <gl\gl.h>
#include <gl\glu.h>

#define VSYNC 1

#define LODWORD(ull) ((DWORD)((ULONGLONG)(ull) & 0x00000000ffffffff))

typedef BOOL(APIENTRY *PFNWGLSWAPINTERVALFARPROC)(int);
PFNWGLSWAPINTERVALFARPROC wglSwapIntervalEXT;

char configfile[] = ".\\glchota.ini";
char swidth[10] = "300";
char sheight[10] = "300";

HMENU menu;
HDC hDC;
HGLRC hRC;

#define MAXLENGTH 900000
int open = 0;
GLfloat xscale = 1.0;
GLfloat yscale = 1.0;
double xpos = 0.0;
float dscale = 1.0;

int m[20][901000];
int max[20];
int min[20];
int col[20];
int l;

float xspan = 0.0;
int xwidth, yheight;
//double xscale = 1.0;
POINT mouse;
int mousex, mousey;
int deltax, deltay;

int leveli = 0;
float level[20];

int developmassive(char filename[])
{
	l = 0;
	FILE *sora;
//	sora = fopen("./chota.txt","r");
	sora = fopen(filename,"r");
	if (sora == NULL)
	{
		printf("fucking error");
		exit(0);
	}
	else
		open = 1;
	memset(max,0,sizeof(max));
	memset(max,0,sizeof(min));
	while (fscanf(sora,"%d %d %d %d %d %d %d %d %d %d %d %d %d\n", &m[1][l],&m[2][l],&m[3][l],&m[4][l],&m[5][l],&m[6][l],&m[7][l],&m[8][l],&m[9][l],&m[10][l],&m[11][l],&m[12][l],&m[13][l])!=EOF)
	{
		for(int i=1;i<=13;i++)
		{
			if (min[i]==0) min[i]=m[i][l];
			if (max[i]==0) max[i]=m[i][l];
			if (m[i][l]<min[i]) min[i]=m[i][l];
			if (m[i][l]>max[i]) max[i]=m[i][l];
		}
		if (l++ > MAXLENGTH)
			break;
	}
	printf("length is %d\n",l);
	for(int i=1;i<=13;i++)
		printf("%d: min %d, max %d, span %d\n",i,min[i],max[i],max[i]-min[i]);
	return 0;
}

BOOL CALLBACK DialogFunc(HWND hwndDlg, UINT message, WPARAM wParam, LPARAM lParam) 
{ 
	char workstring[100];
    switch (message) 
    {
		case WM_INITDIALOG:
			for (int i = 1; i <= 13; i++)
				CheckDlgButton(hwndDlg, 4 + i, col[i]);
			for (int i = 1; i <= 13; i++)
				SetDlgItemInt(hwndDlg, 24+i, min[i], FALSE);

		break;
        case WM_COMMAND: 
            switch (LOWORD(wParam)) 
            { 
                case 4: 
                    //if (!GetDlgItemText(hwndDlg, ID_ITEMNAME, szItemName, 80)) 
                    //     *szItemName=0; 
 				break;
                case 2:
					//SendDlgItemMessage(hwndDlg,3,EM_GETLINE,(WPARAM)0,(LPARAM)startsectorstring);
					//startsector = atoi(startsectorstring);
					//sscanf(startsectorstring,"%d",&startsector);
					//slip = GetDlgItemInt(hwndDlg,3,NULL,FALSE);
					for (int i = 1; i <= 13; i++)
						min[i] = GetDlgItemInt(hwndDlg, 24+i, NULL, FALSE);
                    EndDialog(hwndDlg, wParam);
                    return TRUE; 
				break;
				case 5:
				case 6:
				case 7:
				case 8:
				case 9:
				case 10:
				case 11:
				case 12:
				case 13:
				case 14:
				case 15:
				case 16:
				case 17:
					col[LOWORD(wParam) - 4] = IsDlgButtonChecked(hwndDlg, LOWORD(wParam));
					break;
            }
		break;
    } 
    return FALSE; 
} 

POINT first, second;
DWORD dwarg;

LRESULT DecodeGesture(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
	double k;
	// Create a structure to populate and retrieve the extra message info.
	GESTUREINFO gi;

	ZeroMemory(&gi, sizeof(GESTUREINFO));

	gi.cbSize = sizeof(GESTUREINFO);

	BOOL bResult = GetGestureInfo((HGESTUREINFO)lParam, &gi);
	BOOL bHandled = FALSE;

	if (bResult)
	{
		// now interpret the gesture
		switch (gi.dwID)
		{
		case GID_ZOOM:
			// Code for zooming goes here     
			switch (gi.dwFlags)
			{
			case GF_BEGIN:
				dwarg = LODWORD(gi.ullArguments);
				first.x = gi.ptsLocation.x;
				first.y = gi.ptsLocation.y;
				ScreenToClient(hWnd, &first);
				break;
			default:
				second.x = gi.ptsLocation.x;
				second.y = gi.ptsLocation.y;
				ScreenToClient(hWnd, &second);
				k = (double)(LODWORD(gi.ullArguments)) / (double)(dwarg);
				//glScalef(k, k, 1.0);
				xscale = xscale * k;
				yscale = yscale * k;
				InvalidateRect(hWnd, NULL, TRUE);
				first = second;
				dwarg = LODWORD(gi.ullArguments);
				break;
			}
			bHandled = TRUE;
			break;
		case GID_PAN:
			// Code for panning goes here
			switch (gi.dwFlags)
			{
			case GF_BEGIN:
				first.x = gi.ptsLocation.x;
				first.y = gi.ptsLocation.y;
				ScreenToClient(hWnd, &first);
				break;
			default:
				second.x = gi.ptsLocation.x;
				second.y = gi.ptsLocation.y;
				ScreenToClient(hWnd, &second);
				glTranslatef(second.x - first.x, first.y - second.y, 0.0);
				InvalidateRect(hWnd, NULL, TRUE);
				first = second;
				break;
			}
			bHandled = TRUE;
			break;
		case GID_ROTATE:
			// Code for rotation goes here
			bHandled = TRUE;
			break;
		case GID_TWOFINGERTAP:
			// Code for two-finger tap goes here
			MessageBoxW(hWnd, L"Weehee!", L"two finger tap recieved", MB_OK);
			bHandled = TRUE;
			break;
		case GID_PRESSANDTAP:
			// Code for roll over goes here
			bHandled = TRUE;
			break;
		default:
			// A gesture was not recognized
			break;
		}
	}
	else
	{
		DWORD dwErr = GetLastError();
		if (dwErr > 0)
		{
			//MessageBoxW(hWnd, L"Error!", L"Could not retrieve a GESTUREINFO structure.", MB_OK);
		}
	}
	if (bHandled)
	{
		return 0;
	}
	else
	{
		return DefWindowProc(hWnd, message, wParam, lParam);
	}
}

float mousexprev = 0;
float xscaleprev = 1.0;
float sourcexprev = 0;

float sourcetodest(float source)
{
	if (sourcexprev == 0)
		return l / ((float)xwidth / (float)mousex);
	else
		return sourcexprev - ((mousexprev - mousex)/(float)xscaleprev);
}

int openrecent(HWND hwnd)
{
	char filename[260];
	//WritePrivateProfileString("window", "filename", ofn.lpstrFile, configfile);
	GetPrivateProfileString("window", "filename", "default", filename, 260, configfile);
	//GetPrivateProfileInt("window", "width", 300, configfile);
	if (strcmp(filename, "default") == 0)
		SendMessage(hwnd, WM_COMMAND, 3, 0);
	else
		developmassive(filename);
	return 0;
}

int render(HWND hwnd)
{
	double scaleX = (double)xwidth / (double)l;
	double scaleY = 300 / yheight;
	//float destx = xwidth / 2;
	double destx = mousex;
	double desty = yheight / 2;
	//float sourcex = l / ((float)xwidth / (float)mousex);
	double sourcex = sourcetodest(destx);
	double sourcey = 150;

	mousexprev = mousex;
	xscaleprev = xscale;
	sourcexprev = sourcex;

	glClear(GL_COLOR_BUFFER_BIT);
	glColor3f(1.0, 1.0, 1.0);
	glPushMatrix();
	glTranslatef(destx, desty, 0.0);
	glScalef(xscale, yscale, 1.0);
	glTranslatef(sourcex * -1.0, sourcey * -1.0, 0.0);

	if (open == 1)
	{
		for (int iz = 1; iz <= 13; iz++)
		{
			if (GetMenuState(GetMenu(hwnd), iz + 10, MF_BYCOMMAND) & MF_CHECKED)
			//if (iz == 13)
			{
				glPushMatrix();
				glTranslatef(0.0, level[iz], 0.0);
				if (iz == leveli)
					glColor3f(1.0, 0.0, 0.0);
				else
					glColor3f(1.0, 1.0, 1.0);
				glBegin(GL_LINE_STRIP);
				for (int i = 0; i<l; i++)
					glVertex2i(i, m[iz][i]);
				glEnd();
				glPopMatrix();
			}
		}

	}
	glPopMatrix();
	glBegin(GL_LINES);
	glVertex2i(mousex, 0);
	glVertex2i(mousex, yheight);
	glEnd();
	glFlush();
	SwapBuffers(hDC);
	return 0;
}

int animate(HWND hwnd, int count, int xdelta, int ydelta, double zoom)
{
	while (count)
	{
		sourcexprev = sourcexprev + (xdelta / xscaleprev);
		xscale = xscale * zoom;
		glTranslatef(0.0, ydelta, 0.0);
		render(hwnd);
		count--;
	}
	return 0;
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	char text[100];
	switch(msg)
	{
	case WM_CONTEXTMENU:
		TrackPopupMenu(menu, TPM_LEFTALIGN, GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam), 0, hwnd, NULL);
		break;
	case WM_COMMAND:
		switch (LOWORD(wParam))
		{
		case 0:
			DestroyWindow(hwnd);
			break;
		case 1:
			DialogBox(GetModuleHandle(NULL), "MainDialog", hwnd, (DLGPROC)DialogFunc);
			InvalidateRect(hwnd, NULL, TRUE);
			break;
		case 2:
			WritePrivateProfileStringA("window", "height", sheight, configfile);
			WritePrivateProfileStringA("window", "width", swidth, configfile);
			break;
		case 3:
		{
			OPENFILENAME ofn;
			char szFile[260];
			ZeroMemory(&ofn, sizeof(ofn));
			ofn.lStructSize = sizeof(ofn);
			ofn.hwndOwner = hwnd;
			ofn.lpstrFile = szFile;
			ofn.lpstrFile[0] = '\0';
			ofn.nMaxFile = sizeof(szFile);
			ofn.lpstrFilter = "Text\0*.TXT\0All\0*.*\0";
			ofn.nFilterIndex = 1;
			ofn.lpstrFileTitle = NULL;
			ofn.nMaxFileTitle = 0;
			ofn.lpstrInitialDir = NULL;
			ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_NOCHANGEDIR;
			if (GetOpenFileName(&ofn) == TRUE)
			{
				WritePrivateProfileString("window", "filename", ofn.lpstrFile, configfile);
				developmassive(ofn.lpstrFile);
				InvalidateRect(hwnd, NULL, TRUE);
			}
			//else
			//	DestroyWindow(hwnd);
		}
		break;
		case 11:
		case 12:
		case 13:
		case 14:
		case 15:
		case 16:
		case 17:
		case 18:
		case 19:
		case 20:
		case 21:
		case 22:
		case 23:
			if (GetMenuState(GetMenu(hwnd), LOWORD(wParam), MF_BYCOMMAND) & MF_CHECKED)
				CheckMenuItem(GetMenu(hwnd), LOWORD(wParam), MF_BYCOMMAND | MF_UNCHECKED);
			else
				CheckMenuItem(GetMenu(hwnd), LOWORD(wParam), MF_BYCOMMAND | MF_CHECKED);
			InvalidateRect(hwnd, NULL, TRUE);
			break;
		}
		break;
	case WM_CREATE:
		hDC = GetDC(hwnd);
		PIXELFORMATDESCRIPTOR pfd = { sizeof(PIXELFORMATDESCRIPTOR),1,PFD_DRAW_TO_WINDOW | PFD_SUPPORT_OPENGL | PFD_DOUBLEBUFFER,PFD_TYPE_RGBA,8,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,PFD_MAIN_PLANE,0,0,0,0 };
		SetPixelFormat(hDC, ChoosePixelFormat(hDC, &pfd), &pfd);
		hRC = wglCreateContext(hDC);
		wglMakeCurrent(hDC, hRC);
		wglSwapIntervalEXT = (PFNWGLSWAPINTERVALFARPROC)wglGetProcAddress("wglSwapIntervalEXT");
		wglSwapIntervalEXT(VSYNC);
		openrecent(hwnd);
		InvalidateRect(hwnd, NULL, TRUE);
		//SendMessage(hwnd, WM_COMMAND,3,0);
		break;
	case WM_DESTROY:
		WritePrivateProfileString("window", "height", sheight, configfile);
		WritePrivateProfileString("window", "width", swidth, configfile);
		wglMakeCurrent(hDC, NULL);
		wglDeleteContext(hRC);
		PostQuitMessage(0);
		break;
	case WM_GESTURENOTIFY:
		GESTURECONFIG gc = { 0, GC_ALLGESTURES, 0 };
		SetGestureConfig(hwnd, 0, 1, &gc, sizeof(GESTURECONFIG));
		return DefWindowProc(hwnd, WM_GESTURENOTIFY, wParam, lParam);
		break;
	case WM_GESTURE:
		return DecodeGesture(hwnd, msg, wParam, lParam);
		break;
	case WM_KEYDOWN:
		if (GetKeyState(VK_CONTROL)<0)
			switch (wParam)
			{
			case VK_UP:
				xscale = xscale * 2.0;
				break;
			case VK_DOWN:
				if (xscale * 0.5>(double)xwidth / l)
					xscale = xscale * 0.5;
				else
					xscale = (double)xwidth / l;
				break;
			}
		else
			switch (wParam)
			{
			case VK_RIGHT:
				//glTranslatef(-100.0,0.0,0.0);
				//if (xspan-(1.0/xscale)>=0)
				//xspan=xspan-(1.0/xscale);

				//if (xspan+(-1.0/xscale)>=0)
				//xspan=xspan+(-1.0/xscale);
				//scrollright(1);
				//xpos=xpos-(1.0*dscale);
				//sourcexprev = sourcexprev + (10 / xscaleprev);
				//InvalidateRect(hwnd, NULL, TRUE);
				animate(hwnd, 5, 5.0, 0.0, 1.0);
				break;
			case VK_LEFT:
				//glTranslatef(100.0,0.0,0.0);
				//if ((   (l-xspan)   *xscale)     > xwidth)
				//xspan=xspan+(1.0/xscale);
				//scrollleft(1);
				//xpos=xpos+(1.0*dscale);
				//sourcexprev = sourcexprev - (10 / xscaleprev);
				//InvalidateRect(hwnd, NULL, TRUE);
				animate(hwnd, 5, -5.0, 0.0, 1.0);
				break;
			case VK_UP:
				//glTranslatef(0.0, 10.0, 0.0);
				animate(hwnd,10, 0.0, 3.0, 1.0);
				break;
			case VK_DOWN:
				//glTranslatef(0.0, -10.0, 0.0);
				animate(hwnd,10, 0.0, -3.0, 1.0);
				break;
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				leveli = wParam - 0x30;
				break;
			default:
				break;
			}
		InvalidateRect(hwnd, NULL, TRUE);
		break;
	case WM_LBUTTONDOWN:
		mousex = GET_X_LPARAM(lParam);
		mousey = GET_Y_LPARAM(lParam);
		break;
	case WM_LBUTTONDBLCLK:
		mousex = GET_X_LPARAM(lParam);
		mousey = GET_Y_LPARAM(lParam);
		//xscale = xscale * 2.0;
		animate(hwnd, 5, 0.0, 0.0, 1.1);
		InvalidateRect(hwnd, NULL, TRUE);
		break;
	case WM_MOUSEMOVE:
		switch (LOWORD(wParam))
		{
		case MK_LBUTTON:
			deltax = mousex - GET_X_LPARAM(lParam);
			mousex = GET_X_LPARAM(lParam);
			deltay = mousey - GET_Y_LPARAM(lParam);
			mousey = GET_Y_LPARAM(lParam);
			sourcexprev = sourcexprev + (deltax / xscaleprev);
			glTranslatef(0.0, deltay / yscale, 0.0);
			InvalidateRect(hwnd, NULL, TRUE);
			break;
		case MK_LBUTTON | MK_SHIFT:
			//deltax = mousex - GET_X_LPARAM(lParam);
			//mousex = GET_X_LPARAM(lParam);
			deltay = mousey - GET_Y_LPARAM(lParam);
			mousey = GET_Y_LPARAM(lParam);
			level[leveli] = level[leveli] + (deltay / yscale);
			InvalidateRect(hwnd, NULL, TRUE);
			break;
		default:
			mousex = GET_X_LPARAM(lParam);
			mousey = GET_Y_LPARAM(lParam);
			InvalidateRect(hwnd, NULL, TRUE);
			break;
		}
		break;
	case WM_MOUSEHWHEEL:
		if (GET_WHEEL_DELTA_WPARAM(wParam) > 0)
		{
			//sourcexprev = sourcexprev + (10 / xscaleprev);
			//animate(hwnd, 3, 3.0, 0.0, 1.0);
		}
		else
		{
			//sourcexprev = sourcexprev - (10 / xscaleprev);
			//animate(hwnd, 3, -3.0, 0.0, 1.0);
		}
		InvalidateRect(hwnd, NULL, TRUE);
		break;
	case WM_MOUSEWHEEL:
		mouse.x = GET_X_LPARAM(lParam);
		mouse.y = GET_Y_LPARAM(lParam);
		ScreenToClient(hwnd, &mouse);
		mousex = mouse.x;
		mousey = mouse.y;
		switch (LOWORD(wParam))
		{
		case MK_CONTROL | MK_SHIFT:
			break;
		case MK_CONTROL:
			if (GET_WHEEL_DELTA_WPARAM(wParam) > 0)
			{
				animate(hwnd, 5, 0.0, 0.0, 1.05);
				//xscale = xscale * 1.1;
			}
			else
				if (xscale / 1.1 > (double)xwidth / l)
				{
					//xscale = xscale / 1.1;
					animate(hwnd, 5, 0.0, 0.0, 0.95);
				}
				else
				{
					xscale = (double)xwidth / l;
				}
			break;
		case MK_SHIFT:
			if (GET_WHEEL_DELTA_WPARAM(wParam) > 0)
			{
				yscale = yscale * 2;
				glScalef(1.0, 2.0, 1.0);
			}
			else
			{
				yscale = yscale * 0.5;
				glScalef(1.0, 0.5, 1.0);
			}
			break;
		default:
			if (GET_WHEEL_DELTA_WPARAM(wParam) > 0)
			{
				//animate(hwnd, 5, 0.0, -5.0, 1.0);
				//glTranslatef(0.0, -10.0, 0.0);
			}
			else
			{
				//animate(hwnd, 5, 0.0, 5.0, 1.0);
				//glTranslatef(0.0, 10.0, 0.0);
			}
			break;
		}
		InvalidateRect(hwnd, NULL, TRUE);
		break;
	case WM_PAINT:
		{
			render(hwnd);
			ValidateRect(hwnd,NULL);
		}
		break;
	case WM_SIZE:
		xwidth = LOWORD(lParam);
		yheight = HIWORD(lParam);
		snprintf(swidth, 10, "%d", LOWORD(lParam));
		snprintf(sheight, 10, "%d", HIWORD(lParam));
		glViewport(0, 0, LOWORD(lParam), HIWORD(lParam));
		glLoadIdentity();
		gluOrtho2D(0.0, (GLdouble)LOWORD(lParam), 0.0, (GLdouble)HIWORD(lParam));
		xscale = (float)xwidth / (float)l;
		InvalidateRect(hwnd, NULL, TRUE);
		break;
	default:
			return DefWindowProc(hwnd, msg, wParam, lParam);
	}
	return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR lpCmdLine, int nCmdShow)
{
	MSG Msg;
	HWND hwnd;
	WNDCLASS wc = {CS_DBLCLKS,WindowProc,0,0,hInstance,LoadIcon(hInstance, "Window"),LoadCursor(NULL, IDC_ARROW),CreateSolidBrush(RGB(0,0,0)),"Menu","MainWindowClass"};
	RegisterClass(&wc);
	menu = GetSubMenu(LoadMenu(hInstance,"Menu"),0);
	hwnd = CreateWindow("MainWindowClass","Window",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,GetPrivateProfileInt("window","width",300,configfile),GetPrivateProfileInt("window","height",300,configfile),NULL,NULL,hInstance,NULL);
	ShowWindow(hwnd,SW_SHOWDEFAULT);
	while(GetMessage(&Msg, NULL, 0, 0) > 0)
	{
		TranslateMessage(&Msg);
		DispatchMessage(&Msg);
	}
	return 0;
}
