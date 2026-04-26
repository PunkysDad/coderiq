import { useState } from 'react'

export default function FlashCard({ card, index }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      className="relative w-full min-h-[200px] cursor-pointer select-none"
      style={{ perspective: '1000px' }}
    >
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'none',
        }}
      >
        <Face>
          <span className="absolute top-3 left-4 text-xs font-mono text-gray-500">
            #{index + 1}
          </span>
          <p className="text-gray-100 text-lg md:text-xl text-center leading-relaxed font-medium px-4">
            {card.front}
          </p>
          <span className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-500 font-mono">
            click to flip
          </span>
        </Face>

        <Face flipped>
          <span className="absolute top-3 left-4 text-xs font-mono text-violet-400/70">
            #{index + 1} • answer
          </span>
          <p className="text-gray-100 text-base md:text-lg text-center leading-relaxed px-4">
            {card.back}
          </p>
        </Face>
      </div>
    </div>
  )
}

function Face({ children, flipped = false }) {
  const baseClass = flipped
    ? 'border-violet-500/30 bg-gray-800'
    : 'border-gray-800 bg-gray-900'
  return (
    <div
      className={`absolute inset-0 rounded-xl border ${baseClass} p-8 flex items-center justify-center`}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: flipped ? 'rotateY(180deg)' : 'none',
      }}
    >
      {children}
    </div>
  )
}
