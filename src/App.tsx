import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TeacherHome from './pages/TeacherHome'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentJoin from './pages/StudentJoin'
import SetupScreen from './pages/SetupScreen'
import { supabaseConfigured } from './lib/supabase'
import './App.css'
import './ui-polish.css'

function App() {
  if (!supabaseConfigured) return <SetupScreen />
  return <BrowserRouter><Routes><Route path="/" element={<TeacherHome />}/><Route path="/teacher/:id" element={<TeacherDashboard />}/><Route path="/join/:code" element={<StudentJoin />}/><Route path="*" element={<TeacherHome />}/></Routes></BrowserRouter>
}

export default App
