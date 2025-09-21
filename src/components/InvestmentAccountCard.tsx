import type { InvestmentAccount } from '@/lib/investments-db'

export default function InvestmentAccountCard({ account }: { account: InvestmentAccount }) {
  const topHoldings = [...(account.holdings || [])].slice(0, 3)
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-orange-500/20 bg-gray-800/50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">{account.name}</h3>
          <div className="text-xs text-gray-400">{account.id}</div>
        </div>
        <div className="text-sm text-gray-300 mb-2">
          <span className="font-medium text-gray-200">{account.institution}</span> · {account.accountType}
        </div>
        <div className="text-emerald-400 text-xl font-bold mb-3">
          ${account.balance.toLocaleString()}
        </div>
        {topHoldings.length ? (
          <div className="text-sm text-gray-300">
            <div className="font-medium text-gray-200 mb-1">Top Holdings</div>
            <ul className="list-disc list-inside space-y-0.5">
              {topHoldings.map((h, i) => (
                <li key={i}>
                  {h.symbol}: {h.quantity} @ ${h.avgPrice}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
