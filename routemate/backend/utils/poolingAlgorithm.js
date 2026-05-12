class PoolingAlgorithm {
    // Calculate fare based on booking type and surge
    static calculateFare(baseFare, bookingType, passengerCount = 1, surgeMultiplier = 1.0) {
        if (bookingType === 'solo') {
            return Math.round(baseFare * surgeMultiplier);
        } else {
            // Pooled fare: split among passengers, with 20% discount for pooling
            const pooledFare = (baseFare * surgeMultiplier) / passengerCount;
            const discountedFare = pooledFare * 0.8; // 20% discount for pooling
            return Math.round(discountedFare);
        }
    }

    // Find matching rides for pooling
    static findMatchingRides(userRide, availableRides) {
        const timeWindow = 30 * 60 * 1000; // 30 minutes
        
        return availableRides.filter(ride => {
            const timeDiff = Math.abs(new Date(ride.departureTime) - new Date(userRide.departureTime));
            const isSameRoute = this.isSameRoute(ride.pickupLocation, userRide.pickupLocation);
            const hasSeats = (ride.passengers.length < ride.availableSeats);
            
            return timeDiff <= timeWindow && isSameRoute && hasSeats && ride.status === 'scheduled';
        });
    }

    // Check if routes are similar
    static isSameRoute(location1, location2) {
        if (!location1 || !location2) return false;
        const distance = this.calculateDistance(
            location1.lat, location1.lng,
            location2.lat, location2.lng
        );
        return distance < 1000; // Within 1km
    }

    // Calculate distance between two coordinates (Haversine formula)
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    // Calculate surge multiplier based on demand
    static calculateSurgeMultiplier(totalRequests, availableDrivers, baseMultiplier = 1.0) {
        const ratio = totalRequests / (availableDrivers + 1);
        if (ratio > 3) return Math.min(2.0, baseMultiplier * 1.5);
        if (ratio > 2) return Math.min(1.8, baseMultiplier * 1.3);
        if (ratio > 1.5) return Math.min(1.5, baseMultiplier * 1.2);
        return baseMultiplier;
    }
}

module.exports = PoolingAlgorithm;