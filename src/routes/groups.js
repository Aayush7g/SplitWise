const express = require('express');
const router = express.Router();
const { 
    createGroup, 
    getGroups, 
    getGroupDetails, 
    updateGroup, 
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    getGroupExpenses,
    getGroupBalances,
    getGroupStatus
} = require('../controllers/groups');
const { validateGroup } = require('../middleware/validator');

router
    .route('/')
    .post(validateGroup, createGroup)
    .get(getGroups);

router
    .route('/:groupId')
    .get(getGroupDetails)
    .put(validateGroup, updateGroup)
    .delete(deleteGroup);

router
    .route('/:groupId/members')
    .post(addGroupMember)
    .delete(removeGroupMember);

router.get('/:groupId/expenses', getGroupExpenses);
router.get('/:groupId/balances', getGroupBalances);
router.get('/:groupId/status', getGroupStatus);

module.exports = router;
