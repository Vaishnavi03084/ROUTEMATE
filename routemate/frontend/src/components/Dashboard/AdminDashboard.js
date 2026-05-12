import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('rides');
    const [rides, setRides] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddDriverModal, setShowAddDriverModal] = useState(false);
    const [newDriver, setNewDriver] = useState({ name: '', email: '', password: '', phone: '', vehicleModel: '', vehicleNumber: '' });
    const [newRide, setNewRide] = useState({
        routeName: '',
        pickupAddress: '',
        dropAddress: '',
        departureTime: '',
        baseFare: '',
        availableSeats: 4
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch rides
            const ridesRes = await api.get('/rides');
            setRides(ridesRes.data.data || []);
            
            // Fetch all users
            const usersRes = await api.get('/users');
            const allUsers = usersRes.data.data || [];
            setDrivers(allUsers.filter(u => u.role === 'driver'));
            setUsers(allUsers.filter(u => u.role === 'user'));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRide = async (e) => {
        e.preventDefault();
        try {
            const rideData = {
                routeName: newRide.routeName,
                pickupLocation: { address: newRide.pickupAddress, lat: 0, lng: 0 },
                dropLocation: { address: newRide.dropAddress, lat: 0, lng: 0 },
                departureTime: new Date(newRide.departureTime),
                baseFare: parseInt(newRide.baseFare),
                availableSeats: parseInt(newRide.availableSeats),
                status: 'scheduled'
            };
            
            await api.post('/rides', rideData);
            toast.success('Ride created successfully!');
            setShowCreateModal(false);
            fetchAllData();
            setNewRide({ routeName: '', pickupAddress: '', dropAddress: '', departureTime: '', baseFare: '', availableSeats: 4 });
        } catch (error) {
            toast.error('Failed to create ride');
        }
    };

    const handleAddDriver = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', {
                ...newDriver,
                role: 'driver',
                vehicleDetails: { vehicleModel: newDriver.vehicleModel, vehicleNumber: newDriver.vehicleNumber }
            });
            toast.success('Driver added successfully!');
            setShowAddDriverModal(false);
            fetchAllData();
        } catch (error) {
            toast.error('Failed to add driver');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/users/${userId}`);
                toast.success('User deleted');
                fetchAllData();
            } catch (error) {
                toast.error('Failed to delete');
            }
        }
    };

    const handleDeleteRide = async (rideId) => {
        if (window.confirm('Delete this ride?')) {
            try {
                await api.delete(`/rides/${rideId}`);
                toast.success('Ride deleted');
                fetchAllData();
            } catch (error) {
                toast.error('Failed to delete');
            }
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="spinner w-12 h-12"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 to-purple-800 text-white shadow-lg">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-blue-200">Welcome, {user?.name}! 👑</p>
                </div>
            </div>

            {/* Stats */}
            <div className="container mx-auto px-4 -mt-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                        <div className="text-3xl mb-2">🚗</div>
                        <p className="text-2xl font-bold">{rides.length}</p>
                        <p className="text-xs text-gray-500">Total Rides</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                        <div className="text-3xl mb-2">👨‍✈️</div>
                        <p className="text-2xl font-bold">{drivers.length}</p>
                        <p className="text-xs text-gray-500">Drivers</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4 text-center">
                        <div className="text-3xl mb-2">👤</div>
                        <p className="text-2xl font-bold">{users.length}</p>
                        <p className="text-xs text-gray-500">Users</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="container mx-auto px-4 mt-8">
                <div className="flex space-x-2 bg-white rounded-lg p-1">
                    <button onClick={() => setActiveTab('rides')} className={`flex-1 py-2 rounded-lg font-semibold ${activeTab === 'rides' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>🚗 Rides</button>
                    <button onClick={() => setActiveTab('drivers')} className={`flex-1 py-2 rounded-lg font-semibold ${activeTab === 'drivers' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>👨‍✈️ Drivers</button>
                    <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 rounded-lg font-semibold ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>👤 Users</button>
                </div>
            </div>

            {/* Rides Tab */}
            {activeTab === 'rides' && (
                <div className="container mx-auto px-4 mt-6 pb-12">
                    <button onClick={() => setShowCreateModal(true)} className="mb-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">+ Create New Ride</button>
                    <div className="space-y-3">
                        {rides.map(ride => (
                            <div key={ride._id} className="bg-white rounded-lg shadow p-4">
                                <div className="flex justify-between">
                                    <div>
                                        <h3 className="font-bold">{ride.routeName}</h3>
                                        <p className="text-sm text-gray-500">From: {ride.pickupLocation?.address}</p>
                                        <p className="text-sm text-gray-500">To: {ride.dropLocation?.address}</p>
                                        <p className="text-sm">Fare: ₹{ride.baseFare} | Seats: {ride.availableSeats}</p>
                                        <p className="text-xs text-gray-400">{new Date(ride.departureTime).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => handleDeleteRide(ride._id)} className="text-red-500">🗑️</button>
                                </div>
                            </div>
                        ))}
                        {rides.length === 0 && <p className="text-center text-gray-500">No rides yet. Create one!</p>}
                    </div>
                </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
                <div className="container mx-auto px-4 mt-6 pb-12">
                    <button onClick={() => setShowAddDriverModal(true)} className="mb-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">+ Add Driver</button>
                    <div className="grid md:grid-cols-2 gap-4">
                        {drivers.map(driver => (
                            <div key={driver._id} className="bg-white rounded-lg shadow p-4">
                                <div className="flex justify-between">
                                    <div>
                                        <h3 className="font-bold">{driver.name}</h3>
                                        <p className="text-sm">{driver.email}</p>
                                        <p className="text-sm">{driver.phone}</p>
                                        <p className="text-xs text-gray-500">Vehicle: {driver.vehicleDetails?.vehicleModel || 'Not added'}</p>
                                    </div>
                                    <button onClick={() => handleDeleteUser(driver._id)} className="text-red-500">🗑️</button>
                                </div>
                            </div>
                        ))}
                        {drivers.length === 0 && <p className="text-center text-gray-500">No drivers yet. Add one!</p>}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="container mx-auto px-4 mt-6 pb-12">
                    <div className="grid md:grid-cols-2 gap-4">
                        {users.map(user => (
                            <div key={user._id} className="bg-white rounded-lg shadow p-4">
                                <div className="flex justify-between">
                                    <div>
                                        <h3 className="font-bold">{user.name}</h3>
                                        <p className="text-sm">{user.email}</p>
                                        <p className="text-sm">{user.phone}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-yellow-500">🔒 Block</button>
                                        <button onClick={() => handleDeleteUser(user._id)} className="text-red-500">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && <p className="text-center text-gray-500">No users yet</p>}
                    </div>
                </div>
            )}

            {/* Create Ride Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Create New Ride</h3>
                        <form onSubmit={handleCreateRide}>
                            <input type="text" placeholder="Route Name" className="w-full p-2 border rounded mb-3" value={newRide.routeName} onChange={e => setNewRide({...newRide, routeName: e.target.value})} required />
                            <input type="text" placeholder="Pickup Address" className="w-full p-2 border rounded mb-3" value={newRide.pickupAddress} onChange={e => setNewRide({...newRide, pickupAddress: e.target.value})} required />
                            <input type="text" placeholder="Drop Address" className="w-full p-2 border rounded mb-3" value={newRide.dropAddress} onChange={e => setNewRide({...newRide, dropAddress: e.target.value})} required />
                            <input type="datetime-local" className="w-full p-2 border rounded mb-3" value={newRide.departureTime} onChange={e => setNewRide({...newRide, departureTime: e.target.value})} required />
                            <input type="number" placeholder="Base Fare (₹)" className="w-full p-2 border rounded mb-3" value={newRide.baseFare} onChange={e => setNewRide({...newRide, baseFare: e.target.value})} required />
                            <input type="number" placeholder="Available Seats (1-4)" className="w-full p-2 border rounded mb-3" value={newRide.availableSeats} onChange={e => setNewRide({...newRide, availableSeats: e.target.value})} required />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Driver Modal */}
            {showAddDriverModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddDriverModal(false)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Add New Driver</h3>
                        <form onSubmit={handleAddDriver}>
                            <input type="text" placeholder="Full Name" className="w-full p-2 border rounded mb-3" value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} required />
                            <input type="email" placeholder="Email" className="w-full p-2 border rounded mb-3" value={newDriver.email} onChange={e => setNewDriver({...newDriver, email: e.target.value})} required />
                            <input type="password" placeholder="Password" className="w-full p-2 border rounded mb-3" value={newDriver.password} onChange={e => setNewDriver({...newDriver, password: e.target.value})} required />
                            <input type="tel" placeholder="Phone" className="w-full p-2 border rounded mb-3" value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} required />
                            <input type="text" placeholder="Vehicle Model" className="w-full p-2 border rounded mb-3" value={newDriver.vehicleModel} onChange={e => setNewDriver({...newDriver, vehicleModel: e.target.value})} required />
                            <input type="text" placeholder="Vehicle Number" className="w-full p-2 border rounded mb-3" value={newDriver.vehicleNumber} onChange={e => setNewDriver({...newDriver, vehicleNumber: e.target.value})} required />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAddDriverModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded">Add Driver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;