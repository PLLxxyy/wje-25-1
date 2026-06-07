export interface User {
  id: number
  username: string
  displayName: string
  token: string
}

export interface Room {
  id: number
  name: string
  ownerId: number
  createdAt: string
}

export interface RoomMember {
  id: number
  roomId: number
  userId: number
  username: string
  displayName: string
}

export interface Bill {
  id: number
  roomId: number
  payerId: number
  payerName: string
  type: string
  amount: number
  date: string
  note: string
  createdAt: string
}

export interface BillSplit {
  id: number
  billId: number
  userId: number
  username: string
  displayName: string
  share: number
}

export interface Balance {
  userId: number
  username: string
  displayName: string
  balance: number
}

export interface Transfer {
  from: string
  to: string
  amount: number
}
