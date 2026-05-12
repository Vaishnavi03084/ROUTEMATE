import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        
        if (result.success) {
            // Redirect based on role
            if (result.user.role === 'admin') {
                navigate('/admin');
            } else if (result.user.role === 'driver') {
                navigate('/driver');
            } else {
                navigate('/user');
            }
        }
    };

    const roles = [
        { id: 'user', label: 'Passenger', icon: '👤', color: 'blue', description: 'Book rides & save money' },
        { id: 'driver', label: 'Driver', icon: '🚗', color: 'green', description: 'Earn money by driving' },
        { id: 'admin', label: 'Admin', icon: '👑', color: 'purple', description: 'Manage system & users' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10"
            >
                <div className="text-center">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
                    >
                        <span className="text-4xl">🚗</span>
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white">Welcome to RouteMate</h2>
                    <p className="mt-2 text-gray-300">Smart ride pooling for everyone</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-white/20 border border-gray-300 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-white/20 border border-gray-300 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">Login As</label>
                        <div className="grid grid-cols-3 gap-3">
                            {roles.map((role) => (
                                <motion.button
                                    key={role.id}
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`p-3 rounded-lg text-center transition-all ${
                                        selectedRole === role.id
                                            ? `bg-${role.color}-600 text-white ring-2 ring-${role.color}-400`
                                            : 'bg-white/20 text-gray-300 hover:bg-white/30'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{role.icon}</div>
                                    <div className="text-sm font-semibold">{role.label}</div>
                                </motion.button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Note: Use appropriate account credentials for each role
                        </p>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                    >
                        {loading ? (
                            <div className="spinner w-5 h-5"></div>
                        ) : (
                            `Sign in as ${roles.find(r => r.id === selectedRole)?.label}`
                        )}
                    </motion.button>

                    <div className="text-center">
                        <p className="text-sm text-gray-300">
                            Don't have an account?{' '}
                            <a href="/register" className="font-medium text-blue-400 hover:text-blue-300">
                                Sign up
                            </a>
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                        <p className="text-xs text-gray-400 text-center">
                            Demo Credentials:<br/>
                            Admin: admin@routemate.com / admin123<br/>
                            Driver: driver@routemate.com / driver123<br/>
                            User: user@routemate.com / user123
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;