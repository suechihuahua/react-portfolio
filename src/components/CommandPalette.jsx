import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { person, sections } from '../content/site.js'
import { buildCommands, filterCommands } from '../lib/commands.js'
import { useConsoleStore } from '../store/useConsoleStore.js'

// The box only exists while the palette is open, so its query and cursor are
// fresh on every launch -- no reset effects needed.
function PaletteBox({ onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [copied, setCopied] = useState(false)

  const commands = useMemo(() => buildCommands(sections, person), [])
  const results = useMemo(() => filterCommands(commands, query), [commands, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keep the highlighted row in view as the cursor walks the list.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor, results])

  const run = (command) => {
    if (!command) return
    if (command.copy) {
      navigator.clipboard?.writeText(command.copy)
      setCopied(true)
      return
    }
    if (command.to) {
      navigate(command.to)
    } else if (command.href) {
      const link = document.createElement('a')
      link.href = command.href
      if (command.download) link.download = ''
      if (command.external) {
        link.target = '_blank'
        link.rel = 'noreferrer'
      }
      link.click()
    }
    onClose()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) {
      e.preventDefault()
      setCursor((c) => (results.length ? (c + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey)) {
      e.preventDefault()
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[cursor])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="palette__box"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="palette__field">
        <span className="palette__chevron" aria-hidden="true">
          ›
        </span>
        <input
          ref={inputRef}
          className="palette__input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search sections and actions…"
          aria-label="Search sections and actions"
          autoComplete="off"
          spellCheck="false"
        />
        <kbd className="palette__kbd">esc</kbd>
      </div>

      <ul className="palette__list" role="listbox" aria-label="Results" ref={listRef}>
        {results.map((command, i) => (
          <li key={command.id}>
            <button
              type="button"
              className={`palette__row${i === cursor ? ' palette__row--active' : ''}`}
              data-active={i === cursor}
              role="option"
              aria-selected={i === cursor}
              onPointerEnter={() => setCursor(i)}
              onClick={() => run(command)}
            >
              <span className="palette__badge">{command.badge}</span>
              <span className="palette__label">{command.label}</span>
              {command.hint && <span className="palette__hint">{command.hint}</span>}
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="palette__empty">No matches</li>}
      </ul>

      <div className="palette__foot">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> navigate
        </span>
        <span>
          <kbd>↵</kbd> run
        </span>
        <span aria-live="polite">
          {copied ? 'Copied to clipboard' : `${results.length} results`}
        </span>
      </div>
    </div>
  )
}

// ⌘K / Ctrl-K anywhere. Arrow keys move, Enter runs, Escape closes.
export default function CommandPalette() {
  const open = useConsoleStore((s) => s.paletteOpen)
  const close = useConsoleStore((s) => s.closePalette)

  if (!open) return null

  return (
    <div className="palette" role="presentation" onPointerDown={close}>
      <PaletteBox onClose={close} />
    </div>
  )
}
