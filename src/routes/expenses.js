const express = require('express');
const router = express.Router();
const {
    addExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
    getUserExpenses,
    getUsersTotalExpenses
} = require('../controllers/expenses');
const { validateExpense } = require('../middleware/validator');

router
    .route('/')
    .get(getExpenses)
    .post(validateExpense, addExpense);

router
    .route('/:id')
    .put(validateExpense, updateExpense)
    .delete(deleteExpense);

// Add new routes for user expenses
router.get('/user-expenses/:userName', getUserExpenses);
router.get('/users/totals', getUsersTotalExpenses);

module.exports = router;
