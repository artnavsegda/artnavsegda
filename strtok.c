#include <stdio.h>
#include <string.h>

int main()
{
  char mystring[] = "something someone someday";
  char *token = mystring;

  while ((token = strtok(token, " ")) != NULL)
  {
    puts(token);
    token = NULL;
  }
}
