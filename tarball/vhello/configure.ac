AC_INIT([ArtNavsegda], [1.0], [artnavsegda@gmail.com],[artnavsegda],[https://github.com/artnavsegda])
AM_INIT_AUTOMAKE
AC_MSG_NOTICE([Art Navsegda])
AC_PROG_CC
AM_PROG_VALAC
#AC_CHECK_LIB([X11],[XCreateWindow])
#PKG_CHECK_MODULES(XHELLO, [x11])
PKG_CHECK_MODULES(GTK, [gtk+-3.0])
CFLAGS="$GTK_CFLAGS -rdynamic"
LIBS=$GTK_LIBS
AC_CONFIG_HEADERS([config.h])
AC_CONFIG_FILES([Makefile src/Makefile])
AC_OUTPUT
