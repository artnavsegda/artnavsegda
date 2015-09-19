#include <windows.h>

main()
{
	char filename[] = ".\\config.ini";
	char data[10];
	GetPrivateProfileString("main","setting","default",data,sizeof(data),filename);
	WritePrivateProfileString("main","setting","changed",filename);
	GetPrivateProfileInt("main","number",10,filename);
	return 0;
}

