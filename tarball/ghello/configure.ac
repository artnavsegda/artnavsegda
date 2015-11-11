AC_INIT([ArtNavsegda], [1.0], [artnavsegda@gmail.com],[artnavsegda],[https://github.com/artnavsegda])
AM_INIT_AUTOMAKE
AC_MSG_NOTICE([Art Navsegda])
AC_PROG_CC
#AC_CHECK_LIB([gtk-3],[gtk_application_new])
#CFLAGS="-I/usr/include/gtk-3.0 -I/usr/include/glib-2.0 -I/usr/lib/x86_64-linux-gnu/glib-2.0/include"
PKG_CHECK_MODULES(GTK, [gtk+-3.0])
CFLAGS=$GTK_CFLAGS
LIBS=$GTK_LIBS
AC_CONFIG_HEADERS([config.h])
AC_CONFIG_FILES([Makefile src/Makefile])
AC_OUTPUT
