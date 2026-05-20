require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userModel = require('./model/users/userSchema');

const seedSuperAdmin = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/labourjet';
        await mongoose.connect(dbUri);
        console.log('Connected to database at:', dbUri);

        const adminEmail = 'najilrahmanpm@gmail.com';
        const existingAdmin = await userModel.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`Admin account with email "${adminEmail}" already exists.`);
            // Update/Reset the admin details to ensure proper hashing and settings
            const hashedPassword = await bcrypt.hash('admin123', 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.userType = 'admin';
            existingAdmin.userName = 'Super Admin';
            existingAdmin.approvel = 'accepted';
            await existingAdmin.save();
            console.log('Existing admin account has been updated successfully with password "admin123".');
        } else {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const superAdmin = new userModel({
                userName: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                phone: 9876543210,
                userType: 'admin',
                approvel: 'accepted',
                state: 'DefaultState',
                postal: '000000',
                imgUrl: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg'
            });

            await superAdmin.save();
            console.log('Super Admin account successfully seeded!');
            console.log('Email: admin@labourjet.com');
            console.log('Password: admin123');
        }
    } catch (error) {
        console.error('Error seeding Super Admin account:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
    }
};

seedSuperAdmin();
