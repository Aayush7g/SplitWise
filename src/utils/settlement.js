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

        // Subtract split amounts from each person
        expense.split_between.forEach((person, index) => {
            balances[person] -= expense.split_values[index];
        });
    });

    return balances;
};

// Calculate minimum number of transactions needed for settlement
const calculateSettlements = (balances) => {
    const settlements = [];
    const people = Object.keys(balances);
    
    // Convert balances to array of objects for easier sorting
    let amounts = people.map(person => ({
        person,
        amount: Math.round(balances[person] * 100) / 100 // Round to 2 decimal places
    }));

    while (true) {
        // Sort by amount (descending for positive, ascending for negative)
        amounts.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        
        // If all balances are 0 (or very close to 0 due to floating point), we're done
        if (Math.abs(amounts[0].amount) < 0.01) break;

        const maxDebt = amounts[amounts.length - 1];
        const maxCredit = amounts[0];

        // Calculate transfer amount
        const transferAmount = Math.min(Math.abs(maxDebt.amount), maxCredit.amount);

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
