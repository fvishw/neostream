import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Channel from './pages/Channel';
import Playlists from './pages/Playlists';
import History from './pages/History';
import WatchLater from './pages/WatchLater';
import Shorts from './pages/Shorts';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/channel/:userId" element={<Channel />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/history" element={<History />} />
        <Route path="/watch-later" element={<WatchLater />} />
        <Route path="/shorts" element={<Shorts />} />
      </Routes>
    </Layout>
  );
}
