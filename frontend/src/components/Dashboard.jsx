import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Ghost,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

function Dashboard({ data, onReset }) {
  const { subscriptions, insight, summary } = data;
  const unusedSubs = subscriptions.filter((s) => s.possiblyUnused);
  const [expandedCard, setExpandedCard] = useState(null);

  const toggleCard = (index) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-violet-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg blur-sm opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                <Ghost className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GhostSubs
            </span>
          </div>
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-gray-700 font-medium shadow-sm hover:shadow"
          >
            Analyze Another
          </button>
        </motion.div>

        {/* AI Insight Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-blue-200/50 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Analysis Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">{insight}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              label: "Monthly Subscriptions",
              value: `€${summary.totalMonthly.toFixed(2)}`,
              icon: TrendingUp,
              gradient: "from-blue-500 to-cyan-500",
            },
            {
              label: "Annual Cost",
              value: `€${summary.totalAnnualCost.toFixed(0)}`,
              icon: Calendar,
              gradient: "from-indigo-500 to-purple-500",
            },
            {
              label: "Potential Savings",
              value: `€${summary.potentialSavings.toFixed(0)}/yr`,
              icon: DollarSign,
              gradient: "from-emerald-500 to-teal-500",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="relative group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 rounded-xl blur-xl transition-opacity`}
              ></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:border-gray-300/50 transition-all hover:shadow-lg">
                <div
                  className={`inline-flex p-2.5 bg-gradient-to-br ${stat.gradient} rounded-lg mb-3 shadow-md`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                >
                  {stat.value}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Unused Subscriptions Alert */}
        {unusedSubs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="relative group mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200/50 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Possibly Unused Subscriptions
                </h3>
              </div>
              <div className="space-y-3">
                {unusedSubs.map((sub, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-amber-100 shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {sub.displayName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Last charged {sub.daysSinceLastCharge} days ago
                      </p>
                    </div>
                    <p className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      €{sub.avgAmount}
                      {sub.frequency === "monthly"
                        ? "/mo"
                        : sub.frequency === "yearly"
                        ? "/yr"
                        : "/qtr"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* All Subscriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            All Subscriptions ({subscriptions.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subscriptions.map((sub, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.03 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 rounded-xl blur-xl transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:border-blue-200/50 transition-all hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-1 text-gray-900">
                        {sub.displayName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {sub.description}
                      </p>
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-full text-xs text-blue-700 font-medium">
                        {sub.category}
                      </span>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        €{sub.avgAmount}
                      </p>
                      <p className="text-sm text-gray-500">
                        /
                        {sub.frequency === "monthly"
                          ? "mo"
                          : sub.frequency === "yearly"
                          ? "yr"
                          : "qtr"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200/50 mb-3">
                    <span>{sub.transactionCount} charges</span>
                    <span className="font-medium">
                      Total: €{sub.totalSpent}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleCard(i)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium py-2 hover:bg-blue-50/50 rounded-lg"
                  >
                    {expandedCard === i ? (
                      <>
                        Hide Details <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show Details <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {expandedCard === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200/50 space-y-2"
                    >
                      <p className="text-xs text-gray-500 mb-3 uppercase font-semibold tracking-wide">
                        Transaction History
                      </p>
                      {sub.transactions.slice(0, 5).map((txn, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg p-3 border border-gray-100"
                        >
                          <span className="text-gray-700">{txn.date}</span>
                          <span className="font-semibold text-gray-900">
                            €{txn.amount}
                          </span>
                        </div>
                      ))}
                      {sub.transactions.length > 5 && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                          + {sub.transactions.length - 5} more transactions
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
