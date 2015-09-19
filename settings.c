#include <windows.h>

main()
{
	char data[10];
	GetPrivateProfileString("main","setting","default",data,sizeof(data),".\\config.ini");
	return 0;
}

