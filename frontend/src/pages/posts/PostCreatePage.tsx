import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { createPostCreateSchema, type PostCreateFormData } from '../../utils/validators'
import PostFormFields from '../../components/posts/PostFormFields'
import { postDetail, ROUTES } from '../../constants/routes'

export default function PostCreatePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { create } = usePostStore()
  const navigate = useNavigate()
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish'>('draft')

  const { register, control, setValue, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<PostCreateFormData>({
    resolver: zodResolver(createPostCreateSchema(t)),
    defaultValues: { confidentiality: 'public_pitch', projectStage: 'idea', levelOfCommitment: 'flexible' },
    mode: 'onTouched',
  })

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, isSubmitting])

  const onSubmit = async (data: PostCreateFormData) => {
    if (!user) return
    const role = user.role === 'admin' ? 'engineer' : user.role
    const post = await create(data, user.id, user.name, role as 'engineer' | 'healthcare_professional')
    if (submitAction === 'publish') {
      await usePostStore.getState().publish(post.id)
    }
    navigate(postDetail(post.id))
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#2d1838]">

      {/* Progress bar — visible only during submission */}
      {isSubmitting && (
        <div className="fixed inset-x-0 top-0 z-[100] h-[3px] bg-[#2d1838]/10">
          <div className="h-full bg-[#55bde0] animate-[progress_1.6s_ease-in-out_infinite]"
            style={{ animation: 'progress 1.6s ease-in-out infinite' }}
          />
          <style>{`@keyframes progress { 0%{width:0%;margin-left:0} 50%{width:70%;margin-left:15%} 100%{width:0%;margin-left:100%} }`}</style>
        </div>
      )}

      <div className="mx-auto w-full max-w-[900px] px-4 pb-20 pt-16 sm:px-8">
        <button
          onClick={() => navigate(ROUTES.POSTS)}
          disabled={isSubmitting}
          className="mb-9 inline-flex items-center gap-3 text-sm font-bold text-[#6f6a76] transition hover:text-[#2d1838] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={16} />
          {t('createPost.backToDirectory')}
        </button>

        <div className="mb-12">
          <div className="mb-5 inline-flex rounded-full border border-[#cfd3dc] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#6f6a76]">
            07&nbsp;&nbsp;New Post
          </div>
          <h1 className="font-headline text-4xl font-black leading-tight tracking-normal text-[#2d1838] sm:text-6xl">
            {t('createPost.heading')}
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-[#4f4a58] sm:text-lg">
            {t('createPost.desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* fieldset disabled freezes all inputs/selects/textareas during submit */}
          <fieldset disabled={isSubmitting} className="min-w-0 border-0 p-0 m-0">
            <PostFormFields register={register} control={control} setValue={setValue} errors={errors} minDateStr={minDateStr} />
          </fieldset>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSubmitAction('draft')}
              className="h-14 rounded-full border border-[#2d1838] bg-white px-9 text-sm font-black text-[#2d1838] transition hover:bg-[#2d1838] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && submitAction === 'draft' ? t('createPost.savingDraft') : t('createPost.saveDraft')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSubmitAction('publish')}
              className="inline-flex h-14 min-w-[250px] items-center justify-center gap-3 rounded-full bg-[#2d1838] px-9 text-sm font-black text-white shadow-[0_18px_42px_-28px_rgba(45,24,56,0.9)] transition hover:bg-[#1c1024] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && submitAction === 'publish'
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('createPost.publishing')}</>
                : <>{t('createPost.publish')} <ArrowRight size={17} /></>
              }
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
