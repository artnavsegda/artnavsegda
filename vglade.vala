using Gtk;

public class TextFileViewer:Window
{
	private TextView text_view;
	private FileChooserDialog file_chooser;

	[CCode(instance_pos = -1)] public void on_open_clicked(ToolButton source)
	{
		var file_chooser = new FileChooserDialog("Open File", this, FileChooserAction.OPEN, "_Cancel", ResponseType.CANCEL, "_Open", ResponseType.ACCEPT);
		if (file_chooser.run() == ResponseType.ACCEPT)
		{
			open_file(file_chooser.get_filename());
		}
		file_chooser.destroy();
	}

	private void open_file(string filename)
	{
		try
		{
			string text;
			FileUtils.get_contents(filename, out text);
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
			builder.add_from_file("vgtext.ui");
			builder.connect_signals(this);
			var window = builder.get_object("window1") as Window;
			this.text_view = builder.get_object("textview1") as TextView;
			this.file_chooser = builder.get_object("filechooserdialog1") as FileChooserDialog;
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
