// Canudos: A Última Resistência — janela nativa (WinForms + WebView2) que roda o jogo de jogo\index.html
// Compilado pelo build.ps1 com o csc do .NET Framework (sintaxe C# 5).
//
// O jogo é servido como um site local (https://canudos.jogo/), então o progresso salvo
// fica numa origem fixa, em %LOCALAPPDATA%\CanudosTD. A página fala com a janela por
// mensagens: {"t":"sair"} fecha o jogo e {"t":"telaCheia"} alterna tela cheia/janela.
using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: System.Reflection.AssemblyTitle("Canudos: A Ultima Resistencia")]
[assembly: System.Reflection.AssemblyDescription("Tower defense na Guerra de Canudos")]
[assembly: System.Reflection.AssemblyCompany("Bilola Games")]
[assembly: System.Reflection.AssemblyProduct("Canudos: A Ultima Resistencia")]
[assembly: System.Reflection.AssemblyVersion("0.5.0.0")]
[assembly: System.Reflection.AssemblyFileVersion("0.5.0.0")]

namespace CanudosTD
{
    static class NativeMethods
    {
        public static readonly int WM_MOSTRAR = RegisterWindowMessage("CANUDOS_TD_MOSTRAR");
        [DllImport("user32.dll")] public static extern int RegisterWindowMessage(string msg);
        [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l);
        [DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);
        [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            // nitidez em telas com escala (125%, 150%...): sem isso o Windows estica a janela e borra os pixels
            try { NativeMethods.SetProcessDpiAwarenessContext((IntPtr)(-4)); } catch { }
            bool criado;
            using (Mutex m = new Mutex(true, "CanudosTD.InstanciaUnica", out criado))
            {
                if (!criado)
                {
                    NativeMethods.PostMessage((IntPtr)0xffff, NativeMethods.WM_MOSTRAR, IntPtr.Zero, IntPtr.Zero);
                    return;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new Janela());
            }
        }
    }

    // Lembra se o jogo estava em tela cheia e onde ficava a janela.
    class Config
    {
        public bool TelaCheia = true, Maximizada = false;
        public int X = -1, Y = -1, W = 1280, H = 760;
        static string Arquivo { get { return Path.Combine(Pasta, "config.ini"); } }
        public static string Pasta { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CanudosTD"); } }

        public static Config Ler()
        {
            Config c = new Config();
            try
            {
                foreach (string linha in File.ReadAllLines(Arquivo))
                {
                    int i = linha.IndexOf('=');
                    if (i < 0) continue;
                    string k = linha.Substring(0, i).Trim(), v = linha.Substring(i + 1).Trim();
                    int n;
                    if (k == "telaCheia") c.TelaCheia = v == "1";
                    else if (k == "maximizada") c.Maximizada = v == "1";
                    else if (int.TryParse(v, out n))
                    {
                        if (k == "x") c.X = n; else if (k == "y") c.Y = n; else if (k == "w") c.W = n; else if (k == "h") c.H = n;
                    }
                }
            }
            catch { }
            return c;
        }

        public void Salvar()
        {
            try
            {
                Directory.CreateDirectory(Pasta);
                File.WriteAllText(Arquivo,
                    "telaCheia=" + (TelaCheia ? "1" : "0") + "\r\nmaximizada=" + (Maximizada ? "1" : "0") +
                    "\r\nx=" + X + "\r\ny=" + Y + "\r\nw=" + W + "\r\nh=" + H + "\r\n");
            }
            catch { }
        }
    }

    class Janela : Form
    {
        readonly string pastaApp = AppDomain.CurrentDomain.BaseDirectory;
        readonly Config cfg;
        WebView2 web;
        bool telaCheia;
        Rectangle limitesJanela;

        public Janela()
        {
            cfg = Config.Ler();
            Text = "Canudos: A Última Resistência";
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
            BackColor = Color.FromArgb(18, 14, 20);
            MinimumSize = new Size(800, 480);
            StartPosition = FormStartPosition.Manual;
            Rectangle b = new Rectangle(cfg.X, cfg.Y, cfg.W, cfg.H);
            if (cfg.X == -1 || !NaTela(b))
            {
                Rectangle wa = Screen.PrimaryScreen.WorkingArea;
                int w = Math.Min(cfg.W, wa.Width), h = Math.Min(cfg.H, wa.Height);
                b = new Rectangle(wa.X + (wa.Width - w) / 2, wa.Y + (wa.Height - h) / 2, w, h);
            }
            Bounds = b;
            limitesJanela = b;

            web = new WebView2();
            web.Dock = DockStyle.Fill;
            web.DefaultBackgroundColor = Color.FromArgb(18, 14, 20);
            web.CreationProperties = new CoreWebView2CreationProperties();
            web.CreationProperties.UserDataFolder = Path.Combine(Config.Pasta, "WebView2");
            Controls.Add(web);

            if (cfg.TelaCheia) EntrarTelaCheia();
            else if (cfg.Maximizada) WindowState = FormWindowState.Maximized;
            Load += async delegate { await IniciarJogo(); };
        }

        static bool NaTela(Rectangle r)
        {
            foreach (Screen s in Screen.AllScreens) if (s.WorkingArea.IntersectsWith(new Rectangle(r.X, r.Y, Math.Max(80, r.Width / 3), 60))) return true;
            return false;
        }

        async Task IniciarJogo()
        {
            string pastaJogo = Path.Combine(pastaApp, "jogo");
            if (!File.Exists(Path.Combine(pastaJogo, "index.html")))
            {
                MessageBox.Show("Não encontrei a pasta \"jogo\" ao lado do programa.\n\nEsperado em: " + pastaJogo,
                    "Canudos", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close(); return;
            }
            try { await web.EnsureCoreWebView2Async(null); }
            catch (Exception ex)
            {
                MessageBox.Show("Não consegui iniciar o motor do navegador (WebView2), que o jogo usa para desenhar.\n\n" +
                    "No Windows 10, instale o \"Microsoft Edge WebView2 Runtime\" no site da Microsoft e abra o jogo de novo.\n\n" + ex.Message,
                    "Canudos", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close(); return;
            }
            CoreWebView2Settings s = web.CoreWebView2.Settings;
            s.AreDefaultContextMenusEnabled = false;
            s.AreDevToolsEnabled = false;
            s.IsStatusBarEnabled = false;
            s.IsZoomControlEnabled = false;
            s.IsPinchZoomEnabled = false;
            s.IsSwipeNavigationEnabled = false;
            s.AreBrowserAcceleratorKeysEnabled = false;   // F5, Ctrl+R etc. não recarregam o jogo no meio da partida
            s.IsPasswordAutosaveEnabled = false;
            s.IsGeneralAutofillEnabled = false;
            web.CoreWebView2.SetVirtualHostNameToFolderMapping("canudos.jogo", pastaJogo, CoreWebView2HostResourceAccessKind.Allow);
            web.CoreWebView2.WebMessageReceived += AoReceberMensagem;
            web.CoreWebView2.NewWindowRequested += delegate (object o, CoreWebView2NewWindowRequestedEventArgs e) { e.Handled = true; };
            web.CoreWebView2.Navigate("https://canudos.jogo/index.html");
        }

        void AoReceberMensagem(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string msg;
            try { msg = e.TryGetWebMessageAsString(); } catch { return; }
            Match m = Regex.Match(msg ?? "", "\"t\"\\s*:\\s*\"(\\w+)\"");
            if (!m.Success) return;
            switch (m.Groups[1].Value)
            {
                case "sair": Close(); break;
                case "telaCheia": AlternarTelaCheia(); break;
            }
        }

        void EntrarTelaCheia()
        {
            if (WindowState == FormWindowState.Normal) limitesJanela = Bounds;
            cfg.Maximizada = WindowState == FormWindowState.Maximized;
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.None;
            Bounds = (IsHandleCreated ? Screen.FromControl(this) : Screen.PrimaryScreen).Bounds;
            telaCheia = true;
        }

        void AlternarTelaCheia()
        {
            if (!telaCheia) { EntrarTelaCheia(); return; }
            telaCheia = false;
            FormBorderStyle = FormBorderStyle.Sizable;
            Bounds = limitesJanela;
            if (cfg.Maximizada) WindowState = FormWindowState.Maximized;
            BarraEscura();
        }

        void BarraEscura()
        {
            if (!IsHandleCreated) return;
            try
            {
                int escuro = 1; NativeMethods.DwmSetWindowAttribute(Handle, 20, ref escuro, 4);
                int barra = 0x00140E12; NativeMethods.DwmSetWindowAttribute(Handle, 35, ref barra, 4);   // cor da barra (BGR)
                int texto = 0x00CCE7F3; NativeMethods.DwmSetWindowAttribute(Handle, 36, ref texto, 4);
            }
            catch { }
        }

        protected override void OnHandleCreated(EventArgs e) { base.OnHandleCreated(e); BarraEscura(); }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == NativeMethods.WM_MOSTRAR)
            {
                Show();
                if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
                Activate();
            }
            base.WndProc(ref m);
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            cfg.TelaCheia = telaCheia;
            if (!telaCheia)
            {
                cfg.Maximizada = WindowState == FormWindowState.Maximized;
                Rectangle b = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
                cfg.X = b.X; cfg.Y = b.Y; cfg.W = b.Width; cfg.H = b.Height;
            }
            else
            {
                cfg.X = limitesJanela.X; cfg.Y = limitesJanela.Y; cfg.W = limitesJanela.Width; cfg.H = limitesJanela.Height;
            }
            cfg.Salvar();
            base.OnFormClosing(e);
        }
    }
}
