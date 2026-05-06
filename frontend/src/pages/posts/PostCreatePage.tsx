import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { postCreateSchema, type PostCreateFormData } from '../../utils/validators'
import PostFormFields from '../../components/posts/PostFormFields'
import { postDetail, ROUTES } from '../../constants/routes'

const progress = [
  ['Basics', 'Title and domain'],
  ['What you need', 'Expertise and details'],
  ['Collaboration', 'Stage and confidentiality'],
  ['Where & when', 'Location and timeline'],
  ['Review & publish', 'Review before posting'],
]

export default function PostCreatePage() {
  const { user } = useAuthStore()
  const { create } = usePostStore()
  const navigate = useNavigate()
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish'>('draft')

  const { register, control, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { confidentiality: 'public_pitch', projectStage: 'idea' },
  })

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
      <div className="mx-auto grid w-full max-w-[1640px] grid-cols-1 gap-16 px-8 pb-20 pt-16 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside>
          <button
            onClick={() => navigate(ROUTES.POSTS)}
            className="mb-9 inline-flex items-center gap-3 text-[14px] font-bold text-[#6f6a76] transition hover:text-[#2d1838]"
          >
            <ArrowLeft size={16} />
            Back to directory
          </button>

          <div className="rounded-[10px] border border-[#e1e4ea] bg-white p-7 shadow-[0_24px_70px_-58px_rgba(45,24,56,0.55)]">
            <h2 className="text-[18px] font-black text-[#2d1838]">Post progress</h2>
            <p className="mt-3 text-[13px] font-semibold leading-6 text-[#6f6a76]">
              These sections help you create a clear and effective post.
            </p>

            <div className="mt-7 space-y-6">
              {progress.map(([title, subtitle], index) => {
                const active = index === 0
                return (
                  <div key={title} className={`relative flex gap-4 rounded-[10px] px-3 py-3 ${active ? 'bg-[#eefaff]' : ''}`}>
                    {index < progress.length - 1 && (
                      <span className="absolute left-[23px] top-12 h-12 w-px bg-[#e1e4ea]" />
                    )}
                    <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${active ? 'bg-[#66c8e7] text-white' : 'bg-[#f0f1f4] text-[#2d1838]'}`}>
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-[13px] font-black text-[#2d1838]">{title}</span>
                      <span className="mt-1 block text-[12px] font-semibold text-[#6f6a76]">{subtitle}</span>
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-10 border-t border-[#e7e7ec] pt-6">
              <div className="flex gap-3 text-[12px] font-semibold leading-5 text-[#6f6a76]">
                <Info size={14} className="mt-0.5 shrink-0 text-[#66c8e7]" />
                You can navigate freely. All changes are saved as you go.
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-12">
            <div className="mb-5 inline-flex rounded-full border border-[#cfd3dc] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#6f6a76]">
              07&nbsp;&nbsp;New Post
            </div>
            <h1 className="font-headline text-[52px] font-black leading-[1.02] tracking-normal text-[#2d1838]">
              Post a collaboration <span className="text-[#55bde0]">opportunity.</span>
            </h1>
            <p className="mt-5 max-w-[760px] text-[17px] font-semibold leading-8 text-[#4f4a58]">
              Connect with the right partner across engineering and healthcare.<br />
              No file uploads - details are shared in meetings under NDA.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <PostFormFields register={register} control={control} setValue={setValue} errors={errors} minDateStr={minDateStr} />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={() => setSubmitAction('draft')}
                className="h-14 rounded-full border border-[#2d1838] bg-white px-9 text-[14px] font-black text-[#2d1838] transition hover:bg-[#2d1838] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save as draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={() => setSubmitAction('publish')}
                className="inline-flex h-14 min-w-[250px] items-center justify-center gap-3 rounded-full bg-[#2d1838] px-9 text-[14px] font-black text-white shadow-[0_18px_42px_-28px_rgba(45,24,56,0.9)] transition hover:bg-[#1c1024] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Publishing...' : 'Review & publish'}
                {!isSubmitting && <ArrowRight size={17} />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
