import { createBrowserRouter, RouterProvider } from 'react-router';
import { Layout } from './Layout';
import { Home } from '../pages/Home';
import { Contents } from '../pages/Contents';
import { TopicPage } from '../pages/TopicPage';
import { Progress } from '../pages/Progress';
import { Account } from '../pages/Account';
import { About, Privacy } from '../pages/Legal';
import { NotFound } from '../pages/NotFound';
import { Soon } from '../pages/Soon';
import { PatternsIndex, PatternPage } from '../pages/Patterns';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/learn', element: <Contents /> },
      { path: '/learn/:id', element: <TopicPage /> },
      { path: '/patterns', element: <PatternsIndex /> },
      { path: '/patterns/:id', element: <PatternPage /> },
      { path: '/assess', element: <Soon title="Assessments" /> },
      { path: '/progress', element: <Progress /> },
      { path: '/account', element: <Account /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
