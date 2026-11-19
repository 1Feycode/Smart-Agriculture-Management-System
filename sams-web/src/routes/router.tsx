import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AboutPage } from '../pages/AboutPage'
import { AccountEntryPage } from '../pages/AccountEntryPage'
import { CropInformationPage } from '../pages/CropInformationPage'
import { DashboardPlaceholderPage } from '../pages/DashboardPlaceholderPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PublicPlaceholderPage } from '../pages/PublicPlaceholderPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'crops', element: <CropInformationPage /> },
      { path: 'login', element: <AccountEntryPage mode="login" /> },
      { path: 'register', element: <AccountEntryPage mode="register" /> },
      { path: 'forgot-password', element: <AccountEntryPage mode="forgot-password" /> },
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
      { path: 'access-denied', element: <PublicPlaceholderPage title="Access denied" description="This route is reserved for a future access experience." /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/farmer',
    element: <DashboardLayout role="farmer" />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPlaceholderPage role="farmer" /> },
      { path: '*', element: <DashboardPlaceholderPage role="farmer" /> },
    ],
  },
  {
    path: '/expert',
    element: <DashboardLayout role="expert" />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPlaceholderPage role="expert" /> },
      { path: '*', element: <DashboardPlaceholderPage role="expert" /> },
    ],
  },
  {
    path: '/data',
    element: <DashboardLayout role="data-manager" />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPlaceholderPage role="data-manager" /> },
      { path: '*', element: <DashboardPlaceholderPage role="data-manager" /> },
    ],
  },
  {
    path: '/admin',
    element: <DashboardLayout role="administrator" />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPlaceholderPage role="administrator" /> },
      { path: '*', element: <DashboardPlaceholderPage role="administrator" /> },
    ],
  },
])
