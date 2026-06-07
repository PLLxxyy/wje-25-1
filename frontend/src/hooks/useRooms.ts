import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import type { Room, RoomMember, Bill, BillDetail, Balance, Transfer } from '@/types'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    const res = await api.get('/rooms')
    setRooms(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const createRoom = useCallback(async (name: string) => {
    const res = await api.post('/rooms', { name })
    setRooms((prev) => [...prev, res.data])
    return res.data
  }, [])

  const deleteRoom = useCallback(async (id: number) => {
    await api.delete(`/rooms/${id}`)
    setRooms((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { rooms, loading, fetchRooms, createRoom, deleteRoom }
}

export function useRoomMembers(roomId: number) {
  const [members, setMembers] = useState<RoomMember[]>([])

  const fetchMembers = useCallback(async () => {
    const res = await api.get(`/rooms/${roomId}/members`)
    setMembers(res.data)
  }, [roomId])

  useEffect(() => {
    if (roomId) fetchMembers()
  }, [roomId, fetchMembers])

  const inviteMember = useCallback(async (username: string) => {
    await api.post(`/rooms/${roomId}/members`, { username })
    await fetchMembers()
  }, [roomId, fetchMembers])

  return { members, fetchMembers, inviteMember }
}

export function useBills(roomId: number) {
  const [bills, setBills] = useState<Bill[]>([])

  const fetchBills = useCallback(async () => {
    const res = await api.get(`/rooms/${roomId}/bills`)
    setBills(res.data)
  }, [roomId])

  useEffect(() => {
    if (roomId) fetchBills()
  }, [roomId, fetchBills])

  const addBill = useCallback(async (data: { type: string; amount: number; date: string; note: string; splitUserIds: number[] }) => {
    const res = await api.post(`/rooms/${roomId}/bills`, data)
    setBills((prev) => [res.data, ...prev])
    return res.data
  }, [roomId])

  const getBillDetail = useCallback(async (billId: number): Promise<BillDetail> => {
    const res = await api.get(`/rooms/bills/${billId}`)
    return res.data
  }, [])

  const editBill = useCallback(async (billId: number, data: { amount: number; note: string; splitUserIds: number[] }) => {
    const res = await api.put(`/rooms/bills/${billId}`, data)
    setBills((prev) => prev.map((b) => (b.id === billId ? res.data : b)))
    return res.data
  }, [])

  const deleteBill = useCallback(async (billId: number) => {
    await api.delete(`/rooms/bills/${billId}`)
    setBills((prev) => prev.filter((b) => b.id !== billId))
  }, [])

  return { bills, fetchBills, addBill, getBillDetail, editBill, deleteBill }
}

export function useBalances(roomId: number) {
  const [balances, setBalances] = useState<Balance[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])

  const fetchBalances = useCallback(async () => {
    const res = await api.get(`/rooms/${roomId}/balances`)
    setBalances(res.data.balances)
    setTransfers(res.data.transfers)
  }, [roomId])

  useEffect(() => {
    if (roomId) fetchBalances()
  }, [roomId, fetchBalances])

  return { balances, transfers, fetchBalances }
}
