import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AboutPage } from '../pages/AboutPage'
import { AccountEntryPage } from '../pages/AccountEntryPage'
import { AdminSoilTestsPage } from '../pages/AdminSoilTestsPage'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { CropCatalogPage } from '../pages/CropCatalogPage'
import { CropDetailsPage } from '../pages/CropDetailsPage'
import { CropFormPage } from '../pages/CropFormPage'
import { CropManagementPage } from '../pages/CropManagementPage'
import { DashboardPlaceholderPage } from '../pages/DashboardPlaceholderPage'
import { FarmDetailsPage } from '../pages/FarmDetailsPage'
import { FarmFormPage } from '../pages/FarmFormPage'
import { FarmListPage } from '../pages/FarmListPage'
import { FarmerDashboardPage } from '../pages/FarmerDashboardPage'
import { FarmerSoilTestsPage } from '../pages/FarmerSoilTestsPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { PublicPlaceholderPage } from '../pages/PublicPlaceholderPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { ExpertSoilTestsPage } from '../pages/ExpertSoilTestsPage'
import { SoilTestDetailsPage } from '../pages/SoilTestDetailsPage'
import { SoilTestFormPage } from '../pages/SoilTestFormPage'
import { SuperadminUsersPage } from '../pages/SuperadminUsersPage'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'crops', element: <CropCatalogPage /> },
      { path: 'crops/:cropId', element: <CropDetailsPage /> },
      { path: 'login', element: <AccountEntryPage mode="login" /> },
      { path: 'register', element: <AccountEntryPage mode="register" /> },
      { path: 'forgot-password', element: <AccountEntryPage mode="forgot-password" /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'weather',
        element: (
          <PublicPlaceholderPage
            title="Weather information"
            description="A public entry point for location-based weather information."
          />
        ),
      },
      {
        path: 'markets/prices',
        element: (
          <PublicPlaceholderPage
            title="Market prices"
            description="A public entry point for agricultural market-price information."
          />
        ),
      },
      { path: 'access-denied', element: <AccessDeniedPage /> },
      { path: 'not-found', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/farmer',
    element: (
      <ProtectedRoute role="farmer">
        <DashboardLayout role="farmer" />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <FarmerDashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'farms', element: <FarmListPage /> },
      { path: 'farms/new', element: <FarmFormPage /> },
      { path: 'farms/:farmId/edit', element: <FarmFormPage /> },
      { path: 'farms/:farmId', element: <FarmDetailsPage /> },
      { path: 'crops', element: <CropCatalogPage embedded /> },
      { path: 'soil-tests', element: <FarmerSoilTestsPage /> },
      { path: 'soil-tests/new', element: <SoilTestFormPage /> },
      { path: 'soil-tests/:soilTestId', element: <SoilTestDetailsPage /> },
      { path: '*', element: <DashboardPlaceholderPage role="farmer" /> },
    ],
  },
  {
    path: '/expert',
    element: (
      <ProtectedRoute role="expert">
        <DashboardLayout role="expert" />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPlaceholderPage role="expert" /> },
      { path: 'soil-tests', element: <ExpertSoilTestsPage /> },
      { path: 'soil-tests/:soilTestId', element: <SoilTestDetailsPage /> },
      { path: '*', element: <DashboardPlaceholderPage role="expert" /> },
    ],
  },
  {
    path: '/data',
    element: (
      <ProtectedRoute role="dataManager">
        <DashboardLayout role="dataManager" />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPlaceholderPage role="dataManager" /> },
      { path: '*', element: <DashboardPlaceholderPage role="dataManager" /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute role="admin">
        <DashboardLayout role="admin" />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPlaceholderPage role="admin" /> },
      { path: 'crops', element: <CropManagementPage /> },
      { path: 'crops/new', element: <CropFormPage /> },
      { path: 'crops/:cropId/edit', element: <CropFormPage /> },
      { path: 'soil-tests', element: <AdminSoilTestsPage /> },
      { path: 'soil-tests/:soilTestId', element: <SoilTestDetailsPage /> },
      { path: '*', element: <DashboardPlaceholderPage role="admin" /> },
    ],
  },
  {
    path: '/superadmin',
    element: (
      <ProtectedRoute role="superadmin">
        <DashboardLayout role="superadmin" />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPlaceholderPage role="superadmin" /> },
      { path: 'users', element: <SuperadminUsersPage /> },
      { path: '*', element: <DashboardPlaceholderPage role="superadmin" /> },
    ],
  },
])
