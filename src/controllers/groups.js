const Group = require('../models/group');
const Expense = require('../models/expense');
const { calculateBalances, calculateSettlements } = require('../utils/settlement');

// @desc    Create new group
// @route   POST /api/groups
// @access  Public
exports.createGroup = async (req, res, next) => {
    try {
        const group = await Group.create(req.body);
        res.status(201).json({
            success: true,
            data: group
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Public
exports.getGroups = async (req, res, next) => {
    try {
        const groups = await Group.find();
        res.status(200).json({
            success: true,
            count: groups.length,
            data: groups
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get group details
// @route   GET /api/groups/:groupId
// @access  Public
exports.getGroupDetails = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }
        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update group
// @route   PUT /api/groups/:groupId
// @access  Public
exports.updateGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        // Only admin can update group
        if (req.body.admin && group.admin !== req.body.admin) {
            return res.status(403).json({
                success: false,
                error: 'Only current admin can transfer admin rights'
            });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.groupId,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: updatedGroup
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete group
// @route   DELETE /api/groups/:groupId
// @access  Public
exports.deleteGroup = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        await group.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add member to group
// @route   POST /api/groups/:groupId/members
// @access  Public
exports.addGroupMember = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        const { member } = req.body;
        if (!member) {
            return res.status(400).json({
                success: false,
                error: 'Please provide member name'
            });
        }

        if (group.members.includes(member)) {
            return res.status(400).json({
                success: false,
                error: 'Member already exists in group'
            });
        }

        group.members.push(member);
        await group.save();

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members
// @access  Public
exports.removeGroupMember = async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        const { member } = req.body;
        if (!member) {
            return res.status(400).json({
                success: false,
                error: 'Please provide member name'
            });
        }

        if (member === group.admin) {
            return res.status(400).json({
                success: false,
                error: 'Cannot remove group admin'
            });
        }

        if (!group.members.includes(member)) {
            return res.status(404).json({
                success: false,
                error: 'Member not found in group'
            });
        }

        group.members = group.members.filter(m => m !== member);
        await group.save();

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get group expenses
// @route   GET /api/groups/:groupId/expenses
// @access  Public
exports.getGroupExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find({ group: req.params.groupId })
            .sort('-created_at');

        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        // Calculate total expenses per member
        const memberExpenses = {};
        group.members.forEach(member => {
            memberExpenses[member] = {
                paid: 0,
                owed: 0,
                net: 0
            };
        });

        expenses.forEach(expense => {
            const payer = expense.paid_by;
            const perPersonShare = expense.amount / expense.split_between.length;

            // Add amount paid
            if (memberExpenses[payer]) {
                memberExpenses[payer].paid += expense.amount;
            }

            // Subtract shares
            expense.split_between.forEach(member => {
                if (memberExpenses[member]) {
                    memberExpenses[member].owed += perPersonShare;
                }
            });
        });

        // Calculate net balances
        Object.keys(memberExpenses).forEach(member => {
            memberExpenses[member].net = 
                memberExpenses[member].paid - memberExpenses[member].owed;
        });

        res.status(200).json({
            success: true,
            count: expenses.length,
            total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
            memberExpenses,
            data: expenses
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get group balances
// @route   GET /api/groups/:groupId/balances
// @access  Public
exports.getGroupBalances = async (req, res, next) => {
    try {
        const expenses = await Expense.find({ group: req.params.groupId });
        
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        const balances = calculateBalances(expenses);
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

// @desc    Get group status with expenses and balances
// @route   GET /api/groups/:groupId/status
// @access  Public
exports.getGroupStatus = async (req, res, next) => {
    try {
        const { groupId } = req.params;

        // Get group details
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Get all expenses for this group
        const expenses = await Expense.find({ group: groupId })
            .sort('-created_at');

        // Calculate balances
        let balances = {};
        group.members.forEach(member => {
            balances[member] = {
                paid: 0,
                owes: 0,
                netBalance: 0,
                owesToMembers: {},
                isOwedBy: {}
            };
        });

        // Calculate expenses and splits
        expenses.forEach(expense => {
            const paidBy = expense.paid_by;
            const amount = expense.amount;
            const splitBetween = expense.split_between;
            
            let splitAmounts = [];
            if (expense.split_type === 'equal') {
                const perPersonShare = amount / splitBetween.length;
                splitAmounts = new Array(splitBetween.length).fill(perPersonShare);
            } else {
                splitAmounts = expense.split_values;
            }

            // Add amount paid
            balances[paidBy].paid += amount;

            // Calculate what each person owes
            splitBetween.forEach((person, index) => {
                if (person !== paidBy) {
                    const shareAmount = splitAmounts[index];
                    balances[person].owes += shareAmount;
                    
                    // Track who owes whom
                    balances[person].owesToMembers[paidBy] = 
                        (balances[person].owesToMembers[paidBy] || 0) + shareAmount;
                    
                    // Track who is owed by whom
                    balances[paidBy].isOwedBy[person] = 
                        (balances[paidBy].isOwedBy[person] || 0) + shareAmount;
                }
            });
        });

        // Calculate net balances and round all numbers
        Object.keys(balances).forEach(member => {
            balances[member].netBalance = 
                Math.round((balances[member].paid - balances[member].owes) * 100) / 100;
            balances[member].paid = Math.round(balances[member].paid * 100) / 100;
            balances[member].owes = Math.round(balances[member].owes * 100) / 100;

            // Round owesToMembers amounts
            Object.keys(balances[member].owesToMembers).forEach(otherMember => {
                balances[member].owesToMembers[otherMember] = 
                    Math.round(balances[member].owesToMembers[otherMember] * 100) / 100;
            });

            // Round isOwedBy amounts
            Object.keys(balances[member].isOwedBy).forEach(otherMember => {
                balances[member].isOwedBy[otherMember] = 
                    Math.round(balances[member].isOwedBy[otherMember] * 100) / 100;
            });
        });

        // Categorize expenses
        const expensesByCategory = expenses.reduce((acc, exp) => {
            const category = exp.category || 'Others';
            if (!acc[category]) {
                acc[category] = {
                    total: 0,
                    count: 0,
                    expenses: []
                };
            }
            acc[category].total += exp.amount;
            acc[category].count += 1;
            acc[category].expenses.push({
                id: exp._id,
                description: exp.description,
                amount: exp.amount,
                paid_by: exp.paid_by,
                split_between: exp.split_between,
                split_type: exp.split_type,
                split_values: exp.split_values,
                created_at: exp.created_at
            });
            return acc;
        }, {});

        // Calculate total statistics
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const expenseCount = expenses.length;
        const avgExpensePerPerson = totalExpenses / group.members.length;

        res.status(200).json({
            success: true,
            data: {
                group: {
                    id: group._id,
                    name: group.name,
                    description: group.description,
                    admin: group.admin,
                    members: group.members,
                    created_at: group.created_at
                },
                statistics: {
                    totalExpenses: Math.round(totalExpenses * 100) / 100,
                    expenseCount,
                    avgExpensePerPerson: Math.round(avgExpensePerPerson * 100) / 100,
                    memberCount: group.members.length
                },
                balances,
                expensesByCategory,
                recentExpenses: expenses.slice(0, 5).map(exp => ({
                    id: exp._id,
                    description: exp.description,
                    amount: exp.amount,
                    paid_by: exp.paid_by,
                    split_between: exp.split_between,
                    split_type: exp.split_type,
                    created_at: exp.created_at
                }))
            }
        });

    } catch (err) {
        next(err);
    }
};
