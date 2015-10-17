#include <windows.h>
#include <winuser.h>
#include <windowsx.h>
#include <stdio.h>
#include "winhello.h"

char configfile[] = ".\\winhello.ini";
char swidth[10] = "300";
char sheight[10] = "300";


  LRESULT DecodeGesture(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam){
    // Create a structure to populate and retrieve the extra message info.
    GESTUREINFO gi;  
    
    ZeroMemory(&gi, sizeof(GESTUREINFO));
    
    gi.cbSize = sizeof(GESTUREINFO);

    BOOL bResult  = GetGestureInfo((HGESTUREINFO)lParam, &gi);
    BOOL bHandled = FALSE;

    if (bResult){
        // now interpret the gesture
        switch (gi.dwID){
           case GID_ZOOM:
               // Code for zooming goes here     
               bHandled = TRUE;
               break;
           case GID_PAN:
               // Code for panning goes here
            	MessageBoxW(hWnd, L"Weehee!", L"pan recieved", MB_OK);
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
    }else{
        DWORD dwErr = GetLastError();
        if (dwErr > 0){
            //MessageBoxW(hWnd, L"Error!", L"Could not retrieve a GESTUREINFO structure.", MB_OK);
        }
    }
    if (bHandled){
        return 0;
    }else{
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
  }

LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	PAINTSTRUCT ps;
	HDC hdc;
	switch(msg)
	{
		case WM_GESTURENOTIFY:
			GESTURECONFIG gc = {0,GC_ALLGESTURES,0};
			SetGestureConfig(hwnd,0,1,&gc,sizeof(GESTURECONFIG));
			return DefWindowProc(hwnd, WM_GESTURENOTIFY, wParam, lParam);
		break;
		case WM_GESTURE:
			return DecodeGesture(hwnd, msg, wParam, lParam);
		break;
		case WM_CONTEXTMENU:
			TrackPopupMenu(GetSubMenu(GetMenu(hwnd),0),TPM_LEFTALIGN,GET_X_LPARAM(lParam),GET_Y_LPARAM(lParam),0,hwnd,NULL);
		break;
		case WM_COMMAND:
			switch(LOWORD(wParam))
			{
				case ID_EXIT:
					DestroyWindow(hwnd);
				break;
				case 12:
					CheckMenuItem(GetMenu(hwnd),12,MF_BYCOMMAND|MF_CHECKED);
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
		case WM_PAINT:
			hdc = BeginPaint(hwnd,&ps);
			EndPaint(hwnd, &ps);
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
	hwnd = CreateWindow("MainWindowClass","Window",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,GetPrivateProfileInt("window","width",300,configfile),GetPrivateProfileInt("window","height",300,configfile),NULL,NULL,hInstance,NULL);
	ShowWindow(hwnd,SW_SHOWDEFAULT);
	while(GetMessage(&Msg, NULL, 0, 0) > 0)
	{
		TranslateMessage(&Msg);
		DispatchMessage(&Msg);
	}
	return 0;
}
