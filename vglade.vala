using Gtk;

public class TextFileViewer : Window {

[CCode (instance_pos = -1)]
public void on_open_clicked (ToolButton source) {
    source.label = "Thank you!";
        var file_chooser = new FileChooserDialog ("Open File", this,
                                      FileChooserAction.OPEN,
                                      Stock.CANCEL, ResponseType.CANCEL,
                                      Stock.OPEN, ResponseType.ACCEPT);
        if (file_chooser.run () == ResponseType.ACCEPT) {
            //open_file (file_chooser.get_filename ());
        }
        file_chooser.destroy ();
}

public static int main (string[] args) {
    Gtk.init (ref args);

    try {
        // If the UI contains custom widgets, their types must've been instantiated once
        // Type type = typeof(Foo.BarEntry);
        // assert(type != 0);
        var builder = new Builder ();
        builder.add_from_file ("vgtext.ui");
	var object = new TextFileViewer();
        builder.connect_signals (object);
        var window = builder.get_object ("window1") as Window;
        window.show_all ();
        Gtk.main ();
    } catch (Error e) {
        stderr.printf ("Could not load UI: %s\n", e.message);
        return 1;
    }

    return 0;
}

}

