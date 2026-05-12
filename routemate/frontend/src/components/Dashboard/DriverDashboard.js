import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DriverDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('current');
    const [assignedRides, setAssignedRides] = useState([]);
    const [availableRides, setAvailableRides] = useState([]);
    const [myAcceptedRides, setMyAcceptedRides] = useState([]);
    const [completedRides, setCompletedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRide, setSelectedRide] = useState(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showEarningsModal, setShowEarningsModal] = useState(false);
    const [driverStatus, setDriverStatus] = useState('online');
    const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, total: 0 });
    const [stats, setStats] = useState({
        totalRides: 0,
        totalPassengers: 0,
        rating: 4.8,
        completedToday: 0,
        acceptanceRate: 95,
        onTimeRate: 98
    });

    useEffect(() => {
        fetchDriverData();
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDriverData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDriverData = async () => {
        try {
            // Fetch ALL rides from database
            const ridesResponse = await api.get('/rides');
            const allRides = ridesResponse.data.data || [];
            
            // Separate rides based on status and assignment
            const available = allRides.filter(ride => 
                ride.status === 'scheduled' && !ride.assignedDriver
            );
            
            const myAccepted = allRides.filter(ride => 
                (ride.status === 'scheduled' || ride.status === 'active') && 
                ride.assignedDriver?._id === user?.id
            );
            
            const completed = allRides.filter(ride => 
                ride.status === 'completed' && ride.assignedDriver?._id === user?.id
            );
            
            setAvailableRides(available);
            setMyAcceptedRides(myAccepted);
            setCompletedRides(completed);
            
            // Combine for current rides display
            setAssignedRides([...available, ...myAccepted]);
            
            // Calculate earnings from completed rides
            const totalEarned = completed.reduce((sum, ride) => sum + (ride.totalEarnings || ride.baseFare), 0);
            const todayEarned = completed.filter(ride => {
                const today = new Date().toDateString();
                return new Date(ride.departureTime).toDateString() === today;
            }).reduce((sum, ride) => sum + (ride.totalEarnings || ride.baseFare), 0);
            
            const weekEarned = completed.filter(ride => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(ride.departureTime) >= weekAgo;
            }).reduce((sum, ride) => sum + (ride.totalEarnings || ride.baseFare), 0);
            
            const monthEarned = completed.filter(ride => {
                const monthAgo = new Date();
                monthAgo.setDate(monthAgo.getDate() - 30);
                return new Date(ride.departureTime) >= monthAgo;
            }).reduce((sum, ride) => sum + (ride.totalEarnings || ride.baseFare), 0);
            
            setEarnings({
                today: todayEarned,
                week: weekEarned,
                month: monthEarned,
                total: totalEarned
            });
            
            setStats({
                totalRides: completed.length,
                totalPassengers: completed.reduce((sum, ride) => sum + (ride.passengers?.length || 0), 0),
                rating: 4.8,
                completedToday: completed.filter(ride => {
                    const today = new Date().toDateString();
                    return new Date(ride.departureTime).toDateString() === today;
                }).length,
                acceptanceRate: Math.round((myAccepted.length / (available.length + myAccepted.length + 1)) * 100) || 95,
                onTimeRate: 98
            });
            
            if (available.length > 0) {
                toast.success(`${available.length} new ride${available.length > 1 ? 's' : ''} available!`);
            }
            
        } catch (error) {
            console.error('Error fetching driver data:', error);
            toast.error('Failed to fetch driver data');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRide = async (rideId) => {
        try {
            // Assign driver to ride
            await api.put(`/rides/${rideId}/assign-driver`, { driverId: user?.id });
            // Update ride status to active
            await api.put(`/rides/${rideId}/status`, { status: 'active' });
            toast.success('Ride accepted successfully! 🚗');
            setShowAcceptModal(false);
            fetchDriverData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept ride');
        }
    };

    const handleCompleteRide = async (rideId) => {
        try {
            await api.put(`/rides/${rideId}/status`, { status: 'completed' });
            toast.success('Ride completed! Payment processed 💰');
            fetchDriverData();
        } catch (error) {
            toast.error('Failed to complete ride');
        }
    };

    const handleCancelRide = async (rideId) => {
        if (window.confirm('Are you sure you want to cancel this ride?')) {
            try {
                await api.put(`/rides/${rideId}/status`, { status: 'cancelled' });
                toast.success('Ride cancelled');
                fetchDriverData();
            } catch (error) {
                toast.error('Failed to cancel ride');
            }
        }
    };

    const toggleDriverStatus = async () => {
        const newStatus = driverStatus === 'online' ? 'offline' : 'online';
        setDriverStatus(newStatus);
        toast.success(`You are now ${newStatus}`);
    };

    const getRideStatusColor = (status) => {
        switch(status) {
            case 'scheduled': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
            case 'active': return 'bg-gradient-to-r from-green-400 to-emerald-500';
            case 'completed': return 'bg-gradient-to-r from-blue-400 to-indigo-500';
            case 'cancelled': return 'bg-gradient-to-r from-red-400 to-pink-500';
            default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
        }
    };

    const getRideStatusIcon = (status) => {
        switch(status) {
            case 'scheduled': return '⏰';
            case 'active': return '🚗';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '📋';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-white text-lg">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -ml-48 -mb-48 animate-pulse delay-1000"></div>
                <div className="container mx-auto px-4 py-8 relative z-10">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-bold"
                            >
                                Welcome back, {user?.name}! 🚗
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-blue-100 mt-2 text-lg"
                            >
                                Your driving dashboard • Earn more with every ride
                            </motion.p>
                        </div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center space-x-4"
                        >
                            <button
                                onClick={toggleDriverStatus}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all ${
                                    driverStatus === 'online' 
                                        ? 'bg-green-500 hover:bg-green-600' 
                                        : 'bg-gray-500 hover:bg-gray-600'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${driverStatus === 'online' ? 'animate-pulse bg-white' : 'bg-gray-300'}`}></span>
                                <span>{driverStatus === 'online' ? 'Online' : 'Offline'}</span>
                            </button>
                            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
                                <span className="text-yellow-300 text-xl">⭐</span>
                                <span className="font-bold text-xl">{stats.rating}</span>
                                <span className="text-sm">Rating</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="container mx-auto px-4 -mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition">
                        <div className="text-3xl mb-2">💰</div>
                        <p className="text-2xl font-bold text-green-600">₹{earnings.today}</p>
                        <p className="text-xs text-gray-500">Today's Earnings</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition">
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-2xl font-bold text-blue-600">{stats.completedToday}</p>
                        <p className="text-xs text-gray-500">Rides Today</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition">
                        <div className="text-3xl mb-2">👥</div>
                        <p className="text-2xl font-bold text-purple-600">{stats.totalPassengers}</p>
                        <p className="text-xs text-gray-500">Happy Passengers</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition">
                        <div className="text-3xl mb-2">🏆</div>
                        <p className="text-2xl font-bold text-orange-600">{stats.totalRides}</p>
                        <p className="text-xs text-gray-500">Total Rides</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition">
                        <div className="text-3xl mb-2">✅</div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.acceptanceRate}%</p>
                        <p className="text-xs text-gray-500">Acceptance Rate</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition cursor-pointer" onClick={() => setShowEarningsModal(true)}>
                        <div className="text-3xl mb-2">💎</div>
                        <p className="text-2xl font-bold text-amber-600">₹{earnings.total}</p>
                        <p className="text-xs text-gray-500">Total Earnings</p>
                    </motion.div>
                </div>
            </div>

            {/* Available Rides Summary */}
            {availableRides.length > 0 && (
                <div className="container mx-auto px-4 mt-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-2xl mr-2">🆕</span>
                                <span className="font-semibold text-green-800">{availableRides.length} new ride{availableRides.length > 1 ? 's' : ''} available!</span>
                                <p className="text-sm text-green-600 mt-1">Check "Current Rides" tab to accept them</p>
                            </div>
                            <button
                                onClick={() => setActiveTab('current')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                View Rides
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="container mx-auto px-4 mt-8">
                <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-md">
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                            activeTab === 'current'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>🚗</span>
                        <span>Current Rides</span>
                        {assignedRides.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {assignedRides.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                            activeTab === 'history'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>📜</span>
                        <span>Ride History</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                            activeTab === 'stats'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>📈</span>
                        <span>Performance</span>
                    </button>
                </div>
            </div>

            {/* Current Rides Tab */}
            {activeTab === 'current' && (
                <div className="container mx-auto px-4 mt-6 pb-12">
                    <div className="grid md:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {assignedRides.map((ride, index) => (
                                <motion.div
                                    key={ride._id}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1"
                                >
                                    {/* Status Header */}
                                    <div className={`${getRideStatusColor(ride.status)} px-5 py-3 text-white flex justify-between items-center`}>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl">{getRideStatusIcon(ride.status)}</span>
                                            <span className="font-bold uppercase tracking-wide">
                                                {ride.assignedDriver?._id === user?.id ? 'Your Ride' : 'Available'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm">🕐</span>
                                            <span className="font-medium">
                                                {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5">
                                        <h3 className="font-bold text-xl mb-3 flex items-center justify-between">
                                            <span>{ride.routeName}</span>
                                            {ride.surgeMultiplier > 1 && (
                                                <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                                    🔥 {Math.round((ride.surgeMultiplier - 1) * 100)}% Surge
                                                </span>
                                            )}
                                        </h3>
                                        
                                        {/* Route Info */}
                                        <div className="space-y-3 mb-5">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                    <div className="w-0.5 h-8 bg-gray-300"></div>
                                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">PICKUP</p>
                                                        <p className="text-sm font-medium">{ride.pickupLocation?.address}</p>
                                                    </div>
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-500 font-semibold">DROP</p>
                                                        <p className="text-sm font-medium">{ride.dropLocation?.address}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Ride Details */}
                                        <div className="grid grid-cols-3 gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Seats</p>
                                                <p className="font-bold text-lg">{ride.passengers?.length || 0}/{ride.availableSeats}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Fare</p>
                                                <p className="font-bold text-xl text-blue-600">₹{ride.baseFare}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Distance</p>
                                                <p className="font-bold">~8 km</p>
                                            </div>
                                        </div>
                                        
                                        {/* Passenger List (if any) */}
                                        {ride.passengers && ride.passengers.length > 0 && (
                                            <div className="mb-5">
                                                <p className="text-sm font-semibold mb-2 flex items-center">
                                                    <span className="mr-2">👥</span> Passengers
                                                </p>
                                                <div className="space-y-2">
                                                    {ride.passengers.map((passenger, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-2 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm">👤</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm">{passenger.user?.name || 'Passenger'}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {passenger.bookingType === 'pooled' ? 'Pooled Ride' : 'Solo Ride'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-green-600">₹{passenger.fare}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            {!ride.assignedDriver && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedRide(ride);
                                                        setShowAcceptModal(true);
                                                    }}
                                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:shadow-lg transition font-semibold flex items-center justify-center space-x-2"
                                                >
                                                    <span>✅</span>
                                                    <span>Accept Ride</span>
                                                </button>
                                            )}
                                            {ride.assignedDriver?._id === user?.id && ride.status === 'active' && (
                                                <button
                                                    onClick={() => handleCompleteRide(ride._id)}
                                                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition font-semibold flex items-center justify-center space-x-2"
                                                >
                                                    <span>🏁</span>
                                                    <span>Complete Ride</span>
                                                </button>
                                            )}
                                            {ride.assignedDriver?._id === user?.id && ride.status === 'scheduled' && (
                                                <button
                                                    onClick={() => handleCancelRide(ride._id)}
                                                    className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition font-semibold flex items-center justify-center space-x-2"
                                                >
                                                    <span>❌</span>
                                                    <span>Cancel Ride</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedRide(ride);
                                                    setShowRouteModal(true);
                                                }}
                                                className="px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition flex items-center justify-center"
                                            >
                                                <span>🗺️</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    
                    {assignedRides.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 bg-white rounded-2xl shadow-sm"
                        >
                            <div className="text-8xl mb-4">🚗💨</div>
                            <p className="text-gray-500 text-xl font-medium">No rides available at the moment</p>
                            <p className="text-gray-400 mt-2">Check back later for new ride requests</p>
                            <div className="mt-6 flex justify-center space-x-2">
                                <span className="text-green-500">●</span>
                                <span className="text-sm text-gray-500">You are {driverStatus}</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Ride History Tab - Same as before */}
            {activeTab === 'history' && (
                <div className="container mx-auto px-4 mt-6 pb-12">
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                        <span className="text-3xl mr-2">📜</span>
                        Your Ride History
                    </h2>
                    <div className="space-y-3">
                        {completedRides.map((ride, index) => (
                            <motion.div
                                key={ride._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition cursor-pointer"
                            >
                                <div className="flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <p className="font-bold text-lg">{ride.routeName}</p>
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                                Completed
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <span className="mr-1">📅</span>
                                                {new Date(ride.departureTime).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="mr-1">🕐</span>
                                                {new Date(ride.departureTime).toLocaleTimeString()}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="mr-1">👥</span>
                                                {ride.passengers?.length || 0} passengers
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Earned</p>
                                        <p className="text-2xl font-bold text-green-600">+₹{ride.totalEarnings || ride.baseFare}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {completedRides.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <div className="text-6xl mb-4">📭</div>
                                <p className="text-gray-500">No completed rides yet</p>
                                <p className="text-sm text-gray-400">Start accepting rides to see history</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Performance Stats Tab - Same as before */}
            {activeTab === 'stats' && (
                <div className="container mx-auto px-4 mt-6 pb-12">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <span className="text-2xl mr-2">⭐</span>
                                Performance Metrics
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Acceptance Rate</span>
                                        <span className="text-sm font-bold text-green-600">{stats.acceptanceRate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.acceptanceRate}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">On-Time Rate</span>
                                        <span className="text-sm font-bold text-blue-600">{stats.onTimeRate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.onTimeRate}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Customer Rating</span>
                                        <span className="text-sm font-bold text-yellow-600">{stats.rating} / 5.0</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.rating / 5) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <span className="text-2xl mr-2">🎯</span>
                                Today's Goal
                            </h3>
                            <div className="text-center">
                                <div className="text-6xl font-bold mb-2">₹{earnings.today}</div>
                                <p className="text-blue-200">Earned Today</p>
                                <div className="mt-4 w-full bg-white/20 rounded-full h-3">
                                    <div className="bg-yellow-400 h-3 rounded-full" style={{ width: `${Math.min((earnings.today / 1000) * 100, 100)}%` }}></div>
                                </div>
                                <p className="mt-2 text-sm text-blue-200">Target: ₹1000</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            <span className="text-2xl mr-2">💰</span>
                            Earnings Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">Today</p>
                                <p className="text-xl font-bold text-green-600">₹{earnings.today}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">This Week</p>
                                <p className="text-xl font-bold text-blue-600">₹{earnings.week}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500">This Month</p>
                                <p className="text-xl font-bold text-purple-600">₹{earnings.month}</p>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg">
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-xl font-bold text-amber-600">₹{earnings.total}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Accept Ride Modal */}
            <AnimatePresence>
                {showAcceptModal && selectedRide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAcceptModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-4">
                                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-4xl">🚗</span>
                                </div>
                                <h3 className="text-2xl font-bold">Accept This Ride?</h3>
                                <p className="text-gray-500 mt-1">You're about to accept this trip request</p>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl">
                                    <p className="font-semibold mb-2">{selectedRide.routeName}</p>
                                    <p className="text-sm text-gray-600">📅 {new Date(selectedRide.departureTime).toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">👥 {selectedRide.passengers?.length || 0} passengers</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-2">₹{selectedRide.baseFare}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAcceptModal(false)}
                                    className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAcceptRide(selectedRide._id)}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:shadow-lg transition font-semibold"
                                >
                                    Accept Ride
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Route Modal */}
            <AnimatePresence>
                {showRouteModal && selectedRide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowRouteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <span className="text-2xl mr-2">🗺️</span>
                                Route Information
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div className="w-0.5 h-12 bg-gray-300"></div>
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 font-semibold">PICKUP LOCATION</p>
                                            <p className="font-medium">{selectedRide.pickupLocation?.address}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">DROP LOCATION</p>
                                            <p className="font-medium">{selectedRide.dropLocation?.address}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Estimated Distance:</span>
                                        <span className="font-semibold">8.5 km</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-500">Estimated Time:</span>
                                        <span className="font-semibold">25 minutes</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-500">Traffic Condition:</span>
                                        <span className="font-semibold text-green-600">Light</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowRouteModal(false)}
                                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-semibold"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Earnings Modal */}
            <AnimatePresence>
                {showEarningsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowEarningsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <span className="text-2xl mr-2">💰</span>
                                Earnings Breakdown
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>Today</span>
                                    <span className="font-bold text-green-600">₹{earnings.today}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>This Week</span>
                                    <span className="font-bold text-blue-600">₹{earnings.week}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>This Month</span>
                                    <span className="font-bold text-purple-600">₹{earnings.month}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg">
                                    <span className="font-semibold">Total Earnings</span>
                                    <span className="font-bold text-amber-600 text-xl">₹{earnings.total}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEarningsModal(false)}
                                className="w-full mt-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition font-semibold"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverDashboard;