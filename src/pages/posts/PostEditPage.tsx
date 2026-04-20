import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { postCreateSchema, type PostCreateFormData } from '../../utils/validators'
import PageWrapper from '../../components/layout/PageWrapper'
import PostFormFields from '../../components/posts/PostFormFields'
import PostStatusBadge from '../../components/posts/PostStatusBadge'
import { ROUTES, postDetail } from '../../constants/routes'

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>()
  const { getById, update } = usePostStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const post = getById(id ?? '')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: post ? {
      title:             post.title,
      domain:            post.domain,
      expertiseRequired: post.expertiseRequired,
      description:       post.description,
      projectStage:      post.projectStage,
      collaborationType: post.collaborationType,
      confidentiality:   post.confidentiality,
      city:              post.city,
      country:           post.country,
      expiryDate:        post.expiryDate,
    } : {},
  })

  if (!post) {
    return (
      <PageWrapper maxWidth={720}>
        <div className="bg-white rounded-[2rem] border border-neutral-100 p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hai-mint/40 mb-4">
            <span className="material-symbols-outlined text-hai-plum text-[32px]">search_off</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-hai-plum mb-2">Post not found</h1>
          <button
            onClick={() => navigate(ROUTES.POSTS)}
            className="mt-4 inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to directory
          </button>
        </div>
      </PageWrapper>
    )
  }

  if (user?.id !== post.authorId) {
    navigate(ROUTES.UNAUTHORIZED)
    return null
  }

  const onSubmit = (data: PostCreateFormData) => {
    update(id!, data)
    navigate(postDetail(id!))
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <PageWrapper maxWidth={840}>
      {/* Back link */}
      <button
        onClick={() => navigate(postDetail(id!))}
        className="inline-flex items-center gap-2 mb-6 text-[11px] font-mono tracking-[0.14em] uppercase font-bold text-neutral-500 hover:text-hai-plum transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to post
      </button>

      {/* Intro card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.15)] p-6 md:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
              <span className="text-hai-plum/70">08</span>
              <span>Edit Post</span>
            </div>
            <h1 className="font-headline font-bold text-[36px] md:text-[48px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-2">
              Edit collaboration<br />
              <span className="text-hai-teal">post<span className="text-hai-plum">.</span></span>
            </h1>
            <p className="text-[14px] text-neutral-600 leading-relaxed font-body">
              Changes go live immediately for active posts.
            </p>
          </div>
          <PostStatusBadge status={post.status} size="lg" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <PostFormFields register={register} errors={errors} minDateStr={minDateStr} />

        {/* Action row */}
        <div className="mt-10 bg-white rounded-[2rem] border border-neutral-100 p-5 md:p-6 flex flex-col sm:flex-row gap-3 sticky bottom-4 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)]">
          <button
            type="button"
            onClick={() => navigate(postDetail(id!))}
            className="flex-1 py-3.5 rounded-full border border-neutral-300 bg-white text-neutral-800 font-semibold text-[15px] hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-3.5 rounded-full bg-hai-plum text-white font-bold text-[15px] hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Save changes
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>
    </PageWrapper>
  )
}
