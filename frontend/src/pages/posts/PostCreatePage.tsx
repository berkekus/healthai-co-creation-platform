import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
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
      <div className="mx-auto w-full max-w-[900px] px-4 pb-20 pt-16 sm:px-8">
        <button
          onClick={() => navigate(ROUTES.POSTS)}
          className="mb-9 inline-flex items-center gap-3 text-sm font-bold text-[#6f6a76] transition hover:text-[#2d1838]"
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
          <PostFormFields register={register} control={control} setValue={setValue} errors={errors} minDateStr={minDateStr} />

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSubmitAction('draft')}
              className="h-14 rounded-full border border-[#2d1838] bg-white px-9 text-sm font-black text-[#2d1838] transition hover:bg-[#2d1838] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save as draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSubmitAction('publish')}
              className="inline-flex h-14 min-w-[250px] items-center justify-center gap-3 rounded-full bg-[#2d1838] px-9 text-sm font-black text-white shadow-[0_18px_42px_-28px_rgba(45,24,56,0.9)] transition hover:bg-[#1c1024] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Publishing...' : 'Review & publish'}
              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
