import { createBrowserRouter, RouterProvider } from 'react-router';
import { Layout } from './Layout';
import { Home } from '../pages/Home';
import { Contents } from '../pages/Contents';
import { TopicPage } from '../pages/TopicPage';
import { NotFound } from '../pages/NotFound';

/* The curriculum pages load with the app; the rest are split into their own chunks and fetched on first visit. */
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/learn', element: <Contents /> },
      { path: '/learn/:id', element: <TopicPage /> },
      { path: '/patterns', lazy: async () => ({ Component: (await import('../pages/Patterns')).PatternsIndex }) },
      { path: '/patterns/:id', lazy: async () => ({ Component: (await import('../pages/Patterns')).PatternPage }) },
      { path: '/assess', lazy: async () => ({ Component: (await import('../pages/Assess')).Assess }) },
      { path: '/progress', lazy: async () => ({ Component: (await import('../pages/Progress')).Progress }) },
      { path: '/account', lazy: async () => ({ Component: (await import('../pages/Account')).Account }) },
      { path: '/privacy', lazy: async () => ({ Component: (await import('../pages/Legal')).Privacy }) },
      { path: '/about', lazy: async () => ({ Component: (await import('../pages/Legal')).About }) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
