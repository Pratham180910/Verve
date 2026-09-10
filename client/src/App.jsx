import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminMembers from './pages/AdminMembers';
import AdminProjects from './pages/AdminProjects';
import AdminTeams from './pages/AdminTeams';
import AdminTasks from './pages/AdminTasks';
import AdminActivity from './pages/AdminActivity';
import AdminSettings from './pages/AdminSettings';
import ProjectLeadDashboard from './pages/ProjectLeadDashboard';
import MemberDashboard from './pages/MemberDashboard';

function Main() {
  const { user, loading } = useAuth();
  const [adminPage, setAdminPage] = useState('Home'); // 'Home' | 'Members' | 'Projects' | 'Teams' | 'Tasks' | 'Activity' | 'Settings'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // 1. ADMIN Routing
  if (user.role === 'ADMIN') {
    if (adminPage === 'Members') {
      return <AdminMembers onNavigate={setAdminPage} />;
    }
    if (adminPage === 'Projects') {
      return <AdminProjects onNavigate={setAdminPage} />;
    }
    if (adminPage === 'Teams') {
      return <AdminTeams onNavigate={setAdminPage} />;
    }
    if (adminPage === 'Tasks') {
      return <AdminTasks onNavigate={setAdminPage} />;
    }
    if (adminPage === 'Activity') {
      return <AdminActivity onNavigate={setAdminPage} />;
    }
    if (adminPage === 'Settings') {
      return <AdminSettings onNavigate={setAdminPage} />;
    }
    return <AdminDashboard onNavigate={setAdminPage} />;
  }

  // 2. PROJECT LEAD Routing
  if (user.role === 'PROJECT_LEAD') {
    return <ProjectLeadDashboard />;
  }

  // 3. MEMBER Routing
  if (user.role === 'MEMBER') {
    return <MemberDashboard />;
  }

  return <Login />;
}


export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
