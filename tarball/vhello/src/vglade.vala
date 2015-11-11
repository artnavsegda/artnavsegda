using Gtk;

public class TextFileViewer:Window
{
	private TextView text_view;

	[CCode(instance_pos = -1)]public void open_file(FileChooserButton source, string filename)
	{
		try
		{
			string text;
			FileUtils.get_contents(source.get_filename(), out text);
			this.text_view.buffer.text = text;
		} catch(Error e)
		{
			stderr.printf("Error: %s\n", e.message);
		}
	}

	public TextFileViewer()
	{
		try
		{
			var builder = new Builder();
			builder.add_from_file("vgtext2.ui");
			builder.connect_signals(this);
			var window = builder.get_object("applicationwindow1") as Window;
			this.text_view = builder.get_object("textview1") as TextView;
			window.show_all();
		} catch(Error e)
		{
			stderr.printf("Could not load UI: %s\n", e.message);
		}
	}

	public static int main(string[] args)
	{
		Gtk.init(ref args);
		new TextFileViewer();
		Gtk.main();
		return 0;
	}

}
