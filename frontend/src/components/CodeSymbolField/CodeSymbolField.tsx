// Syntax-highlight-style colors, matching common editor themes — each
// symbol keeps the color its token type would actually have.
// Same four symbols, same order, as the original static background pattern.
const SYMBOLS = [
  { text: '{ }', color: '#e5c07b' }, // brace — gold
  { text: '</>', color: '#e06c75' }, // JSX tag — coral
  { text: ';', color: '#56b6c2' }, // punctuation — cyan
  { text: '#', color: '#7091e6' }, // brand blue (doubles as the logo mark)
]

const GRID_COLS = 7
const GRID_ROWS = 6

// Deterministic "random-looking" placement — jitters each symbol inside its
// own grid cell so the field reads as scattered, not a repeating tile, but
// never changes between renders (no layout shift, no need for real RNG).
function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

const SYMBOL_INSTANCES = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, index) => {
  const col = index % GRID_COLS
  const row = Math.floor(index / GRID_COLS)
  const cellWidth = 100 / GRID_COLS
  const cellHeight = 100 / GRID_ROWS
  const jitterX = pseudoRandom(index * 2 + 1) * 0.6 + 0.2
  const jitterY = pseudoRandom(index * 2 + 2) * 0.6 + 0.2
  const { text, color } = SYMBOLS[index % SYMBOLS.length]
  return {
    text,
    color,
    left: `${col * cellWidth + jitterX * cellWidth}%`,
    top: `${row * cellHeight + jitterY * cellHeight}%`,
    fontSize: `${12 + pseudoRandom(index * 3) * 7}px`,
    animationDuration: `${3 + pseudoRandom(index * 5) * 4}s`,
    animationDelay: `${pseudoRandom(index * 7) * 4}s`,
  }
})

// Sits inside the same fixed, viewport-sized background layer as
// HeroCanvas — deliberately behind everything, low-opacity and slow, so it
// reads as ambient texture rather than competing with real content.
function CodeSymbolField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SYMBOL_INSTANCES.map((symbol, index) => (
        <span
          key={index}
          className="code-symbol absolute font-mono font-semibold"
          style={{
            left: symbol.left,
            top: symbol.top,
            fontSize: symbol.fontSize,
            color: symbol.color,
            animationDuration: symbol.animationDuration,
            animationDelay: symbol.animationDelay,
          }}
        >
          {symbol.text}
        </span>
      ))}
    </div>
  )
}

export default CodeSymbolField
