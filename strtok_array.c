#include <stdio.h>
#include <string.h>

int arrlength(char **array);

int main()
{
  char mystring[] = "something someone someday";
  char *tokarr[10];
  int i = 0;
  tokarr[i] = mystring;

  while ((tokarr[i] = strtok(tokarr[i], " ")) != NULL)
    tokarr[++i] = NULL;

  printf("number of tokens %d\n", arrlength(tokarr));
}

int arrlength(char **array)
{
  int length = 0;
  while (array[length] != NULL)
    length++;
  return length;
}
