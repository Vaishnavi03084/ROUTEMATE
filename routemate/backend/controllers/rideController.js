const Ride = require('../models/Ride');
const User = require('../models/User');

// Create ride (Admin only)
exports.createRide = async (req, res) => {
    try {
        const ride = await Ride.create(req.body);
        
        res.status(201).json({
            success: true,
            data: ride
        });
    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all rides
exports.getRides = async (req, res) => {
    try {
        const rides = await Ride.find()
            .populate('assignedDriver', 'name phone rating')
            .sort('departureTime');
        
        res.status(200).json({
            success: true,
            count: rides.length,
            data: rides
        });
    } catch (error) {
        console.error('Get rides error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single ride
exports.getRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('assignedDriver', 'name phone rating vehicleDetails')
            .populate('passengers.user', 'name phone rating');
        
        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: ride
        });
    } catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Assign driver to ride (Admin only)
exports.assignDriver = async (req, res) => {
    try {
        const { driverId } = req.body;
        
        const ride = await Ride.findById(req.params.id);
        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }
        
        const driver = await User.findById(driverId);
        if (!driver || driver.role !== 'driver') {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver'
            });
        }
        
        ride.assignedDriver = driverId;
        await ride.save();
        
        res.status(200).json({
            success: true,
            data: ride,
            message: 'Driver assigned successfully'
        });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update ride status
exports.updateRideStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        const ride = await Ride.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        
        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: ride,
            message: `Ride ${status} successfully`
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get available rides with pooling options
exports.getAvailableRidesWithPooling = async (req, res) => {
    try {
        const { pickupLocation, dropLocation, departureTime } = req.body;
        
        const rides = await Ride.find({
            status: 'scheduled',
            departureTime: {
                $gte: new Date(departureTime - 30 * 60000),
                $lte: new Date(departureTime + 30 * 60000)
            }
        }).populate('assignedDriver', 'name rating');
        
        const ridesWithFares = rides.map(ride => {
            const soloFare = ride.baseFare;
            const currentPassengers = ride.passengers.length;
            const pooledFare = currentPassengers > 0 
                ? Math.round(ride.baseFare / (currentPassengers + 1))
                : ride.baseFare;
            
            return {
                ...ride.toObject(),
                soloFare,
                pooledFare,
                availableSeats: ride.availableSeats - ride.passengers.length,
                recommendedType: ride.passengers.length >= 2 ? 'pooled' : 'solo'
            };
        });
        
        res.status(200).json({
            success: true,
            data: ridesWithFares
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};