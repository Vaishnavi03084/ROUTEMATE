const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// User Schema (simplified for script)
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    role: String,
    isVerified: Boolean,
    createdAt: Date
});

const User = mongoose.model('User', userSchema);

const createUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/routemate');
        console.log('Connected to MongoDB');

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        
        const users = [
            {
                name: "Admin User",
                email: "admin@routemate.com",
                password: await bcrypt.hash("admin123", salt),
                phone: "9876543210",
                role: "admin",
                isVerified: true,
                createdAt: new Date()
            },
            {
                name: "Driver User",
                email: "driver@routemate.com",
                password: await bcrypt.hash("driver123", salt),
                phone: "9876543211",
                role: "driver",
                isVerified: true,
                createdAt: new Date(),
                vehicleDetails: {
                    vehicleNumber: "KA01AB1234",
                    vehicleModel: "Toyota Innova",
                    seatingCapacity: 4,
                    isActive: true
                }
            },
            {
                name: "Regular User",
                email: "user@routemate.com",
                password: await bcrypt.hash("user123", salt),
                phone: "9876543212",
                role: "user",
                isVerified: true,
                createdAt: new Date()
            }
        ];

        // Delete existing users with these emails
        for (const user of users) {
            await User.deleteOne({ email: user.email });
        }
        console.log('Cleaned existing users');

        // Insert new users
        await User.insertMany(users);
        console.log('✅ Users created successfully!');
        console.log('Demo Credentials:');
        console.log('Admin: admin@routemate.com / admin123');
        console.log('Driver: driver@routemate.com / driver123');
        console.log('User: user@routemate.com / user123');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createUsers();