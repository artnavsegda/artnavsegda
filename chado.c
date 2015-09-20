#include <stdio.h>
#include <string.h>

main()
{
	char newdata[1000] = "";
	char data[] = "youareontheroadtohell";
	char *sdata = data;
	char *subst = strstr(data, "road");
	//printf("%d\n",subst-sdata);
	strncat(newdata,data,subst-sdata);
	strncat(newdata," road ",6);
	strcat(newdata,subst+4);
	puts(newdata);
	return 0;
}

