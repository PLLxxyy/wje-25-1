import { Router } from 'express'
import { db } from '../database'

const router = Router()

router.get('/', (req: any, res) => {
  const userId = req.userId
  const rooms = db.prepare(`
    SELECT r.* FROM rooms r
    LEFT JOIN room_members rm ON r.id = rm.room_id
    WHERE r.owner_id = ? OR rm.user_id = ?
    GROUP BY r.id
  `).all(userId, userId)
  res.json(rooms)
})

router.post('/', (req: any, res) => {
  const userId = req.userId
  const { name } = req.body
  const result = db.prepare('INSERT INTO rooms (name, owner_id) VALUES (?, ?)').run(name, userId)
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid)
  res.json(room)
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.get('/:id/members', (req, res) => {
  const members = db.prepare(`
    SELECT rm.id, rm.room_id, rm.user_id, u.username, u.display_name as displayName
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = ?
  `).all(req.params.id)
  res.json(members)
})

router.post('/:id/members', (req, res) => {
  const { username } = req.body
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any
  if (!user) return res.status(404).json({ error: '用户不存在' })
  try {
    db.prepare('INSERT INTO room_members (room_id, user_id) VALUES (?, ?)').run(req.params.id, user.id)
    res.json({ ok: true })
  } catch (e: any) {
    res.status(400).json({ error: '该用户已是成员' })
  }
})

router.get('/:id/bills', (req, res) => {
  const bills = db.prepare(`
    SELECT b.id, b.room_id as roomId, b.payer_id as payerId, u.display_name as payerName,
           b.type, b.amount, b.date, b.note, b.created_at as createdAt
    FROM bills b
    JOIN users u ON b.payer_id = u.id
    WHERE b.room_id = ?
    ORDER BY b.date DESC
  `).all(req.params.id)
  res.json(bills)
})

router.post('/:id/bills', (req: any, res) => {
  const userId = req.userId
  const { type, amount, date, note, splitUserIds } = req.body
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: '金额必须大于 0' })
  }
  if (!Array.isArray(splitUserIds) || splitUserIds.length === 0) {
    return res.status(400).json({ error: '请选择至少一个分摊人' })
  }
  if (!type || !date) {
    return res.status(400).json({ error: '请填写完整的账单信息' })
  }
  const result = db.prepare('INSERT INTO bills (room_id, payer_id, type, amount, date, note) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.params.id, userId, type, amount, date, note || '')
  const billId = result.lastInsertRowid as number
  const share = amount / splitUserIds.length
  const splitStmt = db.prepare('INSERT INTO bill_splits (bill_id, user_id, share) VALUES (?, ?, ?)')
  splitUserIds.forEach((uid: number) => splitStmt.run(billId, uid, share))
  const bill = db.prepare(`
    SELECT b.id, b.room_id as roomId, b.payer_id as payerId, u.display_name as payerName,
           b.type, b.amount, b.date, b.note, b.created_at as createdAt
    FROM bills b
    JOIN users u ON b.payer_id = u.id
    WHERE b.id = ?
  `).get(billId)
  res.json(bill)
})

router.get('/bills/:id', (req, res) => {
  const bill = db.prepare(`
    SELECT b.id, b.room_id as roomId, b.payer_id as payerId, u.display_name as payerName,
           b.type, b.amount, b.date, b.note, b.created_at as createdAt
    FROM bills b
    JOIN users u ON b.payer_id = u.id
    WHERE b.id = ?
  `).get(req.params.id)
  if (!bill) return res.status(404).json({ error: '账单不存在' })
  const splits = db.prepare(`
    SELECT bs.id, bs.bill_id as billId, bs.user_id as userId, bs.share, u.username, u.display_name as displayName
    FROM bill_splits bs
    JOIN users u ON bs.user_id = u.id
    WHERE bs.bill_id = ?
  `).all(req.params.id)
  res.json({ ...bill, splits })
})

router.put('/bills/:id', (req: any, res) => {
  const { amount, note, splitUserIds } = req.body
  const billId = Number(req.params.id)
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: '金额必须大于 0' })
  }
  if (!Array.isArray(splitUserIds) || splitUserIds.length === 0) {
    return res.status(400).json({ error: '请选择至少一个分摊人' })
  }
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId)
  if (!bill) return res.status(404).json({ error: '账单不存在' })
  db.prepare('UPDATE bills SET amount = ?, note = ? WHERE id = ?')
    .run(amount, note || '', billId)
  db.prepare('DELETE FROM bill_splits WHERE bill_id = ?').run(billId)
  const share = amount / splitUserIds.length
  const splitStmt = db.prepare('INSERT INTO bill_splits (bill_id, user_id, share) VALUES (?, ?, ?)')
  splitUserIds.forEach((uid: number) => splitStmt.run(billId, uid, share))
  const updatedBill = db.prepare(`
    SELECT b.id, b.room_id as roomId, b.payer_id as payerId, u.display_name as payerName,
           b.type, b.amount, b.date, b.note, b.created_at as createdAt
    FROM bills b
    JOIN users u ON b.payer_id = u.id
    WHERE b.id = ?
  `).get(billId)
  res.json(updatedBill)
})

router.delete('/bills/:id', (req, res) => {
  db.prepare('DELETE FROM bill_splits WHERE bill_id = ?').run(req.params.id)
  db.prepare('DELETE FROM bills WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.get('/:id/balances', (req, res) => {
  const roomId = req.params.id
  const members = db.prepare(`
    SELECT u.id as userId, u.username, u.display_name as displayName
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = ?
  `).all(roomId) as any[]

  const owner = db.prepare('SELECT u.id as userId, u.username, u.display_name as displayName FROM rooms r JOIN users u ON r.owner_id = u.id WHERE r.id = ?').get(roomId) as any
  const allMembers = [...members]
  if (owner && !allMembers.find((m) => m.userId === owner.userId)) {
    allMembers.push(owner)
  }

  const balances: Record<number, number> = {}
  allMembers.forEach((m) => (balances[m.userId] = 0))

  const bills = db.prepare('SELECT * FROM bills WHERE room_id = ?').all(roomId) as any[]
  bills.forEach((bill) => {
    balances[bill.payer_id] += bill.amount
    const splits = db.prepare('SELECT * FROM bill_splits WHERE bill_id = ?').all(bill.id) as any[]
    splits.forEach((s) => {
      balances[s.user_id] -= s.share
    })
  })

  const balanceList = allMembers.map((m) => ({
    userId: m.userId,
    username: m.username,
    displayName: m.displayName,
    balance: Math.round(balances[m.userId] * 100) / 100,
  }))

  const creditors = balanceList.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance)
  const debtors = balanceList.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance)

  const transfers: any[] = []
  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].balance, -debtors[j].balance)
    transfers.push({
      from: debtors[j].displayName,
      to: creditors[i].displayName,
      amount: Math.round(amount * 100) / 100,
    })
    creditors[i].balance -= amount
    debtors[j].balance += amount
    if (creditors[i].balance < 0.01) i++
    if (debtors[j].balance > -0.01) j++
  }

  res.json({ balances: balanceList, transfers })
})

export default router
