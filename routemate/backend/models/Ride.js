const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: true
    },
    pickupLocation: {
        address: {
            type: String,
            required: true
        },
        lat: {
            type: Number,
            default: 0
        },
        lng: {
            type: Number,
            default: 0
        }
    },
    dropLocation: {
        address: {
            type: String,
            required: true
        },
        lat: {
            type: Number,
            default: 0
        },
        lng: {
            type: Number,
            default: 0
        }
    },
    departureTime: {
        type: Date,
        required: true
    },
    baseFare: {
        type: Number,
        required: true
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 1,
        max: 4,
        default: 4
    },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    passengers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        bookingType: {
            type: String,
            enum: ['solo', 'pooled'],
            default: 'solo'
        },
        fare: Number,
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'confirmed'
        },
        bookedAt: {
            type: Date,
            default: Date.now
        }
    }],
    totalEarnings: {
        type: Number,
        default: 0
    },
    surgeMultiplier: {
        type: Number,
        default: 1.0
    },
    isPooled: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// IMPORTANT: Remove any existing indexes that might cause issues
// Do NOT add 2dsphere index here

module.exports = mongoose.model('Ride', rideSchema);