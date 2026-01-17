/**
 * Subscription Detection Service
 * Uses deterministic logic to identify recurring payment patterns
 */

export function detectSubscriptions(transactions) {
  const merchantGroups = {};

  transactions.forEach((txn) => {
    if (!merchantGroups[txn.merchant]) {
      merchantGroups[txn.merchant] = [];
    }
    merchantGroups[txn.merchant].push(txn);
  });

  const subscriptions = [];

  Object.entries(merchantGroups).forEach(([merchant, txns]) => {
    if (txns.length < 2) return;

    txns.sort((a, b) => a.date - b.date);

    const intervals = [];
    for (let i = 1; i < txns.length; i++) {
      const daysDiff =
        (txns[i].date - txns[i - 1].date) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }

    const avgInterval =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const amounts = txns.map((t) => t.amount);
    const avgAmount =
      amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const amountVariance = maxAmount - minAmount;

    let frequency = null;
    let isSubscription = false;

    if (
      avgInterval >= 28 &&
      avgInterval <= 35 &&
      amountVariance < avgAmount * 0.15
    ) {
      frequency = "monthly";
      isSubscription = true;
    } else if (
      avgInterval >= 350 &&
      avgInterval <= 380 &&
      amountVariance < avgAmount * 0.15
    ) {
      frequency = "yearly";
      isSubscription = true;
    } else if (
      avgInterval >= 85 &&
      avgInterval <= 95 &&
      amountVariance < avgAmount * 0.15
    ) {
      frequency = "quarterly";
      isSubscription = true;
    }

    if (isSubscription) {
      const lastTransaction = txns[txns.length - 1];
      const daysSinceLastCharge =
        (new Date() - lastTransaction.date) / (1000 * 60 * 60 * 24);
      const expectedInterval = avgInterval;
      const bufferDays = expectedInterval * 0.5;
      const possiblyUnused =
        daysSinceLastCharge > expectedInterval + bufferDays;
      const totalSpent = amounts.reduce((sum, val) => sum + val, 0);

      subscriptions.push({
        merchant,
        frequency,
        avgAmount: Math.round(avgAmount * 100) / 100,
        minAmount: Math.round(minAmount * 100) / 100,
        maxAmount: Math.round(maxAmount * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        transactionCount: txns.length,
        firstCharged: txns[0].date,
        lastCharged: lastTransaction.date,
        daysSinceLastCharge: Math.round(daysSinceLastCharge),
        avgIntervalDays: Math.round(avgInterval),
        possiblyUnused,
        transactions: txns.map((t) => ({
          date: t.date.toISOString().split("T")[0],
          amount: t.amount,
          description: t.description,
        })),
      });
    }
  });

  subscriptions.sort((a, b) => {
    const costA = a.frequency === "monthly" ? a.avgAmount : a.avgAmount / 12;
    const costB = b.frequency === "monthly" ? b.avgAmount : b.avgAmount / 12;
    return costB - costA;
  });

  return subscriptions;
}
