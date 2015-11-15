#include <stdio.h>
#include <windows.h>
#include <windowsx.h>
#include <gl\gl.h>
#include <gl\glu.h>

HMENU menu;
HDC hDC;
HGLRC hRC;

#define MAXLENGTH 900000
int column = 5;
int acol = BST_CHECKED,bcol = BST_CHECKED,ccol = BST_CHECKED,dcol = BST_CHECKED,ecol = BST_CHECKED,
fcol = BST_CHECKED,gcol = BST_CHECKED,hcol = BST_CHECKED,icol = BST_CHECKED,jcol = BST_CHECKED,
kcol = BST_CHECKED,lcol = BST_CHECKED,mcol = BST_CHECKED;
//int amin=0,bmin=0,cmin=0,dmin=0,emin=0,fomin=0,gmin=0,hmin=0,imin=0,jmin=0,kmin=0,lmin=0,mmin=0;
//int amax=0,bmax=0,cmax=0,dmax=0,emax=0,fomax=0,gmax=0,hmax=0,imax=0,jmax=0,kmax=0,lmax=0,mmax=0;
//int massive[20][901000];
int open = 0;
int numbers = 1;
int startsector = 0;
int length = 0;
int slip = 1;
int vslip = 1;
//float aspan=1.0,bspan=1.0,cspan=1.0,dspan=1.0,espan=1.0,fspan=1.0,gspan=1.0,hspan=1.0,ispan=1.0,jspan=1.0,kspan=1.0,lspan=1.0,mspan=1.0;
int screenwidth = 2700;
GLfloat xscale = 1.0;
GLfloat yscale = 1.0;
double xpos = 0.0;
float dscale = 1.0;

int m[20][901000];
int max[20];
int min[20];
int l;

float xspan = 0.0;
int xwidth, yheight;
//double xscale = 1.0;
int mousex, mousey;
int deltax, deltay;

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
	memset(max,0,sizeof(max));
	memset(max,0,sizeof(min));
	while (fscanf(sora,"%d %d %d %d %d %d %d %d %d %d %d %d %d\n", &m[1][l],&m[2][l],&m[3][l],&m[4][l],&m[5][l],&m[6][l],&m[7][l],&m[8][l],&m[9][l],&m[10][l],&m[11][l],&m[12][l],&m[13][l])!=EOF)
	{
		for(int i=1;i!=12;i++)
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
	for(int i=1;i!=12;i++)
		printf("%d: min %d, max %d, span %d\n",i,min[i],max[i],max[i]-min[i]);
	return 0;
}

BOOL CALLBACK DialogFunc(HWND hwndDlg, UINT message, WPARAM wParam, LPARAM lParam) 
{ 
	char workstring[100];
    switch (message) 
    {
		case WM_INITDIALOG:
			CheckDlgButton(hwndDlg,5,acol);
			CheckDlgButton(hwndDlg,6,bcol);
			CheckDlgButton(hwndDlg,7,ccol);
			CheckDlgButton(hwndDlg,8,dcol);
			CheckDlgButton(hwndDlg,9,ecol);
			CheckDlgButton(hwndDlg,10,fcol);
			CheckDlgButton(hwndDlg,11,gcol);
			CheckDlgButton(hwndDlg,12,hcol);
			CheckDlgButton(hwndDlg,13,icol);
			CheckDlgButton(hwndDlg,14,jcol);
			CheckDlgButton(hwndDlg,15,kcol);
			CheckDlgButton(hwndDlg,16,lcol);
			CheckDlgButton(hwndDlg,17,mcol);
			SetDlgItemInt(hwndDlg,3,slip,FALSE);
			SetDlgItemInt(hwndDlg,25,min[1],FALSE);
			//SendDlgItemMessage(hwndDlg,3,WM_SETTEXT,(WPARAM)0,(LPARAM)"0");
			//sprintf(workstring,"%f",aspan);
			//SetDlgItemText(hwndDlg,25,workstring);
			SetDlgItemInt(hwndDlg,26,min[2],FALSE);
			SetDlgItemInt(hwndDlg,27,min[3],FALSE);
			SetDlgItemInt(hwndDlg,28,min[4],FALSE);
			//sprintf(workstring,"%f",dspan);
			//SetDlgItemText(hwndDlg,28,workstring);
			//SetDlgItemInt(hwndDlg,29,emin,FALSE);
			//sprintf(workstring,"%f",espan);
			//SetDlgItemText(hwndDlg,29,workstring);
			SetDlgItemInt(hwndDlg,30,min[6],FALSE);
			SetDlgItemInt(hwndDlg,31,min[7],FALSE);
			SetDlgItemInt(hwndDlg,32,min[8],FALSE);
			SetDlgItemInt(hwndDlg,33,min[9],FALSE);
			SetDlgItemInt(hwndDlg,34,min[10],FALSE);
			SetDlgItemInt(hwndDlg,35,min[11],FALSE);
			SetDlgItemInt(hwndDlg,36,min[12],FALSE);
			SetDlgItemInt(hwndDlg,37,min[13],FALSE);
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
					slip = GetDlgItemInt(hwndDlg,3,NULL,FALSE);
					min[1] = GetDlgItemInt(hwndDlg,25,NULL,FALSE);
					min[2] = GetDlgItemInt(hwndDlg,26,NULL,FALSE);
					min[3] = GetDlgItemInt(hwndDlg,27,NULL,FALSE);
					min[4] = GetDlgItemInt(hwndDlg,28,NULL,FALSE);
					//emin = GetDlgItemInt(hwndDlg,29,NULL,FALSE);
					min[6] = GetDlgItemInt(hwndDlg,30,NULL,FALSE);
					min[7] = GetDlgItemInt(hwndDlg,31,NULL,FALSE);
					min[8] = GetDlgItemInt(hwndDlg,32,NULL,FALSE);
					min[9] = GetDlgItemInt(hwndDlg,33,NULL,FALSE);
					min[10] = GetDlgItemInt(hwndDlg,34,NULL,FALSE);
					min[11] = GetDlgItemInt(hwndDlg,35,NULL,FALSE);
					min[12] = GetDlgItemInt(hwndDlg,36,NULL,FALSE);
					min[13] = GetDlgItemInt(hwndDlg,37,NULL,FALSE);
                    EndDialog(hwndDlg, wParam); 
                    return TRUE; 
				break;
				case 5:
					acol = IsDlgButtonChecked(hwndDlg,5);
				break;
				case 6:
					bcol = IsDlgButtonChecked(hwndDlg,6);
				break;
				case 7:
					ccol = IsDlgButtonChecked(hwndDlg,7);
				break;
				case 8:
					dcol = IsDlgButtonChecked(hwndDlg,8);
				break;
				case 9:
					ecol = IsDlgButtonChecked(hwndDlg,9);
				break;
				case 10:
					fcol = IsDlgButtonChecked(hwndDlg,10);
				break;
				case 11:
					gcol = IsDlgButtonChecked(hwndDlg,11);
				break;
				case 12:
					hcol = IsDlgButtonChecked(hwndDlg,12);
				break;
				case 13:
					icol = IsDlgButtonChecked(hwndDlg,13);
				break;
				case 14:
					jcol = IsDlgButtonChecked(hwndDlg,14);
				break;
				case 15:
					kcol = IsDlgButtonChecked(hwndDlg,15);
				break;
				case 16:
					lcol = IsDlgButtonChecked(hwndDlg,16);
				break;
				case 17:
					mcol = IsDlgButtonChecked(hwndDlg,17);
				break;
            }
		break;
    } 
    return FALSE; 
} 

int scrollx(int amount)
{
	if (amount < 0)
		if (xspan + ((float)amount / xscale) < 0)
			return 1;
	if (amount > 0)
		if (((l - (xspan + ((double)amount / xscale)))   *xscale) <= xwidth)
			return 1;
	xspan = xspan + ((float)amount / xscale);
	return 0;
}

int scrollleft(int amount)
{
	if (((l - (xspan + ((double)amount / xscale)))   *xscale)     > xwidth)
		xspan = xspan + ((double)amount / xscale);
	return 0;
}

int scrollright(int amount)
{
	if (xspan - ((double)amount / xscale) >= 0)
		xspan = xspan - ((double)amount / xscale);
	return 0;
}

int scaledown(int amount)
{
	if (xscale / (double)amount>(double)xwidth / l)
		xscale = xscale / (double)amount;
	else
		xscale = (double)xwidth / l;
	return 0;
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	char text[100];
	switch(msg)
	{
	case WM_LBUTTONDOWN:
		mousex = GET_X_LPARAM(lParam);
		mousey = GET_Y_LPARAM(lParam);
		break;
	case WM_MOUSEMOVE:
		if (LOWORD(wParam) == MK_LBUTTON)
		{
			deltax = mousex - GET_X_LPARAM(lParam);
			mousex = GET_X_LPARAM(lParam);
			deltay = mousey - GET_Y_LPARAM(lParam);
			mousey = GET_Y_LPARAM(lParam);
			scrollx(deltax);
			glTranslatef(0.0, deltay, 0.0);
			InvalidateRect(hwnd, NULL, TRUE);
		}
		break;
	case WM_MOUSEWHEEL:
		switch (LOWORD(wParam))
		{
		case MK_CONTROL | MK_SHIFT:
			break;
		case MK_CONTROL:
			if (GET_WHEEL_DELTA_WPARAM(wParam)>0)
				xscale = xscale * 2.0;
			else
				if (xscale / 2.0>(double)xwidth / l)
					xscale = xscale / 2.0;
				else
					xscale = (double)xwidth / l;
			break;
		case MK_SHIFT:
			if (GET_WHEEL_DELTA_WPARAM(wParam)>0)
			{
				if (xspan - (1.0 / xscale) >= 0)
					xspan = xspan - (1.0 / xscale);
			}
			else
			{
				if (((l - xspan)   *xscale)     > xwidth)
					xspan = xspan + (1.0 / xscale);
			}
			break;
		default:
			if (GET_WHEEL_DELTA_WPARAM(wParam)>0)
				glTranslatef(0.0, 10.0, 0.0);
			else
				glTranslatef(0.0, -10.0, 0.0);
			break;
		}
		InvalidateRect(hwnd, NULL, TRUE);
		break;
	case WM_KEYDOWN:
			if (GetKeyState(VK_CONTROL)<0)
				switch (wParam)
				{
				case VK_UP:
					xscale = xscale * 2.0;
					//dscale = dscale / 2;
					//glScalef(2.0,1.0,1.0);
					break;
				case VK_DOWN:
					if (xscale/2.0>(double)xwidth/l)
						xscale = xscale/2.0;
					else
						xscale = (double)xwidth/l;
					//xscale = xscale * 0.5;
					//dscale = dscale * 2;
					//glScalef(0.5,1.0,1.0);
					break;
				}
			else
				switch (wParam)
				{
				case VK_RIGHT:
					//glTranslatef(-100.0,0.0,0.0);
					/*if (xspan-(1.0/xscale)>=0)
						xspan=xspan-(1.0/xscale);*/

						//if (xspan+(-1.0/xscale)>=0)
						//xspan=xspan+(-1.0/xscale);
					scrollx(-1);
					//scrollright(1);
					//xpos=xpos-(1.0*dscale);
					InvalidateRect(hwnd,NULL,TRUE);
					break;
				case VK_LEFT:
					//glTranslatef(100.0,0.0,0.0);
					/*if ((   (l-xspan)   *xscale)     > xwidth)
						xspan=xspan+(1.0/xscale);*/
					//scrollleft(1);
					scrollx(1);
					//xpos=xpos+(1.0*dscale);
					InvalidateRect(hwnd,NULL,TRUE);
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
			InvalidateRect(hwnd,NULL,TRUE);	
		break;
	case WM_CREATE:
			hDC = GetDC(hwnd);
			PIXELFORMATDESCRIPTOR pfd = {sizeof(PIXELFORMATDESCRIPTOR),1,PFD_DRAW_TO_WINDOW|PFD_SUPPORT_OPENGL|PFD_DOUBLEBUFFER,PFD_TYPE_RGBA,8,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,PFD_MAIN_PLANE,0,0,0,0 };
			SetPixelFormat(hDC, ChoosePixelFormat(hDC, &pfd), &pfd);
			hRC = wglCreateContext(hDC);
			wglMakeCurrent(hDC, hRC);
			SendMessage(hwnd, WM_COMMAND,3,0);
		break;
	case WM_SIZE:
			xwidth = LOWORD(lParam);
			yheight = HIWORD(lParam);
			glViewport(0, 0, LOWORD(lParam), HIWORD(lParam));
			glLoadIdentity();
			gluOrtho2D(0.0,(GLdouble)LOWORD(lParam),0.0,(GLdouble)HIWORD(lParam));
			screenwidth = LOWORD(lParam);
			InvalidateRect(hwnd,NULL,TRUE);
		break;
	case WM_PAINT:
		{
			glClear(GL_COLOR_BUFFER_BIT);
			glColor3f(1.0,1.0,1.0);
			glPushMatrix();
			glScalef(xscale,yscale,1.0);
			//if (open == 1)
			//	{
					glBegin(GL_LINE_STRIP);
					for(int i=0;i<xwidth/xscale;i++)
					{
						glVertex2i(i,m[5][i+(int)xspan]);
						if (i+xspan>l)
							break;
					}
					glEnd();
			
					/*int x,fx, num=1;
					glColor3f(1.0,1.0,1.0);
					while (num<13)
					{
						glBegin(GL_LINE_STRIP);
						x = xpos;
						fx = 0;
						while(x < length)
						{
							glVertex2i(fx,(massive[num][x]-amin));
							x++;
							fx++;
							
						}
						glEnd();
						num++;
					}*/
					/*glColor3f(0.0,0.5,1.0);
					glCallList(alist);
					glColor3f(1.0,0.0,0.0);
					glCallList(blist);
					glColor3f(0.0,1.0,0.0);
					glCallList(clist);
					glColor3f(0.0,0.0,1.0);
					glCallList(dlist);
					glColor3f(1.0,1.0,0.0);
					glCallList(elist);
					glColor3f(0.0,1.0,1.0);
					glCallList(flist);
					glColor3f(1.0,0.0,1.0);
					glCallList(glist);
					glColor3f(0.5,0.0,1.0);
					glCallList(hlist);
					glColor3f(1.0,0.0,0.5);
					glCallList(ilist);
					glColor3f(0.5,1.0,0.0);
					glCallList(jlist);
					glColor3f(0.0,0.5,0.1);
					glCallList(klist);
					glColor3f(1.0,0.0,0.5);
					glCallList(llist);
					glColor3f(0.0,1.0,0.5);
					glCallList(mlist);*/
			//	}
			glPopMatrix();
			glFlush();
			SwapBuffers(hDC);
			ValidateRect(hwnd,NULL);
		}
		break;
	case WM_CONTEXTMENU:
			TrackPopupMenu(menu,TPM_LEFTALIGN,GET_X_LPARAM(lParam),GET_Y_LPARAM(lParam),0,hwnd,NULL);
		break;
	case WM_COMMAND:
			switch(LOWORD(wParam))
			{
				case 0:
					DestroyWindow(hwnd);
				break;
				case 1:
					DialogBox(GetModuleHandle(NULL),"MainDialog",hwnd,(DLGPROC)DialogFunc);
					InvalidateRect(hwnd,NULL,TRUE);
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
					ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST;
					GetOpenFileName(&ofn);
					developmassive(ofn.lpstrFile);
					//developmassive2(ofn.lpstrFile);
					open = 1;
					InvalidateRect(hwnd,NULL,TRUE);
				}
				break;
			}
		break;
	case WM_DESTROY:
			wglMakeCurrent(hDC,NULL);
			wglDeleteContext(hRC);
			PostQuitMessage(0);
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
	WNDCLASS wc = {0,WindowProc,0,0,hInstance,LoadIcon(hInstance, "Window"),LoadCursor(NULL, IDC_ARROW),CreateSolidBrush(RGB(0,0,0)),"Menu","MainWindowClass"};
	RegisterClass(&wc);
	menu = GetSubMenu(LoadMenu(hInstance,"Menu"),0);
	hwnd = CreateWindow("MainWindowClass","Window",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,CW_USEDEFAULT,CW_USEDEFAULT,NULL,NULL,hInstance,NULL);
//	developmassive();
	ShowWindow(hwnd,SW_SHOWDEFAULT);
	while(GetMessage(&Msg, NULL, 0, 0) > 0)
	{
		TranslateMessage(&Msg);
		DispatchMessage(&Msg);
	}
	return 0;
}
