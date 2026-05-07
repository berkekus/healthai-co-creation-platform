import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { postCreateSchema, type PostCreateFormData } from '../../utils/validators'
import PostFormFields from '../../components/posts/PostFormFields'
import PostStatusBadge from '../../components/posts/PostStatusBadge'
import { ROUTES, postDetail } from '../../constants/routes'

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>()
  const { getById, update } = usePostStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const post = getById(id ?? '')

  const { register, control, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostCreateFormData>({
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
    } : { confidentiality: 'public_pitch', projectStage: 'idea' },
  })

  if (!post) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] text-[#2d1838]">
        <div className="mx-auto flex min-h-screen max-w-[640px] items-center justify-center px-8">
          <div className="w-full rounded-[16px] border border-[#e1e4ea] bg-white p-10 text-center shadow-[0_24px_70px_-58px_rgba(45,24,56,0.55)]">
            <h1 className="font-headline text-[28px] font-black text-[#2d1838]">Post not found</h1>
            <p className="mt-3 text-[14px] font-semibold text-[#6f6a76]">This post doesn't exist or you don't have access.</p>
            <button
              onClick={() => navigate(ROUTES.POSTS)}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#2d1838] px-7 text-[13px] font-black text-white transition hover:bg-[#1c1024]"
            >
              <ArrowLeft size={15} />
              Back to directory
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (user?.id !== post.authorId) {
    navigate(ROUTES.UNAUTHORIZED)
    return null
  }

  const onSubmit = async (data: PostCreateFormData) => {
    await update(id!, data)
    navigate(postDetail(id!))
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#2d1838]">
      <div className="mx-auto w-full max-w-[900px] px-4 pb-20 pt-16 sm:px-8">
        <button
          onClick={() => navigate(postDetail(id!))}
          className="mb-9 inline-flex items-center gap-3 text-[14px] font-bold text-[#6f6a76] transition hover:text-[#2d1838]"
        >
          <ArrowLeft size={16} />
          Back to post
        </button>

        <div className="mb-12">
          <div className="mb-5 flex items-center gap-4">
            <div className="inline-flex rounded-full border border-[#cfd3dc] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#6f6a76]">
              08&nbsp;&nbsp;Edit Post
            </div>
            <PostStatusBadge status={post.status} size="sm" />
          </div>
          <h1 className="font-headline text-[40px] font-black leading-[1.02] tracking-normal text-[#2d1838] sm:text-[52px]">
            Edit collaboration <span className="text-[#55bde0]">post.</span>
          </h1>
          <p className="mt-5 text-[16px] font-semibold leading-8 text-[#4f4a58] sm:text-[17px]">
            Update the details below to keep your post accurate and relevant.<br />
            Changes go live immediately for active posts.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <PostFormFields register={register} control={control} setValue={setValue} errors={errors} minDateStr={minDateStr} />

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate(postDetail(id!))}
              className="h-14 rounded-full border border-[#2d1838] bg-white px-9 text-[14px] font-black text-[#2d1838] transition hover:bg-[#2d1838] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-14 min-w-[250px] items-center justify-center gap-3 rounded-full bg-[#2d1838] px-9 text-[14px] font-black text-white shadow-[0_18px_42px_-28px_rgba(45,24,56,0.9)] transition hover:bg-[#1c1024] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
