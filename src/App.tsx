import { useState, useEffect } from 'react'
import { Library } from './components/Library/Library'
import { Reader } from './components/Reader/Reader'
import { SettingsPanel } from './components/Settings/SettingsPanel'
import { Manifesto } from './components/Manifesto'
import type { BookDocType } from './core/sync/db'
import { useSettingsStore } from './core/store/settings'
import { useAIStore } from './core/store/ai'
import { clsx } from 'clsx'

type ViewState = 'library' | 'reader' | 'settings' | 'manifesto';

function App() {
  const [currentBook, setCurrentBook] = useState<BookDocType | null>(null)
  const [view, setView] = useState<ViewState>('library')
  const { theme } = useSettingsStore()
  const aiState = useAIStore()

  // Sync view state with book selection
  useEffect(() => {
    if (currentBook) {
      setView('reader');
    } else if (view === 'reader') {
      setView('library');
    }
  }, [currentBook]);

  // Apply theme to body
  useEffect(() => {
    document.body.className = ''; // Reset
    if (theme === 'dunes') document.body.classList.add('theme-dunes');
    if (theme === 'ash') document.body.classList.add('theme-ash');
    // volcanic is default (no class)
  }, [theme]);

  const handleCloseSettings = () => {
    if (currentBook) {
      setView('reader');
    } else {
      setView('library');
    }
  };

  return (
    <div className={clsx(
      "w-screen h-screen flex flex-col items-center overflow-hidden transition-colors duration-700",
      // Base colors are handled by body/CSS variables, but we can enforce defaults here if needed
      "bg-basalt text-white"
    )}>
      <div className="w-full flex justify-between items-center p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-mono font-bold tracking-widest text-magma-vent animate-pulse">ARPHEN</h1>
          {aiState.activity && (
            <div className="hidden md:flex items-center gap-2 text-[10px] text-dune-gold font-mono border border-dune-gold/20 px-2 py-1 rounded bg-dune-gold/5 animate-in fade-in slide-in-from-left-2">
              <span className="animate-pulse">●</span>
              <span className="uppercase tracking-wider">{aiState.activity}</span>
            </div>
          )}
          <button
            onClick={() => setView(view === 'settings' ? (currentBook ? 'reader' : 'library') : 'settings')}
            className={clsx(
              "text-xs transition-colors font-mono",
              view === 'settings' ? "text-dune-gold font-bold" : "text-gray-600 hover:text-dune-gold"
            )}
          >
            [ {view === 'settings' ? 'CLOSE_SETTINGS' : 'SETTINGS'} ]
          </button>
        </div>
        <div className="flex items-center gap-4">
          {view !== 'library' && view !== 'manifesto' && (
            <button
              onClick={() => {
                setCurrentBook(null);
                setView('library');
              }}
              className="font-mono text-sm text-gray-400 hover:text-white transition-colors"
            >
              [ BACK_TO_LIBRARY ]
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto flex justify-center relative">
        {/* Mica Dust Layer */}
        <div className="mica-dust-layer" />

        {view === 'settings' ? (
          <SettingsPanel onClose={handleCloseSettings} />
        ) : view === 'manifesto' ? (
          <Manifesto onBack={() => setView('library')} />
        ) : view === 'reader' && currentBook ? (
          <Reader
            book={currentBook}
            onOpenSettings={() => setView('settings')}
          />
        ) : (
          <Library onOpenBook={setCurrentBook} />
        )}
      </div>

      {/* Made by Arphen Corner Label */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setView('manifesto')}
          className="text-[10px] font-mono text-white/30 hover:text-lacan-red transition-colors tracking-widest uppercase"
        >
          Made by Arphen
        </button>
      </div>
    </div>
  )
}

export default App
