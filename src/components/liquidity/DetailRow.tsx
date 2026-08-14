'use client'

/**
 * One fact in a confirmation dialog: label left, value right.
 *
 * Shared by the deposit and withdrawal dialogs so both read the same way — a
 * table of facts rather than a paragraph to parse for numbers.
 *
 * `sub` is a short qualifier that belongs to the value and sits under it.
 * `note` is a full sentence about the row, running the full width beneath it,
 * so an explanation stays attached to the fact it explains instead of drifting
 * into a block below the table.
 */
export function DetailRow({
  label,
  value,
  sub,
  note,
  mono = false
}: {
  label: string
  value: string
  sub?: string
  note?: string
  mono?: boolean
}) {
  return (
    <div className='px-3 py-2.5'>
      <div className='flex items-start justify-between gap-4'>
        <dt className='text-sm text-muted-foreground'>{label}</dt>
        <dd className='text-right'>
          <div
            className={`text-sm font-semibold text-foreground ${mono ? 'font-mono' : ''}`}
          >
            {value}
          </div>
          {sub && <div className='text-xs text-muted-foreground'>{sub}</div>}
        </dd>
      </div>
      {note && (
        <p className='mt-1.5 text-xs leading-relaxed text-muted-foreground'>
          {note}
        </p>
      )}
    </div>
  )
}
