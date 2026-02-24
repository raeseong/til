import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PostsPage from './pages/PostsPage';
import PostDetailPage from './pages/PostDetailPage';
import ArchitecturePage from './pages/ArchitecturePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:slug" element={<PostDetailPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
      </Routes>
    </Layout>
  );
}
