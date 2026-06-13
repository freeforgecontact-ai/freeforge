import React, { useState, useMemo } from 'react';

/**
 * WebToExecutable — générateur de projet « Web vers exécutable », 100 % local.
 * IMPORTANT : cet outil NE COMPILE PAS (la compilation native exige un PC/SDK).
 * Il GÉNÈRE un projet prêt-à-compiler : code source du wrapper + instructions.
 * Cible Windows (C# HttpListener + WebView2) ou Android (WebView). Aucun réseau.
 */

const slug = (s) => (s || 'MonApp').replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]+/, '') || 'MonApp';
const pkg = (s) => 'com.freeforge.' + (slug(s).toLowerCase() || 'monapp');

export default function WebToExecutable({ goBack }) {
  const [name, setName] = useState('Mon Application');
  const [target, setTarget] = useState('windows');
  const [source, setSource] = useState('url'); // 'url' | 'html'
  const [url, setUrl] = useState('https://example.com');
  const [html, setHtml] = useState('<!DOCTYPE html>\n<html><body><h1>Bonjour FreeForge</h1></body></html>');
  const [copied, setCopied] = useState('');

  const cls = useMemo(() => slug(name), [name]);
  const usesUrl = source === 'url';
  const startUrl = usesUrl ? url : 'http://localhost:8731/';

  const files = useMemo(() => {
    if (target === 'windows') {
      const esc = html.replace(/"/g, '""');
      const navTarget = usesUrl ? `"${url}"` : `"${startUrl}"`;
      const program = `using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;

// ${name} — wrapper de bureau généré par FreeForge (WebView2 + HttpListener).
namespace ${cls}
{
    static class Program
    {
        ${usesUrl ? "" : `const string Html = @\"${esc}\";\n        static HttpListener _srv;`}
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            ${usesUrl ? "" : "StartLocalServer();"}
            var form = new Form { Text = \"${name}\", Width = 1100, Height = 760 };
            var web = new WebView2 { Dock = DockStyle.Fill };
            form.Controls.Add(web);
            form.Load += async (s, e) => {
                await web.EnsureCoreWebView2Async(null);
                web.CoreWebView2.Navigate(${navTarget});
            };
            Application.Run(form);
        }
${usesUrl ? "" : `
        static void StartLocalServer()
        {
            _srv = new HttpListener();
            _srv.Prefixes.Add(\"${startUrl}\");
            _srv.Start();
            ThreadPool.QueueUserWorkItem(_ => {
                while (_srv.IsListening)
                {
                    var ctx = _srv.GetContext();
                    var buf = Encoding.UTF8.GetBytes(Html);
                    ctx.Response.ContentType = \"text/html; charset=utf-8\";
                    ctx.Response.OutputStream.Write(buf, 0, buf.Length);
                    ctx.Response.Close();
                }
            });
        }`}
    }
}`;
      const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <UseWindowsForms>true</UseWindowsForms>
    <AssemblyName>${cls}</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2210.55" />
  </ItemGroup>
</Project>`;
      const readme = `# ${name} — projet Windows prêt à compiler

Généré par FreeForge. Aucune compilation n'a été faite : suivez ces étapes sur un PC Windows.

## Option A — .NET SDK (recommandé)
1. Installez le .NET 8 SDK (https://dotnet.microsoft.com).
2. Dans ce dossier :  dotnet restore  puis  dotnet build -c Release
3. L'exécutable : bin/Release/net8.0-windows/${cls}.exe
4. Publication autonome :  dotnet publish -c Release -r win-x64 --self-contained

## Option B — csc.exe (compilateur seul)
Nécessite le runtime WebView2 + la DLL WebView2 référencée. Le SDK reste préférable.
   csc.exe /target:winexe /out:${cls}.exe Program.cs

Prérequis utilisateur final : « Microsoft Edge WebView2 Runtime » (souvent déjà présent sur Windows 10/11).`;
      return [
        { name: 'Program.cs', body: program },
        { name: `${cls}.csproj`, body: csproj },
        { name: 'README.md', body: readme },
      ];
    }

    // ----- Android -----
    const pkgName = pkg(name);
    const pkgPath = pkgName.replace(/\./g, '/');
    const loadLine = usesUrl ? `webView.loadUrl("${url}");` : `webView.loadDataWithBaseURL(null, HTML, "text/html", "utf-8", null);`;
    const htmlConst = usesUrl ? '' : `\n    private static final String HTML = ${JSON.stringify(html)};`;
    const main = `package ${pkgName};

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

// ${name} — wrapper Android WebView généré par FreeForge.
public class MainActivity extends Activity {${htmlConst}
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        WebView webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);
        ${loadLine}
    }
}`;
    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkgName}">
    ${usesUrl ? '<uses-permission android:name="android.permission.INTERNET" />' : '<!-- HTML local : aucune permission Internet requise -->'}
    <application android:label="${name}" android:allowBackup="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
    const gradle = `plugins { id 'com.android.application' }
android {
    namespace '${pkgName}'
    compileSdk 34
    defaultConfig {
        applicationId "${pkgName}"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    buildTypes { release { minifyEnabled false } }
}
dependencies { }`;
    const readme = `# ${name} — projet Android prêt à compiler

Généré par FreeForge. Aucune compilation n'a été faite. Sur un PC avec le SDK Android :

## Arborescence attendue
app/src/main/java/${pkgPath}/MainActivity.java
app/src/main/AndroidManifest.xml
app/build.gradle  (+ build.gradle racine et settings.gradle d'un projet Android Studio)

## Compiler le APK de debug
1. Ouvrez le projet dans Android Studio OU en ligne de commande.
2. ./gradlew assembleDebug      (Windows :  gradlew.bat assembleDebug )
3. APK généré : app/build/outputs/apk/debug/app-debug.apk
4. Installation :  adb install app/build/outputs/apk/debug/app-debug.apk

Astuce : « Nouveau projet > Empty Activity » dans Android Studio fournit les
fichiers gradle racine ; remplacez ensuite MainActivity et le manifest par ceux-ci.`;
    return [
      { name: 'MainActivity.java', body: main },
      { name: 'AndroidManifest.xml', body: manifest },
      { name: 'build.gradle', body: gradle },
      { name: 'README.md', body: readme },
    ];
  }, [target, name, cls, html, url, usesUrl, startUrl]);

  const download = (f) => {
    try {
      const blob = new Blob([f.body], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) { /* download indispo : on ignore */ }
  };
  const downloadAll = () => files.forEach((f, i) => setTimeout(() => download(f), i * 150));
  const copy = async (f) => {
    try { await navigator.clipboard.writeText(f.body); setCopied(f.name); setTimeout(() => setCopied(''), 1400); } catch (e) { /* ignore */ }
  };

  return (
    <div className="w2e">
      <style>{`
        .w2e{color:#eaf2fb;max-width:1080px;margin:0 auto}
        .w2e h1{font-size:1.55rem;margin:0 0 4px}
        .w2e .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 14px}
        .w2e-warn{background:rgba(255,174,59,.14);border:1px solid rgba(255,174,59,.5);color:#ffd9a0;border-radius:12px;padding:12px 14px;font-size:.85rem;line-height:1.45;margin-bottom:16px}
        .w2e-warn b{color:#ffae3b}
        .w2e-grid{display:grid;grid-template-columns:330px 1fr;gap:16px}
        .w2e-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .w2e-field{margin-bottom:14px}
        .w2e-field>span{display:block;font-size:.82rem;color:#9fb6cf;margin-bottom:6px}
        .w2e-in,.w2e-ta{width:100%;box-sizing:border-box;background:rgba(255,255,255,.95);color:#0a2236;border:1px solid #cfe0f2;border-radius:9px;padding:9px 11px;font-size:.88rem}
        .w2e-ta{font-family:ui-monospace,Consolas,monospace;font-size:.8rem;min-height:120px;resize:vertical}
        .w2e-seg{display:flex;gap:6px;background:rgba(0,0,0,.2);padding:4px;border-radius:9px}
        .w2e-seg button{flex:1;background:none;color:#eaf2fb;border:none;border-radius:7px;padding:8px;font-weight:700;cursor:pointer;font-size:.82rem}
        .w2e-seg button.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300}
        .w2e-file{margin-bottom:14px}
        .w2e-fhead{display:flex;align-items:center;gap:8px;margin-bottom:6px}
        .w2e-fname{font-weight:700;font-size:.85rem;color:#cfe0f2;flex:1;font-family:ui-monospace,Consolas,monospace}
        .w2e-mini{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:7px;padding:5px 9px;font-size:.74rem;cursor:pointer;font-weight:700}
        .w2e-mini.dl{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .w2e-file pre{background:#071524;color:#bfe0ff;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px;font-size:.78rem;overflow:auto;margin:0;max-height:260px;font-family:ui-monospace,Consolas,monospace;line-height:1.45}
        .w2e-allbtn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:9px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.85rem;width:100%;margin-bottom:14px}
        @media(max-width:760px){.w2e-grid{grid-template-columns:1fr}.w2e h1{font-size:1.3rem}}
      `}</style>

      <h1>📦 Web vers exécutable</h1>
      <p className="sub">Génère un projet prêt-à-compiler qui emballe ton app web dans un exécutable de bureau ou une appli Android.</p>

      <div className="w2e-warn">
        <b>À lire :</b> cet outil <b>ne compile pas</b> (la compilation native exige un PC avec le SDK et ne peut pas se faire
        dans le navigateur, hors-ligne). Il <b>génère le projet complet prêt à compiler</b> — code source du wrapper + instructions.
        Télécharge les fichiers, puis lance la compilation toi-même en suivant le README.
      </div>

      <div className="w2e-grid">
        <div className="w2e-card">
          <div className="w2e-field">
            <span>Nom de l'application</span>
            <input className="w2e-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon Application" />
          </div>

          <div className="w2e-field">
            <span>Cible</span>
            <div className="w2e-seg">
              <button className={target === 'windows' ? 'on' : ''} onClick={() => setTarget('windows')}>🪟 Windows</button>
              <button className={target === 'android' ? 'on' : ''} onClick={() => setTarget('android')}>🤖 Android</button>
            </div>
          </div>

          <div className="w2e-field">
            <span>Source de l'app</span>
            <div className="w2e-seg">
              <button className={source === 'url' ? 'on' : ''} onClick={() => setSource('url')}>URL en ligne</button>
              <button className={source === 'html' ? 'on' : ''} onClick={() => setSource('html')}>HTML local</button>
            </div>
          </div>

          {usesUrl ? (
            <div className="w2e-field">
              <span>URL à charger</span>
              <input className="w2e-in" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </div>
          ) : (
            <div className="w2e-field">
              <span>HTML embarqué (servi localement / hors-ligne)</span>
              <textarea className="w2e-ta" value={html} onChange={(e) => setHtml(e.target.value)} />
            </div>
          )}

          <div style={{ fontSize: '.78rem', color: '#9fb6cf', lineHeight: 1.4 }}>
            {target === 'windows'
              ? `Identité générée : classe ${cls} · exécutable ${cls}.exe`
              : `Package généré : ${pkg(name)}`}
          </div>
        </div>

        <div className="w2e-card">
          <button className="w2e-allbtn" onClick={downloadAll}>⬇ Télécharger les {files.length} fichiers du projet</button>
          {files.map((f) => (
            <div key={f.name} className="w2e-file">
              <div className="w2e-fhead">
                <span className="w2e-fname">{f.name}</span>
                <button className="w2e-mini" onClick={() => copy(f)}>{copied === f.name ? '✓ Copié' : 'Copier'}</button>
                <button className="w2e-mini dl" onClick={() => download(f)}>Télécharger</button>
              </div>
              <pre>{f.body}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
