#include <stdio.h>
#include <string.h>

int main()
{
  char mystring[] = "something someone someday";
  char *tokarr[10];
  int i = 0;
  tokarr[i] = mystring;

  while ((tokarr[i] = strtok(tokarr[i], " ")) != NULL)
    tokarr[++i] = NULL;
}
