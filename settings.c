#include <windows.h>
#include <stdio.h>

main()
{
	char filename[] = ".\\config.ini";
	char data[10];
	WritePrivateProfileString("main","setting","changed",filename);
	GetPrivateProfileString("main","setting","default",data,sizeof(data),filename);
	puts(data);
	WritePrivateProfileString("main","number","11",filename);
	printf("%d\n",GetPrivateProfileInt("main","number",10,filename));
	return 0;
}

