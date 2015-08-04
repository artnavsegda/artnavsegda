#include <windows.h>
#include <windowsx.h>

HMENU menu;
BYTE bBytes[] =
{
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0xff,
  0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0xff,
  0x00, 0xff, 0xff, 0x00, 0x00, 0xff, 0xff, 0x00,
  0x00, 0xff, 0xff, 0x00, 0x00, 0xff, 0xff, 0x00,
  0x00, 0xff, 0xff, 0x00, 0x00, 0xff, 0xff, 0x00,
  0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0xff,
  0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
};

LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	HDC hdc,dcLogo;
	PAINTSTRUCT ps;
	HBITMAP bmLogo;
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
			PostQuitMessage(0);
		break;
		case WM_PAINT:
		{
			hdc = BeginPaint(hwnd, &ps);
			bmLogo = CreateBitmap(64,9,1,1,&bBytes);
			dcLogo = CreateCompatibleDC(hdc);
			SelectObject(dcLogo,bmLogo);
			BitBlt(hdc,100,100,100,100,dcLogo,0,0,SRCCOPY);
			DeleteDC(dcLogo);
			DeleteObject(bmLogo);
			EndPaint(hwnd, &ps);
		}
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
	hwnd = CreateWindow("MainWindowClass","Window",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,CW_USEDEFAULT,CW_USEDEFAULT,NULL,NULL,hInstance,NULL);
	ShowWindow(hwnd,SW_SHOWDEFAULT);
	while(GetMessage(&Msg, NULL, 0, 0) > 0)
	{
		TranslateMessage(&Msg);
		DispatchMessage(&Msg);
	}
	return 0;
}
