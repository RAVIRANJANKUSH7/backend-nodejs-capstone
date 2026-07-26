const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for Second Chance items
router.get('/', async (req, res, next) => {
    try {
        // Connect to MongoDB
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        // Initialize query
        let query = {};

        // Filter by name
        if (req.query.name) {
            query.name = {
                $regex: req.query.name,
                $options: 'i'
            };
        }

        // Filter by category
        if (req.query.category) {
            query.category = {
                $regex: req.query.category,
                $options: 'i'
            };
        }

        // Filter by condition
        if (req.query.condition) {
            query.condition = {
                $regex: req.query.condition,
                $options: 'i'
            };
        }

        // Filter by maximum age in years
        if (req.query.age_years) {
            query.age_years = {
                $lte: parseFloat(req.query.age_years)
            };
        }

        // Fetch matching items
        const gifts = await collection.find(query).toArray();

        res.json(gifts);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
