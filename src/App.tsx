import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import ChapterView from './pages/ChapterView';
import TopicView from './pages/TopicView';
import Practice from './pages/Practice';
import PythonLab from './pages/PythonLab';
import MockTests from './pages/MockTests';
import Revision from './pages/Revision';
import Progress from './pages/Progress';
import Bookmarks from './pages/Bookmarks';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="learn" element={<Learn />} />
        <Route path="learn/:chapterId" element={<ChapterView />} />
        <Route path="learn/:chapterId/:topicId" element={<TopicView />} />
        <Route path="practice" element={<Practice />} />
        <Route path="lab" element={<PythonLab />} />
        <Route path="mocks" element={<MockTests />} />
        <Route path="revision" element={<Revision />} />
        <Route path="progress" element={<Progress />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
