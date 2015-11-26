#include <stdio.h>
#include <stdlib.h>

#define MAXLENGTH 900000


int main(int argc, char *argv[])
{
	int m[20][901000];
	int max[20];
	int min[20];
	int l = 0;
	FILE *sora;
	if (argc == 1)
	{
		printf("please set file\n");
		exit(1);
	}
	sora = fopen(argv[1],"r");
	if (sora == NULL)
	{
		printf("fucking error\n");
		exit(1);
	}
	while (fscanf(sora,"%d %d %d %d %d %d %d %d %d %d %d %d %d\n", &m[1][l],&m[2][l],&m[3][l],&m[4][l],&m[5][l],&m[6][l],&m[7][l],&m[8][l],&m[9][l],&m[10][l],&m[11][l],&m[12][l],&m[13][l])!=EOF)
	{
		for(int i=1;i<=13;i++)
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
	for(int i=1;i<=13;i++)
		printf("%d: min %d, max %d, span %d\n",i,min[i],max[i],max[i]-min[i]);
	return 0;
}

