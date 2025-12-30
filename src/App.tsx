import { useState, useEffect } from 'react'
import { Library } from './components/Library/Library'
import { Reader } from './components/Reader/Reader'
import { FontPlayground } from './components/FontPlayground'
import type { BookDocType } from './core/sync/db'
import { useSettingsStore } from './core/store/settings'
import { clsx } from 'clsx'

function App() {
  const [currentBook, setCurrentBook] = useState<BookDocType | null>(null)
  const [showPlayground, setShowPlayground] = useState(false)
  const { theme } = useSettingsStore()

  // Apply theme to body
  useEffect(() => {
    document.body.className = ''; // Reset
    if (theme === 'dunes') document.body.classList.add('theme-dunes');
    if (theme === 'ash') document.body.classList.add('theme-ash');
    // volcanic is default (no class)
  }, [theme]);

  return (
    <div className={clsx(
      "w-screen h-screen flex flex-col items-center overflow-hidden transition-colors duration-700",
      // Base colors are handled by body/CSS variables, but we can enforce defaults here if needed
      "bg-basalt text-white"
    )}>
      <div className="w-full flex justify-between items-center p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-mono font-bold tracking-widest text-magma-vent animate-pulse">LALANGE</h1>
          <button
            onClick={() => setShowPlayground(!showPlayground)}
            className="text-xs text-gray-600 hover:text-dune-gold transition-colors font-mono"
          >
            [ {showPlayground ? 'APP' : 'TYPOGRAPHY'} ]
          </button>
        </div>
        {currentBook && !showPlayground && (
          <button
            onClick={() => setCurrentBook(null)}
            className="font-mono text-sm text-gray-400 hover:text-white transition-colors"
          >
            [ BACK_TO_LIBRARY ]
          </button>
        )}
      </div>

      <div className="flex-1 w-full overflow-auto flex justify-center relative">
        {/* Mica Dust Layer */}
        <div className="mica-dust-layer" />

        {showPlayground ? (
          <FontPlayground />
        ) : currentBook ? (
          <Reader book={currentBook} />
        ) : (
          <Library onOpenBook={setCurrentBook} />
        )}
      </div>
    </div>
  )
}

export default App
