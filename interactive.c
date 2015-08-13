#include <stdio.h>

main()
{
	char buf[100];
	while (scanf("%s", buf)!=EOF)
		puts(buf);
	return 0;
}
