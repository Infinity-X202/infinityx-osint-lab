import { highlight } from '@/lib/search'
import type { SearchSuggestion } from '@/lib/search'

export function SearchSuggest({
  items,
  query,
  onPick,
}: {
  items: SearchSuggestion[]
  query: string
  onPick: (item: SearchSuggestion) => void
}) {
  if (!items.length) return null
  return (
    <ul
      role="listbox"
      aria-label="Search suggestions"
      className="mt-2 max-h-80 overflow-auto rounded-xl border border-[#7ee8ff]/20 bg-[#071018]/95 text-left shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
    >
      {items.map((item) => (
        <li key={`${item.kind}-${item.recordId}-${item.value}`}>
          <button
            type="button"
            role="option"
            className="flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#4de1c1]/10"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(item)}
          >
            <span>
              <span
                className="block text-sm text-[#e8f8ff]"
                dangerouslySetInnerHTML={{ __html: highlight(item.value, query) }}
              />
              <span className="block text-xs text-[#7f93a3]">{item.subtitle}</span>
            </span>
            <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] tracking-wide text-[#7ee8ff]">
              {item.kind}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
