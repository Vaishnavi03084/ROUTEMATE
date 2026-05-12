// Smart pooling algorithm for matching passengers
class PoolMatching {
    static async findMatchingRides(userRide, availableRides) {
        // Find rides with similar routes and times
        const matchingRides = availableRides.filter(ride => {
            const timeDiff = Math.abs(
                new Date(ride.departureTime) - new Date(userRide.departureTime)
            );
            const timeWindow = 30 * 60 * 1000; // 30 minutes window
            
            // Check if within time window and has available seats
            return timeDiff <= timeWindow && ride.availableSeats > 0;
        });
        
        // Calculate pooled fare for each matching ride
        return matchingRides.map(ride => {
            const totalPassengers = ride.passengers.length + 1;
            const pooledFare = ride.baseFare / (totalPassengers);
            
            return {
                ride,
                pooledFare: Math.round(pooledFare),
                isPooled: totalPassengers > 1
            };
        });
    }
    
    static calculateFare(baseFare, bookingType, passengerCount = 1) {
        if (bookingType === 'solo') {
            return baseFare;
        } else {
            // Pooled fare is divided among passengers
            return Math.round(baseFare / passengerCount);
        }
    }
}

module.exports = PoolMatching;