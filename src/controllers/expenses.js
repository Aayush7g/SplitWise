const Expense = require('../models/expense');
const { calculateBalances, calculateSettlements } = require('../utils/settlement');

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Public
exports.addExpense = async (req, res, next) => {
    try {
        const expense = await Expense.create(req.body);
        res.status(201).json({
            success: true,
            data: expense
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
exports.getExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find().sort('-created_at');
        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Public
exports.updateExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!expense) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public
exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get net balances
// @route   GET /api/balances
// @access  Public
exports.getBalances = async (req, res, next) => {
    try {
        const expenses = await Expense.find();
        const balances = calculateBalances(expenses);
        
        res.status(200).json({
            success: true,
            data: balances
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get settlements
// @route   GET /api/settlements
// @access  Public
exports.getSettlements = async (req, res, next) => {
    try {
        const expenses = await Expense.find();
        const balances = calculateBalances(expenses);
        const settlements = calculateSettlements(balances);
        
        res.status(200).json({
            success: true,
            data: settlements
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all unique people
// @route   GET /api/people
// @access  Public
exports.getPeople = async (req, res, next) => {
    try {
        const expenses = await Expense.find();
        const peopleSet = new Set();
        
        // Add all payers
        expenses.forEach(expense => {
            peopleSet.add(expense.paid_by);
            // Add all people expense is split between
            expense.split_between.forEach(person => peopleSet.add(person));
        });
        
        const people = Array.from(peopleSet).sort();
        
        res.status(200).json({
            success: true,
            count: people.length,
            data: people
        });
    } catch (err) {
        next(err);
    }
};
