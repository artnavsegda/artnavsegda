/* vglade.c generated by valac 0.30.0, the Vala compiler
 * generated from vglade.vala, do not modify */


#include <glib.h>
#include <glib-object.h>
#include <gtk/gtk.h>
#include <stdlib.h>
#include <string.h>
#include <glib/gstdio.h>
#include <stdio.h>


#define TYPE_TEXT_FILE_VIEWER (text_file_viewer_get_type ())
#define TEXT_FILE_VIEWER(obj) (G_TYPE_CHECK_INSTANCE_CAST ((obj), TYPE_TEXT_FILE_VIEWER, TextFileViewer))
#define TEXT_FILE_VIEWER_CLASS(klass) (G_TYPE_CHECK_CLASS_CAST ((klass), TYPE_TEXT_FILE_VIEWER, TextFileViewerClass))
#define IS_TEXT_FILE_VIEWER(obj) (G_TYPE_CHECK_INSTANCE_TYPE ((obj), TYPE_TEXT_FILE_VIEWER))
#define IS_TEXT_FILE_VIEWER_CLASS(klass) (G_TYPE_CHECK_CLASS_TYPE ((klass), TYPE_TEXT_FILE_VIEWER))
#define TEXT_FILE_VIEWER_GET_CLASS(obj) (G_TYPE_INSTANCE_GET_CLASS ((obj), TYPE_TEXT_FILE_VIEWER, TextFileViewerClass))

typedef struct _TextFileViewer TextFileViewer;
typedef struct _TextFileViewerClass TextFileViewerClass;
typedef struct _TextFileViewerPrivate TextFileViewerPrivate;
#define _g_object_unref0(var) ((var == NULL) ? NULL : (var = (g_object_unref (var), NULL)))
#define _g_free0(var) (var = (g_free (var), NULL))
#define _g_error_free0(var) ((var == NULL) ? NULL : (var = (g_error_free (var), NULL)))

struct _TextFileViewer {
	GtkWindow parent_instance;
	TextFileViewerPrivate * priv;
};

struct _TextFileViewerClass {
	GtkWindowClass parent_class;
};

struct _TextFileViewerPrivate {
	GtkTextView* text_view;
};


static gpointer text_file_viewer_parent_class = NULL;

GType text_file_viewer_get_type (void) G_GNUC_CONST;
#define TEXT_FILE_VIEWER_GET_PRIVATE(o) (G_TYPE_INSTANCE_GET_PRIVATE ((o), TYPE_TEXT_FILE_VIEWER, TextFileViewerPrivate))
enum  {
	TEXT_FILE_VIEWER_DUMMY_PROPERTY
};
void text_file_viewer_open_file (GtkFileChooserButton* source, const gchar* filename, TextFileViewer* self);
TextFileViewer* text_file_viewer_new (void);
TextFileViewer* text_file_viewer_construct (GType object_type);
gint text_file_viewer_main (gchar** args, int args_length1);
static void text_file_viewer_finalize (GObject* obj);


void text_file_viewer_open_file (GtkFileChooserButton* source, const gchar* filename, TextFileViewer* self) {
	GError * _inner_error_ = NULL;
	g_return_if_fail (self != NULL);
	g_return_if_fail (source != NULL);
	g_return_if_fail (filename != NULL);
	{
		gchar* text = NULL;
		GtkFileChooserButton* _tmp0_ = NULL;
		gchar* _tmp1_ = NULL;
		gchar* _tmp2_ = NULL;
		gchar* _tmp3_ = NULL;
		GtkTextView* _tmp4_ = NULL;
		GtkTextBuffer* _tmp5_ = NULL;
		GtkTextBuffer* _tmp6_ = NULL;
		_tmp0_ = source;
		_tmp1_ = gtk_file_chooser_get_filename ((GtkFileChooser*) _tmp0_);
		_tmp2_ = _tmp1_;
		g_file_get_contents (_tmp2_, &_tmp3_, NULL, &_inner_error_);
		_g_free0 (text);
		text = _tmp3_;
		_g_free0 (_tmp2_);
		if (G_UNLIKELY (_inner_error_ != NULL)) {
			_g_free0 (text);
			goto __catch0_g_error;
		}
		_tmp4_ = self->priv->text_view;
		_tmp5_ = gtk_text_view_get_buffer (_tmp4_);
		_tmp6_ = _tmp5_;
		g_object_set (_tmp6_, "text", text, NULL);
		_g_free0 (text);
	}
	goto __finally0;
	__catch0_g_error:
	{
		GError* e = NULL;
		FILE* _tmp7_ = NULL;
		GError* _tmp8_ = NULL;
		const gchar* _tmp9_ = NULL;
		e = _inner_error_;
		_inner_error_ = NULL;
		_tmp7_ = stderr;
		_tmp8_ = e;
		_tmp9_ = _tmp8_->message;
		fprintf (_tmp7_, "Error: %s\n", _tmp9_);
		_g_error_free0 (e);
	}
	__finally0:
	if (G_UNLIKELY (_inner_error_ != NULL)) {
		g_critical ("file %s: line %d: uncaught error: %s (%s, %d)", __FILE__, __LINE__, _inner_error_->message, g_quark_to_string (_inner_error_->domain), _inner_error_->code);
		g_clear_error (&_inner_error_);
		return;
	}
}


static gpointer _g_object_ref0 (gpointer self) {
	return self ? g_object_ref (self) : NULL;
}


TextFileViewer* text_file_viewer_construct (GType object_type) {
	TextFileViewer * self = NULL;
	GError * _inner_error_ = NULL;
	self = (TextFileViewer*) g_object_new (object_type, NULL);
	{
		GtkBuilder* builder = NULL;
		GtkBuilder* _tmp0_ = NULL;
		GtkWindow* window = NULL;
		GObject* _tmp1_ = NULL;
		GtkWindow* _tmp2_ = NULL;
		GObject* _tmp3_ = NULL;
		GtkTextView* _tmp4_ = NULL;
		GtkWindow* _tmp5_ = NULL;
		_tmp0_ = gtk_builder_new ();
		builder = _tmp0_;
		gtk_builder_add_from_file (builder, "vgtext2.ui", &_inner_error_);
		if (G_UNLIKELY (_inner_error_ != NULL)) {
			_g_object_unref0 (builder);
			goto __catch1_g_error;
		}
		gtk_builder_connect_signals (builder, self);
		_tmp1_ = gtk_builder_get_object (builder, "applicationwindow1");
		_tmp2_ = _g_object_ref0 (G_TYPE_CHECK_INSTANCE_TYPE (_tmp1_, gtk_window_get_type ()) ? ((GtkWindow*) _tmp1_) : NULL);
		window = _tmp2_;
		_tmp3_ = gtk_builder_get_object (builder, "textview1");
		_tmp4_ = _g_object_ref0 (G_TYPE_CHECK_INSTANCE_TYPE (_tmp3_, gtk_text_view_get_type ()) ? ((GtkTextView*) _tmp3_) : NULL);
		_g_object_unref0 (self->priv->text_view);
		self->priv->text_view = _tmp4_;
		_tmp5_ = window;
		gtk_widget_show_all ((GtkWidget*) _tmp5_);
		_g_object_unref0 (window);
		_g_object_unref0 (builder);
	}
	goto __finally1;
	__catch1_g_error:
	{
		GError* e = NULL;
		FILE* _tmp6_ = NULL;
		GError* _tmp7_ = NULL;
		const gchar* _tmp8_ = NULL;
		e = _inner_error_;
		_inner_error_ = NULL;
		_tmp6_ = stderr;
		_tmp7_ = e;
		_tmp8_ = _tmp7_->message;
		fprintf (_tmp6_, "Could not load UI: %s\n", _tmp8_);
		_g_error_free0 (e);
	}
	__finally1:
	if (G_UNLIKELY (_inner_error_ != NULL)) {
		g_critical ("file %s: line %d: uncaught error: %s (%s, %d)", __FILE__, __LINE__, _inner_error_->message, g_quark_to_string (_inner_error_->domain), _inner_error_->code);
		g_clear_error (&_inner_error_);
		return NULL;
	}
	return self;
}


TextFileViewer* text_file_viewer_new (void) {
	return text_file_viewer_construct (TYPE_TEXT_FILE_VIEWER);
}


gint text_file_viewer_main (gchar** args, int args_length1) {
	gint result = 0;
	TextFileViewer* _tmp0_ = NULL;
	TextFileViewer* _tmp1_ = NULL;
	gtk_init (&args_length1, &args);
	_tmp0_ = text_file_viewer_new ();
	g_object_ref_sink (_tmp0_);
	_tmp1_ = _tmp0_;
	_g_object_unref0 (_tmp1_);
	gtk_main ();
	result = 0;
	return result;
}


int main (int argc, char ** argv) {
#if !GLIB_CHECK_VERSION (2,35,0)
	g_type_init ();
#endif
	return text_file_viewer_main (argv, argc);
}


static void text_file_viewer_class_init (TextFileViewerClass * klass) {
	text_file_viewer_parent_class = g_type_class_peek_parent (klass);
	g_type_class_add_private (klass, sizeof (TextFileViewerPrivate));
	G_OBJECT_CLASS (klass)->finalize = text_file_viewer_finalize;
}


static void text_file_viewer_instance_init (TextFileViewer * self) {
	self->priv = TEXT_FILE_VIEWER_GET_PRIVATE (self);
}


static void text_file_viewer_finalize (GObject* obj) {
	TextFileViewer * self;
	self = G_TYPE_CHECK_INSTANCE_CAST (obj, TYPE_TEXT_FILE_VIEWER, TextFileViewer);
	_g_object_unref0 (self->priv->text_view);
	G_OBJECT_CLASS (text_file_viewer_parent_class)->finalize (obj);
}


GType text_file_viewer_get_type (void) {
	static volatile gsize text_file_viewer_type_id__volatile = 0;
	if (g_once_init_enter (&text_file_viewer_type_id__volatile)) {
		static const GTypeInfo g_define_type_info = { sizeof (TextFileViewerClass), (GBaseInitFunc) NULL, (GBaseFinalizeFunc) NULL, (GClassInitFunc) text_file_viewer_class_init, (GClassFinalizeFunc) NULL, NULL, sizeof (TextFileViewer), 0, (GInstanceInitFunc) text_file_viewer_instance_init, NULL };
		GType text_file_viewer_type_id;
		text_file_viewer_type_id = g_type_register_static (gtk_window_get_type (), "TextFileViewer", &g_define_type_info, 0);
		g_once_init_leave (&text_file_viewer_type_id__volatile, text_file_viewer_type_id);
	}
	return text_file_viewer_type_id__volatile;
}



