import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  Search, 
  Users, 
  User, 
  TrendingDown, 
  Clock, 
  MapPin, 
  Calendar,
  Shield,
  Award,
  Zap,
  DollarSign,
  Car,
  Heart,
  Star
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const { user } = useAuth();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState(new Date());
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [allRides, setAllRides] = useState([]);

  // Load all rides when page loads
  useEffect(() => {
    fetchMyBookings();
    loadAllRides();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Load all available rides from database
  const loadAllRides = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rides');
      const allAvailableRides = response.data.data || [];
      
      // Filter only scheduled rides
      const scheduledRides = allAvailableRides.filter(ride => ride.status === 'scheduled');
      
      // Calculate fares for each ride
      const ridesWithFares = scheduledRides.map(ride => {
        const soloFare = ride.baseFare;
        const pooledFare = Math.round(ride.baseFare / 2);
        const savings = Math.round((soloFare - pooledFare) / soloFare * 100);
        
        return {
          ...ride,
          soloFare,
          pooledFare,
          savings,
          currentPassengers: ride.passengers?.length || 0,
          remainingSeats: (ride.availableSeats || 4) - (ride.passengers?.length || 0),
          surgeActive: ride.surgeMultiplier > 1
        };
      });
      
      setAllRides(ridesWithFares);
      setRides(ridesWithFares);
      
      if (ridesWithFares.length > 0) {
        toast.success(`${ridesWithFares.length} rides available!`);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const searchRides = async () => {
    setLoading(true);
    try {
      // If search criteria provided, filter rides
      if (pickup || drop) {
        const filtered = allRides.filter(ride => {
          const pickupMatch = pickup ? ride.pickupLocation?.address?.toLowerCase().includes(pickup.toLowerCase()) : true;
          const dropMatch = drop ? ride.dropLocation?.address?.toLowerCase().includes(drop.toLowerCase()) : true;
          return pickupMatch && dropMatch;
        });
        setRides(filtered);
        
        if (filtered.length === 0) {
          toast('No rides found for this route. Try different location!', { icon: '🚗' });
        } else {
          toast.success(`Found ${filtered.length} rides for you!`);
        }
      } else {
        // Show all rides if no search criteria
        setRides(allRides);
        if (allRides.length === 0) {
          toast('No rides available. Please check back later!', { icon: '🚗' });
        }
      }
    } catch (error) {
      toast.error('Error searching rides');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (ride, bookingType) => {
    try {
      const response = await api.post('/bookings', {
        rideId: ride._id,
        bookingType: bookingType
      });
      toast.success(response.data.message);
      setShowBookingModal(false);
      fetchMyBookings();
      loadAllRides(); // Refresh rides after booking
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    }
  };

  const stats = [
    { icon: <TrendingDown className="w-6 h-6" />, label: 'Average Savings', value: '35%', color: 'bg-green-500' },
    { icon: <Shield className="w-6 h-6" />, label: 'Safe Rides', value: '100%', color: 'bg-blue-500' },
    { icon: <Users className="w-6 h-6" />, label: 'Eco-Friendly', value: '2.5K kg', color: 'bg-emerald-500' },
    { icon: <Award className="w-6 h-6" />, label: 'Rating', value: '4.9', color: 'bg-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name}! 👋</h1>
              <p className="text-blue-100 mt-2">Save money, reduce traffic, travel smart</p>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
              <Heart className="w-5 h-5" />
              <span>Eco-Warrior</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-4"
            >
              <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Find Your Ride</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pickup location"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Drop location"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <DatePicker
                selected={date}
                onChange={setDate}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchRides}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="spinner w-5 h-5"></div>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search Rides</span>
                </>
              )}
            </button>
          </div>
          
          {/* Show all rides button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setPickup('');
                setDrop('');
                setRides(allRides);
              }}
              className="text-blue-600 text-sm hover:text-blue-700"
            >
              Show all available rides ({allRides.length})
            </button>
          </div>
        </motion.div>
      </div>

      {/* Available Rides */}
      <div className="container mx-auto px-4 mt-8 pb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Zap className="w-6 h-6 text-yellow-500 mr-2" />
          Available Rides
          {rides.length > 0 && <span className="text-sm text-gray-500 ml-2">({rides.length} found)</span>}
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {rides.map((ride, index) => (
              <motion.div
                key={ride._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                {ride.surgeActive && (
                  <div className="bg-red-500 text-white text-xs px-3 py-1 text-center">
                    High Demand • Pooling Recommended
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{ride.routeName}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(ride.departureTime).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">From:</span>
                      <span className="ml-2">{ride.pickupLocation?.address}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">To:</span>
                      <span className="ml-2">{ride.dropLocation?.address}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Solo Ride Option */}
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 mx-auto text-blue-600 mb-2" />
                        <p className="text-xs text-gray-500">Solo Ride</p>
                        <p className="text-xl font-bold text-blue-600">₹{ride.soloFare}</p>
                      </div>

                      {/* Pooled Ride Option */}
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg relative">
                        {ride.savings > 0 && (
                          <div className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Save {ride.savings}%
                          </div>
                        )}
                        <Users className="w-5 h-5 mx-auto text-green-600 mb-2" />
                        <p className="text-xs text-gray-500">Pooled Ride</p>
                        <p className="text-xl font-bold text-green-600">₹{ride.pooledFare}</p>
                        <p className="text-xs text-gray-500">{ride.currentPassengers}/{ride.availableSeats || 4} seats filled</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRide(ride);
                          setShowBookingModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {rides.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No rides available</p>
            <p className="text-sm text-gray-400">Check back later or try different location</p>
          </motion.div>
        )}
      </div>

      {/* My Bookings Section */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">My Recent Bookings</h2>
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{booking.ride?.routeName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.ride?.departureTime).toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        booking.bookingType === 'pooled' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.bookingType?.toUpperCase()} RIDE
                      </span>
                      {booking.bookingType === 'pooled' && (
                        <span className="ml-2 text-xs text-green-600">
                          Saved ₹{Math.round((booking.ride?.baseFare || 0) - (booking.fare || 0))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">₹{booking.fare}</p>
                    <p className={`text-xs ${
                      booking.status === 'confirmed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {booking.status?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg">
                <p className="text-gray-500">No bookings yet</p>
                <p className="text-sm text-gray-400">Book your first ride to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedRide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">Choose Your Ride</h3>
              <div className="space-y-4">
                <button
                  onClick={() => handleBooking(selectedRide, 'solo')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition">
                        <User className="w-6 h-6 text-blue-600 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Solo Ride</p>
                        <p className="text-sm text-gray-500">Private & comfortable</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₹{selectedRide.soloFare}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleBooking(selectedRide, 'pooled')}
                  className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-500 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition">
                        <Users className="w-6 h-6 text-green-600 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Pooled Ride</p>
                        <p className="text-sm text-green-600">Save {selectedRide.savings}% • Eco-friendly</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{selectedRide.pooledFare}</p>
                      <p className="text-xs text-gray-400 line-through">₹{selectedRide.soloFare}</p>
                    </div>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;