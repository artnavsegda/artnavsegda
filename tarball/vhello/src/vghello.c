/* vghello.c generated by valac 0.30.0, the Vala compiler
 * generated from vghello.vala, do not modify */


#include <glib.h>
#include <glib-object.h>
#include <stdlib.h>
#include <string.h>
#include <gtk/gtk.h>

#define _g_object_unref0(var) ((var == NULL) ? NULL : (var = (g_object_unref (var), NULL)))



gint _vala_main (gchar** args, int args_length1);
static void _gtk_main_quit_gtk_widget_destroy (GtkWidget* _sender, gpointer self);


static void _gtk_main_quit_gtk_widget_destroy (GtkWidget* _sender, gpointer self) {
	gtk_main_quit ();
}


gint _vala_main (gchar** args, int args_length1) {
	gint result = 0;
	GtkWindow* window = NULL;
	GtkWindow* _tmp0_ = NULL;
	GtkLabel* label = NULL;
	GtkLabel* _tmp1_ = NULL;
	gtk_init (&args_length1, &args);
	_tmp0_ = (GtkWindow*) gtk_window_new (GTK_WINDOW_TOPLEVEL);
	g_object_ref_sink (_tmp0_);
	window = _tmp0_;
	gtk_window_set_title (window, "Hello, World!");
	gtk_container_set_border_width ((GtkContainer*) window, (guint) 10);
	g_object_set (window, "window-position", GTK_WIN_POS_CENTER, NULL);
	gtk_window_set_default_size (window, 350, 70);
	g_signal_connect ((GtkWidget*) window, "destroy", (GCallback) _gtk_main_quit_gtk_widget_destroy, NULL);
	_tmp1_ = (GtkLabel*) gtk_label_new ("Hello, World!");
	g_object_ref_sink (_tmp1_);
	label = _tmp1_;
	gtk_container_add ((GtkContainer*) window, (GtkWidget*) label);
	gtk_widget_show_all ((GtkWidget*) window);
	gtk_main ();
	result = 0;
	_g_object_unref0 (label);
	_g_object_unref0 (window);
	return result;
}


int main (int argc, char ** argv) {
#if !GLIB_CHECK_VERSION (2,35,0)
	g_type_init ();
#endif
	return _vala_main (argv, argc);
}



