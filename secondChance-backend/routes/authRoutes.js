const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');

const router = express.Router();

// Register user
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const db = await connectToDatabase();
        const users = db.collection('users');

        const existingUser = await users.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            email,
            password: hashedPassword,
            firstName: firstName || '',
            lastName: lastName || ''
        };

        const result = await users.insertOne(user);

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertedId
        });
    } catch (error) {
        next(error);
    }
});

// Login user
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const db = await connectToDatabase();
        const users = db.collection('users');

        const user = await users.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET || 'secondchance-secret',
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        next(error);
    }
});

// Update user profile
router.put('/update', async (req, res, next) => {
    try {
        const { email, firstName, lastName } = req.body;

        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            });
        }

        const db = await connectToDatabase();
        const users = db.collection('users');

        const updates = {};

        if (firstName !== undefined) {
            updates.firstName = firstName;
        }

        if (lastName !== undefined) {
            updates.lastName = lastName;
        }

        const result = await users.updateOne(
            { email },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
