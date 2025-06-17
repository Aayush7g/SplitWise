const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be positive']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    paid_by: {
        type: String,
        required: [true, 'Paid by is required'],
        trim: true
    },
    split_between: [{
        type: String,
        trim: true
    }],
    split_type: {
        type: String,
        enum: ['equal', 'exact', 'percentage'],
        default: 'equal'
    },
    split_values: [{
        type: Number
    }],
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        trim: true,
        default: 'Others'
    },
    recurring: {
        type: Boolean,
        default: false
    },
    recurring_interval: {
        type: String,
        enum: ['weekly', 'monthly'],
        default: 'monthly'
    }
});

// Middleware to validate split values based on split_type
expenseSchema.pre('save', function(next) {
    if (this.split_type === 'equal') {
        this.split_values = new Array(this.split_between.length).fill(this.amount / this.split_between.length);
    } else if (this.split_type === 'exact') {
        const sum = this.split_values.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - this.amount) > 0.01) {
            throw new Error('Sum of split values must equal the total amount');
        }
    } else if (this.split_type === 'percentage') {
        const sum = this.split_values.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 100) > 0.01) {
            throw new Error('Sum of percentages must equal 100');
        }
        this.split_values = this.split_values.map(percent => (percent / 100) * this.amount);
    }
    next();
});

module.exports = mongoose.model('Expense', expenseSchema);
