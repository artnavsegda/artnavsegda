// Терминальный бэкенд: эмуляция текстового режима VGA 80x25 и клавиатуры
// DOS поверх POSIX-терминала (termios + ANSI escape-последовательности).
// Файл намеренно содержит только ASCII: его не нужно перекодировать.

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cstdint>
#include <cctype>
#include <climits>
#include <string>
#include <deque>
#include <termios.h>
#include <unistd.h>
#include <poll.h>
#include <signal.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <time.h>
#ifdef __APPLE__
#include <mach-o/dyld.h>
#endif

#include "compat.h"

alignas(2) uint8_t vram[8 * VRAM_PAGE];

// ---------------------------------------------------------------------------
// CP866 -> Unicode. Коды 0..31 отображаются глифами CP437, как на VGA.
static const uint16_t cp866_uni[256] = {
    0x0020,0x263A,0x263B,0x2665,0x2666,0x2663,0x2660,0x2022,0x25D8,0x25CB,0x25D9,0x2642,0x2640,0x266A,0x266B,0x263C,
    0x25BA,0x25C4,0x2195,0x203C,0x00B6,0x00A7,0x25AC,0x21A8,0x2191,0x2193,0x2192,0x2190,0x221F,0x2194,0x25B2,0x25BC,
    0x0020,0x0021,0x0022,0x0023,0x0024,0x0025,0x0026,0x0027,0x0028,0x0029,0x002A,0x002B,0x002C,0x002D,0x002E,0x002F,
    0x0030,0x0031,0x0032,0x0033,0x0034,0x0035,0x0036,0x0037,0x0038,0x0039,0x003A,0x003B,0x003C,0x003D,0x003E,0x003F,
    0x0040,0x0041,0x0042,0x0043,0x0044,0x0045,0x0046,0x0047,0x0048,0x0049,0x004A,0x004B,0x004C,0x004D,0x004E,0x004F,
    0x0050,0x0051,0x0052,0x0053,0x0054,0x0055,0x0056,0x0057,0x0058,0x0059,0x005A,0x005B,0x005C,0x005D,0x005E,0x005F,
    0x0060,0x0061,0x0062,0x0063,0x0064,0x0065,0x0066,0x0067,0x0068,0x0069,0x006A,0x006B,0x006C,0x006D,0x006E,0x006F,
    0x0070,0x0071,0x0072,0x0073,0x0074,0x0075,0x0076,0x0077,0x0078,0x0079,0x007A,0x007B,0x007C,0x007D,0x007E,0x2302,
    0x0410,0x0411,0x0412,0x0413,0x0414,0x0415,0x0416,0x0417,0x0418,0x0419,0x041A,0x041B,0x041C,0x041D,0x041E,0x041F,
    0x0420,0x0421,0x0422,0x0423,0x0424,0x0425,0x0426,0x0427,0x0428,0x0429,0x042A,0x042B,0x042C,0x042D,0x042E,0x042F,
    0x0430,0x0431,0x0432,0x0433,0x0434,0x0435,0x0436,0x0437,0x0438,0x0439,0x043A,0x043B,0x043C,0x043D,0x043E,0x043F,
    0x2591,0x2592,0x2593,0x2502,0x2524,0x2561,0x2562,0x2556,0x2555,0x2563,0x2551,0x2557,0x255D,0x255C,0x255B,0x2510,
    0x2514,0x2534,0x252C,0x251C,0x2500,0x253C,0x255E,0x255F,0x255A,0x2554,0x2569,0x2566,0x2560,0x2550,0x256C,0x2567,
    0x2568,0x2564,0x2565,0x2559,0x2558,0x2552,0x2553,0x256B,0x256A,0x2518,0x250C,0x2588,0x2584,0x258C,0x2590,0x2580,
    0x0440,0x0441,0x0442,0x0443,0x0444,0x0445,0x0446,0x0447,0x0448,0x0449,0x044A,0x044B,0x044C,0x044D,0x044E,0x044F,
    0x0401,0x0451,0x0404,0x0454,0x0407,0x0457,0x040E,0x045E,0x00B0,0x2219,0x00B7,0x221A,0x2116,0x00A4,0x25A0,0x0020,
};

static int uni_to_cp866(uint32_t cp)
{
    if (cp >= 0x20 && cp < 0x7F) return (int)cp;
    for (int i = 0x80; i < 0x100; i++)
        if (cp866_uni[i] == cp) return i;
    if (cp == 0x00A0) return 0xFF;
    return -1;
}

static void put_utf8(std::string &out, uint32_t cp)
{
    if (cp < 0x80) out += (char)cp;
    else if (cp < 0x800) { out += (char)(0xC0 | (cp >> 6)); out += (char)(0x80 | (cp & 0x3F)); }
    else { out += (char)(0xE0 | (cp >> 12)); out += (char)(0x80 | ((cp >> 6) & 0x3F)); out += (char)(0x80 | (cp & 0x3F)); }
}

char *cp866_to_utf8(const char *src, char *dst, size_t dstsize)
{
    std::string s;
    for (const unsigned char *p = (const unsigned char *)src; *p; p++) {
        if (*p == '\n' || *p == '\r' || *p == '\t') s += (char)*p;
        else put_utf8(s, cp866_uni[*p]);
    }
    if (dstsize) { strncpy(dst, s.c_str(), dstsize - 1); dst[dstsize - 1] = 0; }
    return dst;
}

// ---------------------------------------------------------------------------
// Палитра VGA: индексы xterm-256 (по умолчанию) и точные RGB (truecolor).
static const int vga256[16] = {16, 19, 34, 37, 124, 127, 130, 145, 59, 63, 83, 87, 203, 207, 227, 231};
static const uint8_t vgargb[16][3] = {
    {0,0,0},{0,0,170},{0,170,0},{0,170,170},{170,0,0},{170,0,170},{170,85,0},{170,170,170},
    {85,85,85},{85,85,255},{85,255,85},{85,255,255},{255,85,85},{255,85,255},{255,255,85},{255,255,255}};

static bool active = false, truecolor = false;
static struct termios orig_tio;
static int cur_x = 0, cur_y = 0, cur_attr = 0x07, cur_visible = 0, cur_page = 0;
static uint16_t shown[25][80];
static bool shown_valid = false, small_notice = false;
static int term_rows = 25, term_cols = 80, off_r = 0, off_c = 0;
static volatile sig_atomic_t winch = 1;
static std::deque<int> keyq;

static void out_all(const std::string &s)
{
    const char *p = s.data();
    size_t n = s.size();
    while (n) {
        ssize_t w = ::write(STDOUT_FILENO, p, n);
        if (w <= 0) break;
        p += w; n -= (size_t)w;
    }
}

static void update_size()
{
    struct winsize ws;
    if (ioctl(STDOUT_FILENO, TIOCGWINSZ, &ws) == 0 && ws.ws_row && ws.ws_col) {
        term_rows = ws.ws_row; term_cols = ws.ws_col;
    }
    off_r = term_rows > 25 ? (term_rows - 25) / 2 : 0;
    off_c = term_cols > 80 ? (term_cols - 80) / 2 : 0;
}

static void sgr(std::string &o, int attr)
{
    int fg = attr & 15, bg = (attr >> 4) & 7;
    char b[80];
    if (truecolor)
        snprintf(b, sizeof b, "\x1b[0;%s38;2;%d;%d;%d;48;2;%d;%d;%dm", (attr & 0x80) ? "5;" : "",
                 vgargb[fg][0], vgargb[fg][1], vgargb[fg][2], vgargb[bg][0], vgargb[bg][1], vgargb[bg][2]);
    else
        snprintf(b, sizeof b, "\x1b[0;%s38;5;%d;48;5;%dm", (attr & 0x80) ? "5;" : "", vga256[fg], vga256[bg]);
    o += b;
}

static void moveto(std::string &o, int r, int c)
{
    char b[32];
    snprintf(b, sizeof b, "\x1b[%d;%dH", r + off_r + 1, c + off_c + 1);
    o += b;
}

void term_present(void)
{
    if (!active) return;
    std::string o;
    if (winch) {
        winch = 0;
        update_size();
        shown_valid = false;
    }
    if (term_rows < 25 || term_cols < 80) {
        if (!small_notice) {
            o = "\x1b[0m\x1b[2J\x1b[H\x1b[?25l";
            o += "FIDO: \xd0\xbd\xd1\x83\xd0\xb6\xd0\xbd\xd0\xbe \xd0\xbe\xd0\xba\xd0\xbd\xd0\xbe 80x25 "; // "нужно окно 80x25"
            char b[64]; snprintf(b, sizeof b, "(now %dx%d)", term_cols, term_rows); o += b;
            out_all(o);
            small_notice = true;
        }
        shown_valid = false;
        return;
    }
    small_notice = false;
    if (!shown_valid) o += "\x1b[0m\x1b[2J";
    const uint8_t *pg = vram + cur_page * VRAM_PAGE;
    int last_attr = -1, pr = -1, pc = -1;
    for (int r = 0; r < 25; r++)
        for (int c = 0; c < 80; c++) {
            uint8_t ch = pg[(r * 80 + c) * 2], at = pg[(r * 80 + c) * 2 + 1];
            uint16_t cell = (uint16_t)(ch | (at << 8));
            if (shown_valid && shown[r][c] == cell) continue;
            shown[r][c] = cell;
            if (r != pr || c != pc) moveto(o, r, c);
            if (at != last_attr) { sgr(o, at); last_attr = at; }
            put_utf8(o, cp866_uni[ch]);
            pr = r; pc = c + 1;
        }
    shown_valid = true;
    if (cur_visible && cur_page == 0) {
        moveto(o, cur_y, cur_x);
        o += "\x1b[?25h";
    } else
        o += "\x1b[?25l";
    out_all(o);
}

// ---------------------------------------------------------------------------
// Клавиатура: escape-последовательности -> коды getch() в стиле DOS
// (расширенные клавиши дают 0, затем скан-код).

static int read_byte(int timeout_ms)
{
    struct pollfd p = {STDIN_FILENO, POLLIN, 0};
    int r = poll(&p, 1, timeout_ms);
    if (r <= 0) return -1;
    unsigned char b;
    if (::read(STDIN_FILENO, &b, 1) != 1) return -1;
    return b;
}

static void push_ext(int scan) { keyq.push_back(0); keyq.push_back(scan); }

static void decode(int b)
{
    if (b == 0x1B) {
        int n = read_byte(40);
        if (n < 0) { keyq.push_back(27); return; }
        if (n == '[' || n == 'O') {
            std::string params;
            int f;
            for (;;) {
                f = read_byte(40);
                if (f < 0) return;
                if (f >= 0x40 && f <= 0x7E) break;
                params += (char)f;
            }
            int num = atoi(params.c_str());
            switch (f) {
            case 'A': push_ext(72); return;   // вверх
            case 'B': push_ext(80); return;   // вниз
            case 'C': push_ext(77); return;   // вправо
            case 'D': push_ext(75); return;   // влево
            case 'H': push_ext(71); return;   // Home
            case 'F': push_ext(79); return;   // End
            case '~':
                switch (num) {
                case 1: case 7: push_ext(71); return;
                case 4: case 8: push_ext(79); return;
                case 2: push_ext(82); return;  // Ins
                case 3: push_ext(83); return;  // Del
                case 5: push_ext(73); return;  // PgUp
                case 6: push_ext(81); return;  // PgDn
                }
            }
            return; // прочие (F1..F12 и т.п.) игнорируются
        }
        keyq.push_back(27);   // Esc, за которым сразу следует другая клавиша
        decode(n);
        return;
    }
    if (b == '\r' || b == '\n') { keyq.push_back(13); return; }
    if (b == 0x7F) { keyq.push_back(8); return; }
    if (b >= 0x80) {
        uint32_t cp; int more;
        if ((b & 0xE0) == 0xC0) { cp = b & 0x1F; more = 1; }
        else if ((b & 0xF0) == 0xE0) { cp = b & 0x0F; more = 2; }
        else if ((b & 0xF8) == 0xF0) { cp = b & 0x07; more = 3; }
        else return;
        while (more--) {
            int c = read_byte(40);
            if (c < 0 || (c & 0xC0) != 0x80) return;
            cp = (cp << 6) | (c & 0x3F);
        }
        int k = uni_to_cp866(cp);
        if (k >= 0) keyq.push_back(k);
        return;
    }
    keyq.push_back(b);
}

int getch(void)
{
    while (keyq.empty()) {
        term_present();
        int b = read_byte(100);
        if (b >= 0) decode(b);
    }
    int k = keyq.front();
    keyq.pop_front();
    return k;
}

int kbhit(void)
{
    term_present();
    if (keyq.empty()) {
        int b = read_byte(0);
        if (b >= 0) decode(b);
    }
    return !keyq.empty();
}

// ---------------------------------------------------------------------------
// conio

static inline uint8_t *cell(int x, int y) { return vram + (y * 80 + x) * 2; }

void gotoxy(int x, int y)
{
    if (x >= 1 && x <= 80 && y >= 1 && y <= 25) { cur_x = x - 1; cur_y = y - 1; }
}

void textattr(int a) { cur_attr = a & 0xFF; }

void clrscr(void)
{
    for (int i = 0; i < 80 * 25; i++) { vram[i * 2] = ' '; vram[i * 2 + 1] = (uint8_t)cur_attr; }
    cur_x = cur_y = 0;
}

int putch(int c)
{
    c &= 0xFF;
    switch (c) {
    case '\b': if (cur_x > 0) cur_x--; break;
    case '\r': cur_x = 0; break;
    case '\n': if (cur_y < 24) cur_y++; break;
    case '\a': break;
    default:
        cell(cur_x, cur_y)[0] = (uint8_t)c;
        cell(cur_x, cur_y)[1] = (uint8_t)cur_attr;
        if (++cur_x >= 80) { cur_x = 0; if (cur_y < 24) cur_y++; }
    }
    return c;
}

// gettext/puttext: прямоугольник в координатах conio (с 1), 2 байта на ячейку.
// В отличие от Borland, выходящие за экран ячейки не отменяют операцию,
// а просто пропускаются (у окон есть тень, которая может вылезать за край).
int gettext(int l, int t, int r, int b, void *dest)
{
    uint8_t *d = (uint8_t *)dest;
    for (int y = t; y <= b; y++)
        for (int x = l; x <= r; x++, d += 2)
            if (x >= 1 && x <= 80 && y >= 1 && y <= 25) memcpy(d, cell(x - 1, y - 1), 2);
    return 1;
}

int puttext(int l, int t, int r, int b, void *src)
{
    const uint8_t *s = (const uint8_t *)src;
    for (int y = t; y <= b; y++)
        for (int x = l; x <= r; x++, s += 2)
            if (x >= 1 && x <= 80 && y >= 1 && y <= 25) memcpy(cell(x - 1, y - 1), s, 2);
    return 1;
}

void term_cursor(int v) { cur_visible = v; }
void term_setpage(int p) { if (p >= 0 && p < 8) { cur_page = p; shown_valid = false; } }

unsigned long coreleft(void) { return 0x60000UL; }

char *ultoa(unsigned long v, char *buf, int radix)
{
    char tmp[72];
    int i = 0;
    if (radix < 2 || radix > 36) radix = 10;
    do { int d = (int)(v % radix); tmp[i++] = (char)(d < 10 ? '0' + d : 'a' + d - 10); v /= radix; } while (v);
    for (int j = 0; j < i; j++) buf[j] = tmp[i - 1 - j];
    buf[i] = 0;
    return buf;
}

void term_sleep_ms(unsigned ms)
{
    static int fast = -1;   // FIDO_FAST=1 - без пауз (для автотестов)
    if (fast < 0) fast = getenv("FIDO_FAST") != NULL;
    term_present();
    if (fast) return;
    struct timespec ts = {(time_t)(ms / 1000), (long)(ms % 1000) * 1000000L};
    while (nanosleep(&ts, &ts) == -1 && errno == EINTR) {}
}

// ---------------------------------------------------------------------------
// Borland C rand(): LCG с множителем 22695477, 15 бит результата.
static uint32_t bc_seed = 1;
int bc_rand(void) { bc_seed = bc_seed * 22695477u + 1u; return (int)((bc_seed >> 16) & 0x7FFF); }
void bc_srand(unsigned s) { bc_seed = s; }
int bc_random(int n) { return (int)(((long long)bc_rand() * n) / 0x8000); }

// ---------------------------------------------------------------------------
// Инициализация и восстановление терминала

static void on_fatal(int sig)
{
    term_done();
    signal(sig, SIG_DFL);
    raise(sig);
}

static void on_winch(int) { winch = 1; }

static void set_raw()
{
    struct termios t = orig_tio;
    t.c_iflag &= ~(BRKINT | ICRNL | INLCR | IGNCR | INPCK | ISTRIP | IXON);
    t.c_lflag &= ~(ECHO | ICANON | IEXTEN);   // ISIG оставлен: Ctrl-C завершает игру
    t.c_cc[VMIN] = 1;
    t.c_cc[VTIME] = 0;
    tcsetattr(STDIN_FILENO, TCSAFLUSH, &t);
}

static void on_tstp(int)
{
    term_done();
    signal(SIGTSTP, SIG_DFL);
    raise(SIGTSTP);
}

static void on_cont(int)
{
    signal(SIGTSTP, on_tstp);
    term_init();
}

void term_init(void)
{
    if (active) return;
    if (!isatty(STDIN_FILENO) || !isatty(STDOUT_FILENO)) {
        fprintf(stderr, "fido: run me in a terminal\n");
        exit(1);
    }
    static bool first = true;
    if (first) {
        tcgetattr(STDIN_FILENO, &orig_tio);
        atexit(term_done);
        signal(SIGINT, on_fatal); signal(SIGTERM, on_fatal); signal(SIGHUP, on_fatal);
        signal(SIGSEGV, on_fatal); signal(SIGBUS, on_fatal); signal(SIGABRT, on_fatal);
        signal(SIGWINCH, on_winch);
        signal(SIGTSTP, on_tstp); signal(SIGCONT, on_cont);
        const char *ct = getenv("COLORTERM");
        truecolor = ct && (strstr(ct, "truecolor") || strstr(ct, "24bit"));
        if (getenv("FIDO_256COLOR")) truecolor = false;
        first = false;
    }
    set_raw();
    active = true;
    update_size();
    std::string o = "\x1b[?1049h\x1b]0;FIDO v1.8\x07\x1b[?25l";
    if (term_rows < 25 || term_cols < 80) o += "\x1b[8;25;80t";  // попросить окно 80x25
    out_all(o);
    if (term_rows < 25 || term_cols < 80) term_sleep_ms(150);
    winch = 1;
    shown_valid = false;
}

void term_done(void)
{
    if (!active) return;
    active = false;
    out_all("\x1b[0m\x1b[?25h\x1b[2J\x1b[?1049l");
    tcsetattr(STDIN_FILENO, TCSAFLUSH, &orig_tio);
}

// ---------------------------------------------------------------------------
// Файлы данных

static bool file_exists(const std::string &p)
{
    struct stat st;
    return stat(p.c_str(), &st) == 0;
}

static std::string with_case(const char *name, int mode)  // 0 как есть, 1 ВЕРХНИЙ, 2 нижний
{
    std::string s(name);
    if (mode == 0) return s;
    size_t slash = s.rfind('/');
    for (size_t i = (slash == std::string::npos ? 0 : slash + 1); i < s.size(); i++)
        s[i] = (char)(mode == 1 ? toupper((unsigned char)s[i]) : tolower((unsigned char)s[i]));
    return s;
}

FILE *fopen_ci(const char *name, const char *mode)
{
    for (int m = 0; m < 3; m++) {
        FILE *f = fopen(with_case(name, m).c_str(), mode);
        if (f) return f;
    }
    return NULL;
}

static bool has_readme(const std::string &dir)
{
    for (int m = 0; m < 3; m++)
        if (file_exists(dir + "/" + with_case("readme.fid", m))) return true;
    return false;
}

void term_set_datadir(const char *argv0)
{
    const char *env = getenv("FIDO_DATA");
    if (env && *env) { if (chdir(env) == 0) return; }
    char path[PATH_MAX] = {0};
#ifdef __APPLE__
    uint32_t sz = sizeof path;
    if (_NSGetExecutablePath(path, &sz) != 0) path[0] = 0;
#else
    ssize_t n = readlink("/proc/self/exe", path, sizeof path - 1);
    if (n > 0) path[n] = 0; else path[0] = 0;
#endif
    if (!path[0] && argv0) strncpy(path, argv0, sizeof path - 1);
    char real[PATH_MAX];
    if (path[0] && realpath(path, real)) strcpy(path, real);
    std::string dir(path);
    size_t slash = dir.rfind('/');
    dir = slash == std::string::npos ? "." : dir.substr(0, slash);
    const std::string cands[] = {dir + "/data", dir, dir + "/../data"};
    for (const auto &c : cands)
        if (has_readme(c)) { if (chdir(c.c_str()) == 0) return; }
    // иначе остаёмся в текущем каталоге
}
