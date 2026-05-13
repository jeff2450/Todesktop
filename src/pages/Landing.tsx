import { Terminal, Layers, Zap, Globe, Box, ArrowRight, Github, CheckCircle } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
  onTasks?: () => void;
}

export function Landing({ onGetStarted, onTasks }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm tracking-tight">WebToApp</span>
          </div>
          <div className="flex items-center gap-3">
            {onTasks && (
              <button
                onClick={onTasks}
                className="px-3 py-1.5 text-gray-400 hover:text-gray-100 text-sm transition-colors font-medium"
              >
                My tasks
              </button>
            )}
            <a
              href="https://github.com/jeff2450/desktop-to-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <button
              onClick={onGetStarted}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors font-medium"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700/40 rounded-full text-blue-300 text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          Zero-config Electron packaging for your web apps
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
          Turn any web project<br />
          <span className="text-blue-400">into a desktop app</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Generate a <code className="text-blue-300 bg-gray-900 px-1.5 py-0.5 rounded text-sm font-mono">webtoapp.config.json</code> for your project, get ready-to-run CLI commands, and track all your conversions in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            Start a new project
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="https://github.com/jeff2450/desktop-to-app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors border border-gray-700"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </section>

      {/* Terminal demo */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-800 bg-gray-900">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-gray-500 font-mono">terminal</span>
          </div>
          <div className="p-6 font-mono text-sm space-y-2">
            <div className="text-gray-500"># 1. Generate your config with WebToApp</div>
            <div className="text-gray-300"><span className="text-blue-400">$</span> npx webtoapp doctor</div>
            <div className="text-green-400 pl-2">✓ Node 20.x detected</div>
            <div className="text-green-400 pl-2">✓ electron-builder available</div>
            <div className="text-gray-300 mt-2"><span className="text-blue-400">$</span> npx webtoapp init</div>
            <div className="text-green-400 pl-2">✓ webtoapp.config.json written</div>
            <div className="text-gray-300 mt-2"><span className="text-blue-400">$</span> npx webtoapp convert</div>
            <div className="text-green-400 pl-2">✓ Building for windows, linux, macos...</div>
            <div className="text-green-400 pl-2">✓ Artifacts written to /dist</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12 text-white">Everything you need to ship desktop apps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Layers className="w-5 h-5 text-blue-400" />,
              title: 'Multi-framework support',
              desc: 'Works with React + Vite, Next.js, Vue, and any static export. Auto-detects your stack.',
            },
            {
              icon: <Globe className="w-5 h-5 text-blue-400" />,
              title: 'Offline, online, hybrid',
              desc: 'Choose how the packaged app loads: bundled assets, remote URL, or a dynamic mix.',
            },
            {
              icon: <Terminal className="w-5 h-5 text-blue-400" />,
              title: 'Live config preview',
              desc: 'See your webtoapp.config.json update in real time as you fill the form. Copy with one click.',
            },
            {
              icon: <Box className="w-5 h-5 text-blue-400" />,
              title: 'Cross-platform targets',
              desc: 'Generate installers for Windows (.exe), macOS (.dmg), and Linux (.AppImage / .deb).',
            },
            {
              icon: <Zap className="w-5 h-5 text-blue-400" />,
              title: 'Backend integration',
              desc: 'Automatically wires Supabase, Firebase, Express, or a custom backend into the Electron shell.',
            },
            {
              icon: <CheckCircle className="w-5 h-5 text-blue-400" />,
              title: 'Project history',
              desc: 'Save and revisit every config generation. Edit, re-export, and track your build targets.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mode table */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">Choose the right mode</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Mode</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Works offline?</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">How it loads</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mode: 'Offline', offline: 'Yes', how: 'Bundles your static build inside the app' },
                { mode: 'Online', offline: 'No', how: 'Loads a remote URL in an Electron window' },
                { mode: 'Hybrid', offline: 'Partial', how: 'Bundles core UI, fetches dynamic data online' },
              ].map((row, i) => (
                <tr key={row.mode} className={i < 2 ? 'border-b border-gray-800' : ''}>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                      row.mode === 'Offline' ? 'bg-green-900/40 text-green-300' :
                      row.mode === 'Online' ? 'bg-blue-900/40 text-blue-300' :
                      'bg-yellow-900/40 text-yellow-300'
                    }`}>{row.mode.toLowerCase()}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-300">{row.offline}</td>
                  <td className="px-5 py-3 text-gray-400">{row.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to package your app?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Create a free account and generate your first config in under a minute.</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 text-base"
          >
            Get started for free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-400" />
            <span>WebToApp Config Generator</span>
          </div>
          <a
            href="https://github.com/jeff2450/desktop-to-app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <Github className="w-4 h-4" />
            jeff2450/desktop-to-app
          </a>
        </div>
      </footer>
    </div>
  );
}
