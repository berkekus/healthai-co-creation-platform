import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import AppLayout from '../components/layout/AppLayout'
import LandingShell from '../components/layout/LandingShell'
import ProtectedRoute from './ProtectedRoute'

import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import PostListPage from '../pages/posts/PostListPage'
import PostDetailPage from '../pages/posts/PostDetailPage'
import PostCreatePage from '../pages/posts/PostCreatePage'
import PostEditPage from '../pages/posts/PostEditPage'
import MeetingsPage from '../pages/meetings/MeetingsPage'
import ProfilePage from '../pages/profile/ProfilePage'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import AdminPage from '../pages/admin/AdminPage'
import PrivacyPage from '../pages/errors/PrivacyPage'
import NotFoundPage from '../pages/errors/NotFoundPage'
import UnauthorizedPage from '../pages/errors/UnauthorizedPage'

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Landing — dedicated shell (its own nav + footer live inside the page) */}
        <Route element={<LandingShell />}>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
        </Route>

        <Route element={<AppLayout />}>
          {/* Public */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />
          <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

          {/* Protected — any authenticated user */}
          <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path={ROUTES.POSTS} element={<ProtectedRoute><PostListPage /></ProtectedRoute>} />
          <Route path={ROUTES.POST_DETAIL} element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
          <Route path={ROUTES.POST_CREATE} element={<ProtectedRoute><PostCreatePage /></ProtectedRoute>} />
          <Route path={ROUTES.POST_EDIT} element={<ProtectedRoute><PostEditPage /></ProtectedRoute>} />
          <Route path={ROUTES.MEETINGS} element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
          <Route path={ROUTES.PROFILE} element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path={ROUTES.NOTIFICATIONS} element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path={ROUTES.ADMIN} element={
            <ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
