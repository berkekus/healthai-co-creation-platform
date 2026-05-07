import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import AppLayout from '../components/layout/AppLayout'
import LandingShell from '../components/layout/LandingShell'
import ProtectedRoute from './ProtectedRoute'

// Critical path — eager load
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import VerifyEmailPage from '../pages/auth/VerifyEmailPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'

// Lazy load — authenticated / large pages
const DashboardPage      = lazy(() => import('../pages/dashboard/DashboardPage'))
const PostListPage       = lazy(() => import('../pages/posts/PostListPage'))
const PostDetailPage     = lazy(() => import('../pages/posts/PostDetailPage'))
const PostCreatePage     = lazy(() => import('../pages/posts/PostCreatePage'))
const PostEditPage       = lazy(() => import('../pages/posts/PostEditPage'))
const MeetingsPage       = lazy(() => import('../pages/meetings/MeetingsPage'))
const ProfilePage        = lazy(() => import('../pages/profile/ProfilePage'))
const PublicProfilePage  = lazy(() => import('../pages/profile/PublicProfilePage'))
const NotificationsPage  = lazy(() => import('../pages/notifications/NotificationsPage'))
const ConversationsPage  = lazy(() => import('../pages/messages/ConversationsPage'))
const ConversationPage   = lazy(() => import('../pages/messages/ConversationPage'))
const AdminPage          = lazy(() => import('../pages/admin/AdminPage'))
const PrivacyPage        = lazy(() => import('../pages/errors/PrivacyPage'))
const NotFoundPage       = lazy(() => import('../pages/errors/NotFoundPage'))
const UnauthorizedPage   = lazy(() => import('../pages/errors/UnauthorizedPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-hai-plum/20 border-t-hai-plum rounded-full animate-spin" />
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing — dedicated shell */}
          <Route element={<LandingShell />}>
            <Route path={ROUTES.HOME} element={<LandingPage />} />
          </Route>

          <Route element={<AppLayout />}>
            {/* Public */}
            <Route path={ROUTES.LOGIN}            element={<LoginPage />} />
            <Route path={ROUTES.REGISTER}         element={<RegisterPage />} />
            <Route path={ROUTES.VERIFY_EMAIL}     element={<VerifyEmailPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD}  element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD}   element={<ResetPasswordPage />} />
            <Route path={ROUTES.PRIVACY}      element={<PrivacyPage />} />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
            <Route path={ROUTES.NOT_FOUND}    element={<NotFoundPage />} />

            {/* Protected — any authenticated user */}
            <Route path={ROUTES.DASHBOARD}    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path={ROUTES.POSTS}        element={<ProtectedRoute><PostListPage /></ProtectedRoute>} />
            <Route path={ROUTES.POST_DETAIL}  element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
            <Route path={ROUTES.POST_CREATE}  element={<ProtectedRoute><PostCreatePage /></ProtectedRoute>} />
            <Route path={ROUTES.POST_EDIT}    element={<ProtectedRoute><PostEditPage /></ProtectedRoute>} />
            <Route path={ROUTES.MEETINGS}     element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
            <Route path={ROUTES.PROFILE}         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path={ROUTES.PUBLIC_PROFILE}  element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
            <Route path={ROUTES.NOTIFICATIONS} element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path={ROUTES.MESSAGES}      element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
            <Route path={ROUTES.CONVERSATION}  element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />

            {/* Admin only */}
            <Route path={ROUTES.ADMIN} element={
              <ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
