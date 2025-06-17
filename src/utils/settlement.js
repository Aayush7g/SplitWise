// Calculate net balances for each person
const calculateBalances = (expenses) => {
    const balances = {};

    // Initialize balances
    expenses.forEach(expense => {
        if (!balances[expense.paid_by]) balances[expense.paid_by] = 0;
        expense.split_between.forEach(person => {
            if (!balances[person]) balances[person] = 0;
        });
    });

    // Calculate net amounts
    expenses.forEach(expense => {
        // Add full amount to payer
        balances[expense.paid_by] += expense.amount;

        // Calculate split amounts based on split_type
        let splitAmounts = [];
        const numPeople = expense.split_between.length;

        if (expense.split_type === 'equal') {
            const equalShare = expense.amount / numPeople;
            splitAmounts = new Array(numPeople).fill(equalShare);
        } else if (expense.split_values && expense.split_values.length > 0) {
            splitAmounts = expense.split_values;
        } else {
            // Default to equal split if no split values provided
            const equalShare = expense.amount / numPeople;
            splitAmounts = new Array(numPeople).fill(equalShare);
        }

        // Subtract split amounts from each person
        expense.split_between.forEach((person, index) => {
            balances[person] -= splitAmounts[index];
        });
    });

    // Round all balances to 2 decimal places
    Object.keys(balances).forEach(person => {
        balances[person] = Math.round(balances[person] * 100) / 100;
    });

    return balances;
};

// Calculate minimum number of transactions needed for settlement
const calculateSettlements = (balances) => {
    const settlements = [];
    const people = Object.keys(balances).filter(person => balances[person] !== null);
    
    // Convert balances to array of objects for easier sorting
    let amounts = people.map(person => ({
        person,
        amount: balances[person]
    }));

    // Remove people with zero balance
    amounts = amounts.filter(a => Math.abs(a.amount) >= 0.01);

    while (amounts.length > 1) {
        // Sort by amount (descending for positive balances)
        amounts.sort((a, b) => b.amount - a.amount);
        
        const maxCredit = amounts[0];
        const maxDebt = amounts[amounts.length - 1];        // Calculate transfer amount (minimum of the absolute values)
        const transferAmount = Math.min(maxCredit.amount, Math.abs(maxDebt.amount));

        if (transferAmount < 0.01) break; // Stop if transfer amount is negligible

        // Round transfer amount to 2 decimal places
        const roundedAmount = Math.round(transferAmount * 100) / 100;

        // Add settlement
        settlements.push({
            from: maxDebt.person,
            to: maxCredit.person,
            amount: roundedAmount
        });

        // Update balances
        maxCredit.amount -= roundedAmount;
        maxDebt.amount += roundedAmount;

        // Remove settled people
        amounts = amounts.filter(a => Math.abs(a.amount) >= 0.01);

        // Update balances
        maxCredit.amount -= transferAmount;
        maxDebt.amount += transferAmount;

        // Add settlement
        settlements.push({
            from: maxDebt.person,
            to: maxCredit.person,
            amount: Math.round(transferAmount * 100) / 100 // Round to 2 decimal places
        });
    }

    return settlements;
};

module.exports = {
    calculateBalances,
    calculateSettlements
};
