const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    admin: {
        type: String,
        required: [true, 'Group admin is required'],
        trim: true
    },
    members: [{
        type: String,
        trim: true
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    total_expenses: {
        type: Number,
        default: 0
    }
});

// Middleware to ensure admin is always in members
groupSchema.pre('save', function(next) {
    if (!this.members.includes(this.admin)) {
        this.members.push(this.admin);
    }
    next();
});

module.exports = mongoose.model('Group', groupSchema);
