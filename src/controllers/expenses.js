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
        // Get all expenses
        const expenses = await Expense.find();

        if (!expenses || expenses.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    balances: {},
                    settlements: []
                }
            });
        }

        // Calculate balances
        const balances = calculateBalances(expenses);

        // Calculate settlements
        const settlements = calculateSettlements(balances);
        
        res.status(200).json({
            success: true,
            data: {
                balances,
                settlements
            }
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

// @desc    Get expenses by user
// @route   GET /api/expenses/user-expenses/:userName
// @access  Public
exports.getUserExpenses = async (req, res, next) => {
    try {
        const { userName } = req.params;
        
        // Get expenses paid by the user
        const paidExpenses = await Expense.find({ paid_by: userName });
        
        // Get expenses where user is part of split
        const owedExpenses = await Expense.find({
            split_between: userName,
            paid_by: { $ne: userName }
        });

        // Calculate total amount paid
        const totalPaid = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate total amount owed
        const totalOwed = owedExpenses.reduce((sum, exp) => {
            const perPersonShare = exp.amount / exp.split_between.length;
            return sum + perPersonShare;
        }, 0);

        const expenseDetails = paidExpenses.map(exp => ({
            id: exp._id,
            description: exp.description,
            amount: exp.amount,
            split_type: exp.split_type,
            split_between: exp.split_between,
            created_at: exp.created_at,
            category: exp.category
        }));

        res.status(200).json({
            success: true,
            data: {
                userName,
                totalPaid,
                totalOwed,
                netBalance: totalPaid - totalOwed,
                expenseCount: paidExpenses.length,
                expenses: expenseDetails
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get total expenses for all users
// @route   GET /api/expenses/users/totals
// @access  Public
exports.getUsersTotalExpenses = async (req, res, next) => {
    try {
        const userTotals = await Expense.aggregate([
            {
                $facet: {
                    'paid': [
                        {
                            $group: {
                                _id: '$paid_by',
                                totalPaid: { $sum: '$amount' },
                                expenseCount: { $sum: 1 }
                            }
                        }
                    ],
                    'owed': [
                        {
                            $unwind: '$split_between'
                        },
                        {
                            $group: {
                                _id: '$split_between',
                                totalOwed: {
                                    $sum: {
                                        $divide: ['$amount', { $size: '$split_between' }]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        // Combine paid and owed amounts
        const combinedData = new Map();

        userTotals[0].paid.forEach(({ _id, totalPaid, expenseCount }) => {
            combinedData.set(_id, {
                name: _id,
                totalPaid: totalPaid,
                expenseCount: expenseCount,
                totalOwed: 0,
                netBalance: totalPaid
            });
        });

        userTotals[0].owed.forEach(({ _id, totalOwed }) => {
            if (combinedData.has(_id)) {
                const userData = combinedData.get(_id);
                userData.totalOwed = totalOwed;
                userData.netBalance = userData.totalPaid - totalOwed;
            } else {
                combinedData.set(_id, {
                    name: _id,
                    totalPaid: 0,
                    expenseCount: 0,
                    totalOwed: totalOwed,
                    netBalance: -totalOwed
                });
            }
        });

        res.status(200).json({
            success: true,
            data: Array.from(combinedData.values())
        });
    } catch (err) {
        next(err);
    }
};
