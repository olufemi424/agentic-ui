export async function createInvestment(payload: any) {
  const res = await fetch('/api/investments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create investment')
  return res.json()
}

export async function updateInvestment(id: string, patch: any) {
  const res = await fetch(`/api/investments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update investment')
  return res.json()
}

export async function deleteInvestment(id: string) {
  const res = await fetch(`/api/investments/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete investment')
  return res.json()
}
