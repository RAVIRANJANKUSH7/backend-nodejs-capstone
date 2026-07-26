const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

const directoryPath = 'public/images';

if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const secondChanceItems = await collection.find({}).toArray();

        res.json(secondChanceItems);
    } catch (e) {
        logger.error(e, 'oops something went wrong');
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        const item = { ...req.body };

        if (req.file) {
            item.image = `/images/${req.file.filename}`;
        }

        const result = await collection.insertOne(item);

        const secondChanceItem = await collection.findOne({
            _id: result.insertedId
        });

        res.status(201).json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        const secondChanceItem = await collection.findOne({
            id: req.params.id
        });

        if (!secondChanceItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Update an existing item
router.put('/:id', upload.single('file'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        const updates = { ...req.body };

        if (req.file) {
            updates.image = `/images/${req.file.filename}`;
        }

        const result = await collection.updateOne(
            { id: req.params.id },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const updatedItem = await collection.findOne({
            id: req.params.id
        });

        res.json(updatedItem);
    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        const result = await collection.deleteOne({
            id: req.params.id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
