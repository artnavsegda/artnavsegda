#include <stdio.h>
#include <windows.h>
#include <windowsx.h>

HMENU menu;

#define MAXLENGTH 900000
int column = 5;
int acol = BST_CHECKED,bcol = BST_CHECKED,ccol = BST_CHECKED,dcol = BST_CHECKED,ecol = BST_CHECKED,
fcol = BST_CHECKED,gcol = BST_CHECKED,hcol = BST_CHECKED,icol = BST_CHECKED,jcol = BST_CHECKED,
kcol = BST_CHECKED,lcol = BST_CHECKED,mcol = BST_CHECKED;
int amin=0,bmin=0,cmin=0,dmin=0,emin=0,fomin=0,gmin=0,hmin=0,imin=0,jmin=0,kmin=0,lmin=0,mmin=0;
int amax=0,bmax=0,cmax=0,dmax=0,emax=0,fomax=0,gmax=0,hmax=0,imax=0,jmax=0,kmax=0,lmax=0,mmax=0;
int massive[20][901000];
int open = 0;
int numbers = 1;
int startsector = 0;
int length = 0;
int slip = 1;
int vslip = 1;
float aspan=1.0,bspan=1.0,cspan=1.0,dspan=1.0,espan=1.0,fspan=1.0,gspan=1.0,hspan=1.0,ispan=1.0,jspan=1.0,kspan=1.0,lspan=1.0,mspan=1.0;

int developmassive(char filename[])
{
	int count = 0;
	int a, b, c, d, e, f, g, h, i, j, k, l, m;
	int am, bm, cm, dm, em, fm, gm, hm, im, jm, km, lm, mm;
	FILE *sora;
//	sora = fopen("./chota.txt","r");
	sora = fopen(filename,"r");
	if (sora == NULL)
	{
		printf("fucking error");
		exit(0);
	}
	am=0;bm=0;cm=0;dm=0;em=0;fm=0;gm=0;hm=0;im=0;jm=0;km=0;lm=0;mm=0;
	while (fscanf(sora,"%i %i %i %i %i %i %i %i %i %i %i %i %i\n", &a,&b,&c,&d,&e,&f,&g,&h,&i,&j,&k,&l,&m)!=EOF)
	{
		if (amin==0) amin=a; if (bmin==0) bmin=b; if (cmin==0) cmin=c; if (dmin==0) dmin=d; if (emin==0) emin=e; if (fomin==0) fomin=f; if (gmin==0) gmin=g; if (hmin==0) hmin=h; if (imin==0) imin=i; if (jmin==0) jmin=e;
		if (kmin==0) kmin=k; if (lmin==0) lmin=l; if (mmin==0) mmin=m;
		
		if (amax==0) amax=a; if (bmax==0) bmax=b; if (cmax==0) cmax=c; if (dmax==0) dmax=d;	if (emax==0) emax=e; if (fomax==0) fomax=f; if (gmax==0) gmax=g; if (hmax==0) hmax=h;	if (imax==0) imax=i; if (jmax==0) jmax=j;
		if (kmax==0) kmax=k; if (lmax==0) lmax=b; if (mmax==0) mmax=m;
		
		if (a<amin)	amin=a;	if (b<bmin)	bmin=b; if (c<cmin)	cmin=c;	if (d<dmin)	dmin=d; if (e<emin)	emin=e;	if (f<fomin)	fomin=f; if (g<gmin)	gmin=g;	if (h<hmin)	hmin=h; if (i<imin)	imin=i;	if (j<jmin)	jmin=j; 
		if (k<kmin)	kmin=k;	if (l<lmin)	lmin=l; if (m<mmin)	mmin=a;
			
		if (a>amax)	amax=a;	if (b>bmax)	bmax=b; if (c>cmax)	cmax=c;	if (d>dmax)	dmax=b; if (e>emax)	emax=e;	if (f>fomax)	fomax=f; if (g>gmax)	gmax=g;	if (h>hmax)	hmax=b; if (i>imax)	imax=i;	if (j>jmax)	jmax=j;
		if (k>kmax)	kmax=a;	if (l>bmax)	lmax=b; if (m>bmax)	mmax=b; 
		
		count++;
		am += a;bm += b;cm += c;dm += d;em += e;fm += f;gm += g;hm += h;im += i;jm += j;km += k;lm += l;mm += m;
		
		if (count == numbers)
		{
			massive[1][length] = am;
			massive[2][length] = bm;
			massive[3][length] = cm;
			massive[4][length] = dm;
			massive[5][length] = em;
			massive[6][length] = fm;
			massive[7][length] = gm;
			massive[8][length] = hm;
			massive[9][length] = im;
			massive[10][length] = jm;
			massive[11][length] = km;
			massive[12][length] = lm;
			massive[13][length] = mm;
			count = 0;
			am=0;bm=0;cm=0;dm=0;em=0;fm=0;gm=0;hm=0;im=0;jm=0;km=0;lm=0;mm=0;
			length++;
		}
		if (length > MAXLENGTH)
			break;
	}
	if ((amax-amin)/1000 > 0) aspan = (amax-amin);
	if ((bmax-bmin)/1000 > 0) bspan = (bmax-bmin);
	if ((cmax-cmin)/1000 > 0) cspan = (cmax-cmin);
	if ((dmax-dmin)/1000 > 0) dspan = (dmax-dmin);
	if ((emax-emin)/1000 > 0) espan = (emax-emin);
	if ((fomax-fomin)/1000 > 0) fspan = (fomax-fomin);
	if ((gmax-gmin)/1000 > 0) gspan = (gmax-gmin);
	if ((hmax-hmin)/1000 > 0) hspan = (hmax-hmin);
	if ((imax-imin)/1000 > 0) ispan = (imax-imin);
	if ((jmax-jmin)/1000 > 0) jspan = (jmax-jmin);
	if ((kmax-kmin)/1000 > 0) kspan = (kmax-kmin);
	if ((lmax-lmin)/1000 > 0) lspan = (lmax-lmin);
	if ((mmax-mmin)/1000 > 0) mspan = (mmax-mmin);
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
			SetDlgItemInt(hwndDlg,25,amin,FALSE);
			//SendDlgItemMessage(hwndDlg,3,WM_SETTEXT,(WPARAM)0,(LPARAM)"0");
			//sprintf(workstring,"%f",aspan);
			//SetDlgItemText(hwndDlg,25,workstring);
			SetDlgItemInt(hwndDlg,26,bmin,FALSE);
			SetDlgItemInt(hwndDlg,27,cmin,FALSE);
			SetDlgItemInt(hwndDlg,28,dmin,FALSE);
			//sprintf(workstring,"%f",dspan);
			//SetDlgItemText(hwndDlg,28,workstring);
			//SetDlgItemInt(hwndDlg,29,emin,FALSE);
			//sprintf(workstring,"%f",espan);
			//SetDlgItemText(hwndDlg,29,workstring);
			SetDlgItemInt(hwndDlg,30,fomin,FALSE);
			SetDlgItemInt(hwndDlg,31,gmin,FALSE);
			SetDlgItemInt(hwndDlg,32,hmin,FALSE);
			SetDlgItemInt(hwndDlg,33,imin,FALSE);
			SetDlgItemInt(hwndDlg,34,jmin,FALSE);
			SetDlgItemInt(hwndDlg,35,kmin,FALSE);
			SetDlgItemInt(hwndDlg,36,lmin,FALSE);
			SetDlgItemInt(hwndDlg,37,mmin,FALSE);
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
					amin = GetDlgItemInt(hwndDlg,25,NULL,FALSE);
					bmin = GetDlgItemInt(hwndDlg,26,NULL,FALSE);
					cmin = GetDlgItemInt(hwndDlg,27,NULL,FALSE);
					dmin = GetDlgItemInt(hwndDlg,28,NULL,FALSE);
					//emin = GetDlgItemInt(hwndDlg,29,NULL,FALSE);
					fomin = GetDlgItemInt(hwndDlg,30,NULL,FALSE);
					gmin = GetDlgItemInt(hwndDlg,31,NULL,FALSE);
					hmin = GetDlgItemInt(hwndDlg,32,NULL,FALSE);
					imin = GetDlgItemInt(hwndDlg,33,NULL,FALSE);
					jmin = GetDlgItemInt(hwndDlg,34,NULL,FALSE);
					kmin = GetDlgItemInt(hwndDlg,35,NULL,FALSE);
					lmin = GetDlgItemInt(hwndDlg,36,NULL,FALSE);
					mmin = GetDlgItemInt(hwndDlg,37,NULL,FALSE);
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

LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	char text[100];
	switch(msg)
	{
		case WM_KEYDOWN:
			switch (wParam)
			{
				case VK_RIGHT:
					startsector = startsector + (100*slip);
					InvalidateRect(hwnd,NULL,TRUE);
				break;
				case VK_LEFT:
					if (startsector > (100*slip))
						startsector = startsector - (100*slip);
					else
						startsector = 0;
					InvalidateRect(hwnd,NULL,TRUE);				
				break;
				case VK_UP:
					vslip++;
					InvalidateRect(hwnd,NULL,TRUE);	
				break;
				case VK_DOWN:
					if (vslip > 1)
						vslip--;
					else
						vslip = 1;
					InvalidateRect(hwnd,NULL,TRUE);	
				break;
				case VK_INSERT:
					slip++;
					InvalidateRect(hwnd,NULL,TRUE);	
				break;
				case VK_DELETE:
					if (slip > 1)
						slip--;
					else
						slip = 1;
					InvalidateRect(hwnd,NULL,TRUE);	
				break;
				default:
				break;
			}
		break;
		case WM_CREATE:
			SendMessage(hwnd, WM_COMMAND,3,0);
		break;
		case WM_PAINT:
		{
			int x = startsector;
			PAINTSTRUCT ps;
			BeginPaint(hwnd,&ps);
			SetBkMode(ps.hdc, TRANSPARENT); 
			//SelectObject(ps.hdc,CreateSolidBrush(RGB(255,255,255)));
			SetTextColor(ps.hdc,RGB(0,255,0));
			sprintf(text,"%d samples read",length);
			TextOut(ps.hdc,100,100,text,strlen(text));
			sprintf(text,"%d sample start",startsector);
			TextOut(ps.hdc,100,120,text,strlen(text));
			if (open == 1)
				{
					while(x < length)
					{
						if (acol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[1][x]-amin)/vslip,RGB(255,0,0));
						if (bcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[2][x]-bmin)/vslip,RGB(0,255,0));
						if (ccol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[3][x]-cmin)/vslip,RGB(0,0,255));
						if (dcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[4][x]-dmin)/vslip,RGB(255,255,0));
						if (ecol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[5][x]+500)/vslip,RGB(0,255,255));
						if (fcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[6][x]-fomin)/vslip,RGB(255,0,255));
						if (gcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[7][x]-gmin)/vslip,RGB(128,0,255));
						if (hcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[8][x]-hmin)/vslip,RGB(255,0,128));
						if (icol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[9][x]-imin)/vslip,RGB(128,255,0));
						if (jcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[10][x]-2400)/vslip,RGB(0,128,255));
						if (kcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[11][x]-kmin)/vslip,RGB(255,0,128));
						if (lcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[12][x]-lmin)/vslip,RGB(0,255,128));
						if (mcol==BST_CHECKED)
							SetPixel(ps.hdc,(x-startsector)/slip,(massive[13][x]-mmin)/vslip,RGB(0,128,255));
						//SetPixel(ps.hdc,x,massive[column][x],RGB(0,0,0));
						if ((x-startsector)/slip==2000)
							break;
						x = x + slip;
					}
				}
			EndPaint(hwnd,&ps);
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
					open = 1;
					InvalidateRect(hwnd,NULL,TRUE);
				}
				break;
			}
		break;
		case WM_DESTROY:
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
