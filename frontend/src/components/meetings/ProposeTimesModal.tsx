import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TimeSlot } from '../../types/meeting.types'
import { browserTimeZone, localDateInputValue } from '../../utils/timeSlots'
import ConfirmDialog from '../ui/ConfirmDialog'
import SlotListEditor, { newSlotDraft, slotsFromDrafts, type SlotDraft } from './SlotListEditor'

interface Props {
  ownerName: string
  onSubmit: (slots: TimeSlot[]) => Promise<void>
  onClose: () => void
}

/** Lets a requester replace their proposed times when none of them suit the owner. */
export default function ProposeTimesModal({ ownerName, onSubmit, onClose }: Props) {
  const { t } = useTranslation()
  const [drafts, setDrafts] = useState<SlotDraft[]>(() => [newSlotDraft()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timezone = useMemo(() => browserTimeZone(), [])
  const minDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return localDateInputValue(tomorrow)
  }, [])
  const slots = slotsFromDrafts(drafts, timezone)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit(slots)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
      setBusy(false)
    }
  }

  return (
    <ConfirmDialog
      title={t('meetingsPage.proposeTitle')}
      confirmLabel={busy ? t('meetingRequest.sending') : t('meetingsPage.proposeSend')}
      cancelLabel={t('common.cancel')}
      onConfirm={submit}
      onCancel={onClose}
      busy={busy}
      confirmDisabled={slots.length === 0}
      error={error}
    >
      <p>{t('meetingsPage.proposeIntro', { name: ownerName })}</p>
      <div className="max-h-[50vh] overflow-y-auto pr-1">
        <SlotListEditor drafts={drafts} onChange={setDrafts} minDate={minDate} timezone={timezone} />
      </div>
    </ConfirmDialog>
  )
}
