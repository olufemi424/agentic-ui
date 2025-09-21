type SectorMap = Record<string, number>

export default function InvestmentInsightsCard({
  totals,
  byInstitution,
  bySector,
  topHolding,
}: {
  totals: number
  byInstitution: Record<string, number>
  bySector: SectorMap
  topHolding: { symbol: string; position: number } | null
}) {
  const sectors = Object.entries(bySector)
  const sumSector = sectors.reduce((s, [, v]) => s + v, 0) || 1
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-orange-500/20 bg-gray-800/50 p-4 text-gray-200">
      <div className="text-xl font-semibold mb-2">Portfolio Insights</div>
      <div className="mb-3">Total Balance: <span className="text-emerald-400 font-bold">${totals.toLocaleString()}</span></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="font-medium mb-1">By Institution</div>
          <ul className="text-sm space-y-0.5">
            {Object.entries(byInstitution).map(([k, v]) => (
              <li key={k}>
                {k}: ${v.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">By Sector</div>
          <div className="flex items-end gap-2 h-24">
            {sectors.map(([k, v]) => (
              <div key={k} className="bg-orange-500/60" style={{ width: `${Math.max(4, (v / sumSector) * 100)}px`, height: `${Math.max(8, (v / sumSector) * 96)}px` }} title={`${k}: $${v.toLocaleString()}`} />
            ))}
          </div>
          <div className="mt-1 text-xs text-gray-400">Relative bars (POC)</div>
        </div>
      </div>

      {topHolding ? (
        <div className="mt-3 text-sm">
          Top Holding: <span className="font-medium">{topHolding.symbol}</span> (${topHolding.position.toLocaleString()})
        </div>
      ) : null}
    </div>
  )
}
