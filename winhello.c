#include <windows.h>
#include <windowsx.h>
#include <stdio.h>

HMENU menu;
char configfile[] = ".\\winhello.ini";
char swidth[10] = "300";
char sheight[10] = "300";

LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	switch(msg)
	{
		case WM_CONTEXTMENU:
			TrackPopupMenu(menu,TPM_LEFTALIGN,GET_X_LPARAM(lParam),GET_Y_LPARAM(lParam),0,hwnd,NULL);
		break;
		case WM_COMMAND:
			switch(LOWORD(wParam))
			{
				case 0:
					DestroyWindow(hwnd);
				break;
			}
		break;
		case WM_DESTROY:
			WritePrivateProfileString("window","height",sheight,configfile);
			WritePrivateProfileString("window","width",swidth,configfile);
			PostQuitMessage(0);
		break;
		case WM_SIZE:
			snprintf(swidth,10,"%d",LOWORD(lParam));
			snprintf(sheight,10,"%d",HIWORD(lParam));
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
	WNDCLASS wc = {0,WindowProc,0,0,hInstance,LoadIcon(hInstance, "Window"),LoadCursor(NULL, IDC_ARROW),(HBRUSH)(COLOR_WINDOW+1),"Menu","MainWindowClass"};
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
