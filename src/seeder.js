const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Expense = require('./models/expense');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Test data
const expenses = [
    {
        amount: 600,
        description: 'Dinner',
        paid_by: 'Shantanu',
        split_between: ['Shantanu', 'Sanket', 'Om'],
        split_type: 'equal'
    },
    {
        amount: 450,
        description: 'Groceries',
        paid_by: 'Sanket',
        split_between: ['Shantanu', 'Sanket', 'Om'],
        split_type: 'equal'
    },
    {
        amount: 350, // Updated from 300
        description: 'Petrol',
        paid_by: 'Om',
        split_between: ['Shantanu', 'Sanket', 'Om'],
        split_type: 'equal'
    },
    {
        amount: 500,
        description: 'Movie',
        paid_by: 'Shantanu',
        split_between: ['Shantanu', 'Sanket', 'Om'],
        split_type: 'equal'
    }
];

// Seed data
const seedData = async () => {
    try {
        // Clear existing data
        await Expense.deleteMany();
        console.log('Data cleared...');

        // Insert new data
        await Expense.insertMany(expenses);
        console.log('Data imported...');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
