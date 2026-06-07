import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { initDb } from './init-db'
import authRoutes from './routes/auth'
import roomRoutes from './routes/rooms'

const app = express()
const PORT = 3001
const JWT_SECRET = process.env.JWT_SECRET || 'pdd171-secret'

initDb()

app.use(cors())
app.use(express.json())

app.use((req: any, res, next) => {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as any
      req.userId = decoded.userId
    } catch {
      // ignore
    }
  }
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
