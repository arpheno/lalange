import { useState } from 'react'
import { Library } from './components/Library/Library'
import { Reader } from './components/Reader/Reader'
import type { BookDocType } from './core/sync/db'

function App() {
  const [currentBook, setCurrentBook] = useState<BookDocType | null>(null)

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center overflow-hidden">
      <div className="w-full flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-xl font-mono font-bold">Lalange</h1>
        {currentBook && (
          <button
            onClick={() => setCurrentBook(null)}
            className="font-mono text-sm text-gray-400 hover:text-white"
          >
            Back to Library
          </button>
        )}
      </div>

      <div className="flex-1 w-full overflow-auto flex justify-center">
        {currentBook ? (
          <Reader book={currentBook} />
        ) : (
          <Library onOpenBook={setCurrentBook} />
        )}
      </div>
    </div>
  )
}

export default App
