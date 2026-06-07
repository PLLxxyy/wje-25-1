import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Users, Trash2, Edit2 } from 'lucide-react'
import { useRoomMembers, useBills, useBalances } from '@/hooks/useRooms'
import { formatDate, formatMoney } from '@/utils/format'
import type { BillDetail } from '@/types'

const BILL_TYPES = ['水电', '网费', '日用品', '聚餐', '房租', '其他']

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>()
  const roomId = Number(id)
  const { members, inviteMember } = useRoomMembers(roomId)
  const { bills, addBill, getBillDetail, editBill, deleteBill } = useBills(roomId)
  const { balances, transfers, fetchBalances } = useBalances(roomId)

  const [showBillForm, setShowBillForm] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')

  const [editingBill, setEditingBill] = useState<BillDetail | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    note: '',
    splitUserIds: [] as number[],
  })
  const [editError, setEditError] = useState('')

  const [form, setForm] = useState({
    type: '水电',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
    splitUserIds: [] as number[],
  })
  const [formError, setFormError] = useState('')

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('请输入大于 0 的金额')
      return
    }
    if (form.splitUserIds.length === 0) {
      setFormError('请选择至少一个分摊人')
      return
    }
    try {
      await addBill({
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        note: form.note,
        splitUserIds: form.splitUserIds,
      })
      await fetchBalances()
      setForm({ type: '水电', amount: '', date: new Date().toISOString().slice(0, 10), note: '', splitUserIds: [] })
      setShowBillForm(false)
    } catch (err: any) {
      setFormError(err.response?.data?.error || '保存失败，请重试')
    }
  }

  const toggleSplitUser = (userId: number) => {
    setForm((prev) => ({
      ...prev,
      splitUserIds: prev.splitUserIds.includes(userId)
        ? prev.splitUserIds.filter((id) => id !== userId)
        : [...prev.splitUserIds, userId],
    }))
  }

  const handleOpenEdit = async (billId: number) => {
    setEditError('')
    const detail = await getBillDetail(billId)
    setEditingBill(detail)
    setEditForm({
      amount: detail.amount.toString(),
      note: detail.note,
      splitUserIds: detail.splits.map((s) => s.userId),
    })
  }

  const handleCloseEdit = () => {
    setEditingBill(null)
    setEditForm({ amount: '', note: '', splitUserIds: [] })
    setEditError('')
  }

  const toggleEditSplitUser = (userId: number) => {
    setEditForm((prev) => ({
      ...prev,
      splitUserIds: prev.splitUserIds.includes(userId)
        ? prev.splitUserIds.filter((id) => id !== userId)
        : [...prev.splitUserIds, userId],
    }))
  }

  const handleEditBill = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError('')
    if (!editingBill) return
    if (!editForm.amount || Number(editForm.amount) <= 0) {
      setEditError('请输入大于 0 的金额')
      return
    }
    if (editForm.splitUserIds.length === 0) {
      setEditError('请选择至少一个分摊人')
      return
    }
    try {
      await editBill(editingBill.id, {
        amount: Number(editForm.amount),
        note: editForm.note,
        splitUserIds: editForm.splitUserIds,
      })
      await fetchBalances()
      handleCloseEdit()
    } catch (err: any) {
      setEditError(err.response?.data?.error || '保存失败，请重试')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">房间账单</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowBillForm(true)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700">
          <Plus size={16} /> 记一笔
        </button>
        <button onClick={() => { setShowSettle(true); fetchBalances() }} className="flex items-center gap-1 bg-white border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
          <Users size={16} /> 结算
        </button>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1 bg-white border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
          <Users size={16} /> 邀请室友
        </button>
      </div>

      {showInvite && (
        <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-2">
          <input placeholder="输入用户名" value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={async () => { await inviteMember(inviteUsername); setInviteUsername(''); setShowInvite(false) }} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm">邀请</button>
          <button onClick={() => setShowInvite(false)} className="text-gray-500 px-3 py-2 text-sm">取消</button>
        </div>
      )}

      {showBillForm && (
        <form onSubmit={handleAddBill} className="bg-white rounded-xl shadow p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              {BILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="金额" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="备注" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">参与分摊的人</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {members.map((m) => (
                <label key={m.userId} className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.splitUserIds.includes(m.userId)}
                    onChange={() => toggleSplitUser(m.userId)}
                  />
                  {m.displayName}
                </label>
              ))}
            </div>
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">保存</button>
            <button type="button" onClick={() => { setShowBillForm(false); setFormError('') }} className="text-gray-500 px-4 py-2 text-sm">取消</button>
          </div>
        </form>
      )}

      {editingBill && (
        <form onSubmit={handleEditBill} className="bg-white rounded-xl shadow p-4 mb-6 space-y-3 border-2 border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-emerald-700">编辑账单</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{editingBill.type}</span>
            <span className="text-xs text-gray-500">{formatDate(editingBill.date)} · {editingBill.payerName} 垫付</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="金额" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="备注" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">参与分摊的人</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {members.map((m) => (
                <label key={m.userId} className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.splitUserIds.includes(m.userId)}
                    onChange={() => toggleEditSplitUser(m.userId)}
                  />
                  {m.displayName}
                </label>
              ))}
            </div>
          </div>
          {editError && <p className="text-sm text-red-500">{editError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">保存修改</button>
            <button type="button" onClick={handleCloseEdit} className="text-gray-500 px-4 py-2 text-sm">取消</button>
          </div>
        </form>
      )}

      {showSettle && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h3 className="font-semibold mb-3">当前余额</h3>
          <div className="space-y-2 mb-4">
            {balances.map((b) => (
              <div key={b.userId} className="flex justify-between text-sm">
                <span>{b.displayName}</span>
                <span className={b.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                  {b.balance >= 0 ? '+' : ''}{formatMoney(b.balance)}
                </span>
              </div>
            ))}
          </div>
          <h3 className="font-semibold mb-3">最优转账方案</h3>
          {transfers.length === 0 ? (
            <p className="text-sm text-gray-500">所有人已平账，无需转账</p>
          ) : (
            <div className="space-y-2">
              {transfers.map((t, i) => (
                <div key={i} className="text-sm bg-gray-50 px-3 py-2 rounded">
                  <span className="font-medium">{t.from}</span> 转给 <span className="font-medium">{t.to}</span> {formatMoney(t.amount)}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowSettle(false)} className="mt-4 text-sm text-gray-500">关闭</button>
        </div>
      )}

      <div className="space-y-3">
        {bills.map((bill) => (
          <div key={bill.id} className="bg-white rounded-xl shadow p-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{bill.type}</span>
                <span className="font-medium text-sm">{formatMoney(bill.amount)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{formatDate(bill.date)} · {bill.payerName} 垫付 · {bill.note}</div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => handleOpenEdit(bill.id)} className="text-gray-400 hover:text-emerald-600 p-1"><Edit2 size={16} /></button>
              <button onClick={async () => {
                if (confirm('确定要删除这条账单吗？')) {
                  try {
                    await deleteBill(bill.id)
                    await fetchBalances()
                  } catch (err) {
                    alert('删除失败，请重试')
                  }
                }
              }} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {bills.length === 0 && <div className="text-center text-gray-400 mt-8">还没有账单，点击上方按钮记一笔</div>}
    </div>
  )
}
