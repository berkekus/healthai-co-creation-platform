import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useBlocker } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { postCreateSchema, type PostCreateFormData } from '../../utils/validators'
import PostFormFields from '../../components/posts/PostFormFields'
import { postDetail, ROUTES } from '../../constants/routes'

export default function PostCreatePage() {
  const { user } = useAuthStore()
  const { create } = usePostStore()
  const navigate = useNavigate()
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish'>('draft')

  const { register, control, setValue, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { confidentiality: 'public_pitch', projectStage: 'idea' },
  })

  // Block navigation when the form has unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname,
  )

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

      {/* Unsaved-changes confirmation dialog */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] rounded-[24px] bg-white p-8 shadow-[0_32px_80px_-20px_rgba(45,24,56,0.35)]">
            <h2 className="font-headline text-xl font-black text-[#2d1838]">Leave without saving?</h2>
            <p className="mt-3 text-sm font-semibold text-[#6f6a76] leading-6">
              You have unsaved changes. If you leave now, your progress will be lost.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => blocker.reset()}
                className="flex-1 h-12 rounded-full border border-[#d5dae0] bg-white text-sm font-black text-[#2d1838] transition hover:border-[#55bde0]"
              >
                Keep editing
              </button>
              <button
                onClick={() => blocker.proceed()}
                className="flex-1 h-12 rounded-full bg-[#2d1838] text-sm font-black text-white transition hover:bg-[#1c1024]"
              >
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}

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
          Back to directory
        </button>

        <div className="mb-12">
          <div className="mb-5 inline-flex rounded-full border border-[#cfd3dc] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#6f6a76]">
            07&nbsp;&nbsp;New Post
          </div>
          <h1 className="font-headline text-4xl font-black leading-tight tracking-normal text-[#2d1838] sm:text-6xl">
            Post a collaboration <span className="text-[#55bde0]">opportunity.</span>
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-[#4f4a58] sm:text-lg">
            Connect with the right partner across engineering and healthcare.<br />
            No file uploads — details are shared in meetings under NDA.
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
              {isSubmitting && submitAction === 'draft' ? 'Saving draft…' : 'Save as draft'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSubmitAction('publish')}
              className="inline-flex h-14 min-w-[250px] items-center justify-center gap-3 rounded-full bg-[#2d1838] px-9 text-sm font-black text-white shadow-[0_18px_42px_-28px_rgba(45,24,56,0.9)] transition hover:bg-[#1c1024] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && submitAction === 'publish'
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing…</>
                : <>Review &amp; publish <ArrowRight size={17} /></>
              }
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
