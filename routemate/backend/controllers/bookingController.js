const Booking = require('../models/Booking');
const Ride = require('../models/Ride');

// Create booking
exports.createBooking = async (req, res) => {
    try {
        const { rideId, bookingType } = req.body;
        
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }
        
        // Check seat availability
        if (ride.passengers.length >= ride.availableSeats) {
            return res.status(400).json({
                success: false,
                message: 'No seats available'
            });
        }
        
        // Calculate fare
        let fare;
        if (bookingType === 'solo') {
            fare = ride.baseFare * ride.surgeMultiplier;
        } else {
            const passengerCount = ride.passengers.length + 1;
            fare = (ride.baseFare * ride.surgeMultiplier) / passengerCount;
            fare = Math.round(fare * 0.8); // 20% discount for pooling
        }
        
        // Create booking
        const booking = new Booking({
            user: req.user.id,
            ride: rideId,
            bookingType,
            fare: Math.round(fare),
            status: 'confirmed',
            paymentStatus: 'pending',
            paymentMethod: 'cash'
        });
        
        await booking.save();
        
        // Add passenger to ride
        ride.passengers.push({
            user: req.user.id,
            bookingType,
            fare: Math.round(fare),
            status: 'confirmed',
            bookedAt: new Date()
        });
        
        await ride.save();
        
        res.status(201).json({
            success: true,
            data: booking,
            message: bookingType === 'pooled' ? 
                `Pooled ride booked! You saved ${Math.round((ride.baseFare - fare) / ride.baseFare * 100)}%!` :
                'Solo ride booked successfully!'
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's bookings
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate({
                path: 'ride',
                populate: {
                    path: 'assignedDriver',
                    select: 'name phone rating vehicleDetails'
                }
            })
            .sort('-createdAt');
        
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get driver's assigned rides
exports.getDriverBookings = async (req, res) => {
    try {
        const rides = await Ride.find({ 
            assignedDriver: req.user.id,
            status: { $in: ['scheduled', 'active'] }
        })
            .populate('passengers.user', 'name phone rating')
            .sort('departureTime');
        
        res.status(200).json({
            success: true,
            count: rides.length,
            data: rides
        });
    } catch (error) {
        console.error('Error fetching driver rides:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        // Check if user owns this booking
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Check if ride can be cancelled (not started/completed)
        const ride = await Ride.findById(booking.ride);
        if (ride.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed ride'
            });
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        // Remove passenger from ride
        ride.passengers = ride.passengers.filter(
            p => p.user.toString() !== req.user.id
        );
        await ride.save();
        
        res.status(200).json({
            success: true,
            data: booking,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get available rides with comparison
exports.getAvailableRidesWithComparison = async (req, res) => {
    try {
        const { pickupAddress, dropAddress, departureTime } = req.body;
        
        // Find rides for today or future
        const query = {
            status: 'scheduled',
            departureTime: { $gte: new Date() }
        };
        
        // If specific time provided, filter within 2 hours
        if (departureTime) {
            const targetTime = new Date(departureTime);
            query.departureTime = {
                $gte: new Date(targetTime.getTime() - 60 * 60000),
                $lte: new Date(targetTime.getTime() + 60 * 60000)
            };
        }
        
        const rides = await Ride.find(query)
            .populate('assignedDriver', 'name rating vehicleDetails')
            .limit(20);
        
        // Calculate fares for each ride
        const ridesWithComparison = rides.map(ride => {
            const soloFare = Math.round(ride.baseFare * ride.surgeMultiplier);
            const pooledSeats = ride.passengers.length + 1;
            const pooledFare = Math.round((ride.baseFare * ride.surgeMultiplier) / pooledSeats * 0.8);
            const savings = Math.round((soloFare - pooledFare) / soloFare * 100);
            
            return {
                ...ride.toObject(),
                soloFare,
                pooledFare,
                savings,
                currentPassengers: ride.passengers.length,
                remainingSeats: ride.availableSeats - ride.passengers.length,
                recommended: ride.passengers.length >= 2 ? 'pooled' : 'solo',
                surgeActive: ride.surgeMultiplier > 1
            };
        });
        
        res.status(200).json({
            success: true,
            count: ridesWithComparison.length,
            data: ridesWithComparison
        });
    } catch (error) {
        console.error('Error fetching rides:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};