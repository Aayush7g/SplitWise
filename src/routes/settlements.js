const express = require('express');
const router = express.Router();
const { getSettlements } = require('../controllers/expenses');

router.route('/').get(getSettlements);

module.exports = router;
