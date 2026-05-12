import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import UserDashboard from './components/Dashboard/UserDashboard';
import DriverDashboard from './components/Dashboard/DriverDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner w-12 h-12"></div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" />;
    }
    
    return children;
};

function AppContent() {
    const { user } = useAuth();
    
    const getDashboard = () => {
        if (!user) return <Navigate to="/login" />;
        switch(user.role) {
            case 'admin':
                return <AdminDashboard />;
            case 'driver':
                return <DriverDashboard />;
            default:
                return <UserDashboard />;
        }
    };
    
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/user" element={
                    <PrivateRoute allowedRoles={['user']}>
                        <UserDashboard />
                    </PrivateRoute>
                } />
                <Route path="/driver" element={
                    <PrivateRoute allowedRoles={['driver']}>
                        <DriverDashboard />
                    </PrivateRoute>
                } />
                <Route path="/admin" element={
                    <PrivateRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </PrivateRoute>
                } />
                <Route path="/" element={getDashboard()} />
            </Routes>
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;