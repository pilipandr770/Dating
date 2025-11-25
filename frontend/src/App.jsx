import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EditProfile from './pages/EditProfile'
import Discover from './pages/Discover'
import DiscoverCategories from './pages/DiscoverCategories'
import Matches from './pages/Matches'
import Likes from './pages/Likes'
import ChatRoom from './pages/ChatRoom'
import AdminPanel from './pages/AdminPanel'
import ProviderSettings from './pages/ProviderSettings'
import ProviderDashboard from './pages/ProviderDashboard'
import Bookings from './pages/Bookings'
import TestPayment from './pages/TestPayment'
import ProfileView from './pages/ProfileView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/discover/categories" element={<DiscoverCategories />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/likes" element={<Likes />} />
        <Route path="/chat/:matchId" element={<ChatRoom />} />
        <Route path="/profile/:userId" element={<ProfileView />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/provider/settings" element={<ProviderSettings />} />
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/test-payment" element={<TestPayment />} />
      </Routes>
    </BrowserRouter>
  )
}
