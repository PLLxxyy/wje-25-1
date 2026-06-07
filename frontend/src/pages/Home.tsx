import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Home as HomeIcon, Trash2 } from 'lucide-react'
import { useRooms } from '@/hooks/useRooms'

export default function Home() {
  const { rooms, loading, createRoom, deleteRoom } = useRooms()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createRoom(name)
    setName('')
    setShowForm(false)
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">我的房间</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700"
        >
          <Plus size={16} /> 创建房间
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-4 mb-6 flex gap-3">
          <input
            placeholder="房间名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">创建</button>
          <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm">取消</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <Link
            key={room.id}
            to={`/rooms/${room.id}`}
            className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <HomeIcon size={18} />
                <h2 className="font-semibold">{room.name}</h2>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); deleteRoom(room.id) }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Link>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center text-gray-400 mt-12">还没有合租房间，点击上方按钮创建一个</div>
      )}
    </div>
  )
}
