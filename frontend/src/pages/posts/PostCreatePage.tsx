import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { postCreateSchema, type PostCreateFormData } from '../../utils/validators'
import PageWrapper from '../../components/layout/PageWrapper'
import PostFormFields from '../../components/posts/PostFormFields'
import { postDetail, ROUTES } from '../../constants/routes'

export default function PostCreatePage() {
  const { user } = useAuthStore()
  const { create } = usePostStore()
  const navigate = useNavigate()
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish'>('draft')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { confidentiality: 'public_pitch', projectStage: 'idea' },
  })

  const onSubmit = (data: PostCreateFormData) => {
    if (!user) return
    const role = user.role === 'admin' ? 'engineer' : user.role
    const post = create(data, user.id, user.name, role as 'engineer' | 'healthcare_professional')
    if (submitAction === 'publish') {
      usePostStore.getState().publish(post.id)
    }
    navigate(postDetail(post.id))
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <PageWrapper maxWidth={840}>
      {/* Back link */}
      <button
        onClick={() => navigate(ROUTES.POSTS)}
        className="inline-flex items-center gap-2 mb-6 text-[11px] font-mono tracking-[0.14em] uppercase font-bold text-neutral-500 hover:text-hai-plum transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Directory
      </button>

      {/* Intro card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.15)] p-6 md:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, #D2FF74 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
            <span className="text-hai-plum/70">07</span>
            <span>New Post</span>
          </div>
          <h1 className="font-headline font-bold text-[36px] md:text-[48px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-3">
            Post a collaboration<br />
            <span className="text-hai-teal">opportunity<span className="text-hai-plum">.</span></span>
          </h1>
          <p className="text-[15px] md:text-base text-neutral-600 leading-relaxed max-w-xl font-body">
            Connect with the right partner across engineering and healthcare. No file uploads — details are shared in meetings under NDA.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <PostFormFields register={register} errors={errors} minDateStr={minDateStr} />

        {/* Action row */}
        <div className="mt-10 bg-white rounded-[2rem] border border-neutral-100 p-5 md:p-6 flex flex-col sm:flex-row gap-3 sticky bottom-4 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)]">
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSubmitAction('draft')}
            className="flex-1 py-3.5 rounded-full border-2 border-hai-plum bg-white text-hai-plum font-bold text-[15px] hover:bg-hai-plum hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Save as draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSubmitAction('publish')}
            className="flex-[2] py-3.5 rounded-full bg-hai-plum text-white font-bold text-[15px] hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                Publish post
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>
    </PageWrapper>
  )
}
