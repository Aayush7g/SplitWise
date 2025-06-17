const express = require('express');
const router = express.Router();
const {
    addExpense,
    getExpenses,
    updateExpense,
    deleteExpense
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

module.exports = router;
