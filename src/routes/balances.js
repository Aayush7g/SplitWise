const express = require('express');
const router = express.Router();
const { getBalances } = require('../controllers/expenses');

router.route('/').get(getBalances);

module.exports = router;
