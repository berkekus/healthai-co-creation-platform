import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { TimeSlot } from '../../types/meeting.types'
import {
  MAX_PROPOSED_SLOTS,
  SLOT_HOURS,
  SLOT_MINUTES,
  describeSlot,
} from '../../utils/timeSlots'

/** A time slot while it is being filled in; hour and minute are chosen separately. */
export interface SlotDraft {
  key: number
  date: string
  hour: string
  minute: string
}

let nextKey = 0
export function newSlotDraft(): SlotDraft {
  nextKey += 1
  return { key: nextKey, date: '', hour: '', minute: '' }
}

export function slotsFromDrafts(drafts: SlotDraft[], timezone?: string): TimeSlot[] {
  return drafts
    .filter(draft => draft.date && draft.hour && draft.minute)
    .map(draft => ({
      date: draft.date,
      time: `${draft.hour}:${draft.minute}`,
      ...(timezone ? { timezone } : {}),
    }))
}

interface Props {
  drafts: SlotDraft[]
  onChange: (drafts: SlotDraft[]) => void
  /** Earliest selectable date, YYYY-MM-DD. */
  minDate: string
  /** The proposer's IANA zone, shown so nobody has to guess what "14:00" means. */
  timezone?: string
}

const controlCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-hai-plum outline-none transition-colors focus:border-hai-plum focus:shadow-[0_0_0_3px_rgba(138,198,208,0.32)]'

export default function SlotListEditor({ drafts, onChange, minDate, timezone }: Props) {
  const { t, i18n } = useTranslation()
  const idPrefix = useId()

  const update = (key: number, patch: Partial<SlotDraft>) => {
    onChange(drafts.map(draft => {
      if (draft.key !== key) return draft
      const next = { ...draft, ...patch }
      // Picking an hour should be enough for a round hour — :00 is the common case.
      if (patch.hour && !next.minute) next.minute = '00'
      return next
    }))
  }

  const zoneLabel = timezone
    ? describeSlot({ date: minDate, time: '12:00', timezone }, i18n.language).zoneLabel
    : undefined

  return (
    <div className="flex flex-col gap-3">
      {zoneLabel && (
        <p className="text-xs font-semibold text-neutral-500">{t('meetingSlots.zoneNote', { zone: zoneLabel })}</p>
      )}

      {drafts.map((draft, index) => {
        const complete = draft.date && draft.hour && draft.minute
        const preview = complete
          ? describeSlot({ date: draft.date, time: `${draft.hour}:${draft.minute}`, timezone }, i18n.language)
          : null
        // Separate labels: a label wrapping a <select> makes screen readers read its options too.
        const fieldId = (field: string) => `${idPrefix}-${draft.key}-${field}`
        return (
          <div key={draft.key} role="group" aria-label={t('meetingSlots.slotN', { n: index + 1 })} className="rounded-2xl bg-hai-offwhite p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-neutral-500">
                {t('meetingSlots.slotN', { n: index + 1 })}
              </span>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(drafts.filter(item => item.key !== draft.key))}
                  aria-label={t('meetingSlots.remove', { n: index + 1 })}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <div>
                <label htmlFor={fieldId('date')} className="mb-1.5 block text-xs font-bold text-neutral-600">{t('meetingSlots.date')}</label>
                <input
                  id={fieldId('date')}
                  type="date"
                  value={draft.date}
                  min={minDate}
                  onChange={event => update(draft.key, { date: event.target.value })}
                  className={controlCls}
                />
              </div>

              <fieldset className="min-w-0">
                <legend className="mb-1.5 block text-xs font-bold text-neutral-600">{t('meetingSlots.time')}</legend>
                <div className="flex items-center gap-1.5">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={fieldId('hour')} className="sr-only">{t('meetingSlots.hour')}</label>
                    <select id={fieldId('hour')} value={draft.hour} onChange={event => update(draft.key, { hour: event.target.value })} className={controlCls}>
                      <option value="">--</option>
                      {SLOT_HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
                    </select>
                  </div>
                  <span aria-hidden="true" className="font-black text-hai-plum">:</span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={fieldId('minute')} className="sr-only">{t('meetingSlots.minute')}</label>
                    <select id={fieldId('minute')} value={draft.minute} onChange={event => update(draft.key, { minute: event.target.value })} className={controlCls}>
                      <option value="">--</option>
                      {SLOT_MINUTES.map(minute => <option key={minute} value={minute}>{minute}</option>)}
                    </select>
                  </div>
                </div>
              </fieldset>
            </div>

            {preview && (
              <p className="mt-3 text-sm font-bold text-hai-plum">
                {preview.dateLabel} · {preview.timeLabel}
              </p>
            )}
          </div>
        )
      })}

      {drafts.length < MAX_PROPOSED_SLOTS && (
        <button
          type="button"
          onClick={() => onChange([...drafts, newSlotDraft()])}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-neutral-300 py-3 text-xs font-mono font-bold uppercase tracking-[0.12em] text-hai-plum transition-colors hover:border-hai-plum hover:bg-hai-mint/20"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">add</span>
          {t('meetingSlots.add')}
        </button>
      )}
    </div>
  )
}
