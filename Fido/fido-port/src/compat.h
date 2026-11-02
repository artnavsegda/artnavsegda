// Слой совместимости: заменяет Borland C++ / DOS (conio.h, dos.h, alloc.h,
// прямой доступ к видеопамяти B800:0000) для современных POSIX-систем.
// Реализация - в term.cpp.
//
// Весь игровой текст внутри программы хранится в CP866, как в оригинале:
// исходники лежат в UTF-8, а Makefile перекодирует их в CP866 перед
// компиляцией. В Unicode текст переводится только при выводе в терминал.
#pragma once

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cerrno>
#include <cstdint>
#include <ctime>

typedef uint16_t      word;   // в Borland C int и unsigned 16-битные
typedef unsigned char byte;
typedef unsigned long dword;

// Модификаторы указателей реального режима - больше не нужны.
#define far
#define near
#define huge

// ---- Видеопамять ----------------------------------------------------------
// 8 страниц по 4096 байт, как в цветном текстовом режиме VGA.
// Каждая ячейка - пара байт: символ (CP866) и атрибут цвета.
#define VRAM_PAGE 0x1000
extern uint8_t vram[8 * VRAM_PAGE];

// ---- conio.h -------------------------------------------------------------
int  getch(void);
int  kbhit(void);
void gotoxy(int x, int y);           // 1-based, как в Borland
void clrscr(void);
void textattr(int attr);
int  putch(int c);
int  gettext(int left, int top, int right, int bottom, void *dest);
int  puttext(int left, int top, int right, int bottom, void *src);

// ---- прочее из DOS/Borland ----------------------------------------------
unsigned long coreleft(void);
char *ultoa(unsigned long value, char *buf, int radix);

// ---- функции терминала ---------------------------------------------------
void term_init(void);
void term_done(void);
void term_present(void);             // вывести изменения видеопамяти на экран
void term_sleep_ms(unsigned ms);     // пауза (с выводом экрана)
void term_cursor(int visible);
void term_setpage(int page);         // аналог int 10h, AH=05h
void term_set_datadir(const char *argv0);
FILE *fopen_ci(const char *name, const char *mode); // поиск без учёта регистра
// Перевод строки CP866 -> UTF-8 (для лог-файла). Возвращает dst.
char *cp866_to_utf8(const char *src, char *dst, size_t dstsize);

// ---- генератор случайных чисел Borland C -------------------------------
// Игра рассчитана на 15-битный rand() (RAND_MAX = 0x7FFF): от этого зависят
// формулы вероятностей (например, износ железа в wear()).
int  bc_rand(void);
void bc_srand(unsigned seed);
int  bc_random(int n);

// Макросы объявлены после всех системных заголовков, чтобы не задеть
// их объявления (например, POSIX long random(void)).
#undef RAND_MAX
#define RAND_MAX 0x7FFF
#define rand()    bc_rand()
#define srand(s)  bc_srand(s)
#define random(n) bc_random(n)
