import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TeacherHome from './pages/TeacherHome'
import TeacherDashboard from './pages/TeacherDashboard'
import JoinLab from './pages/JoinLab'
import ClassificationLab from './pages/ClassificationLab'
import ClusteringLab from './pages/ClusteringLab'
import SetupScreen from './pages/SetupScreen'
import { supabaseConfigured } from './lib/supabase'
import './App.css'
import './ui-polish.css'

function App() {
  if (!supabaseConfigured) return <SetupScreen />
  return <BrowserRouter><Routes><Route path="/" element={<TeacherHome />}/><Route path="/teacher/:id" element={<TeacherDashboard />}/><Route path="/classification/:id" element={<ClassificationLab />}/><Route path="/clustering/:id" element={<ClusteringLab />}/><Route path="/join/:code" element={<JoinLab />}/><Route path="*" element={<TeacherHome />}/></Routes></BrowserRouter>
}

export default App
