import express from 'express'
import session from 'express-session'
import cors from 'cors'
import authRouter from './auth.js'

const PORT = Number(process.env.PORT ?? 3001)
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'idio-dev-secret-change-in-prod'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'

const app = express()

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))
app.use(express.json())
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
)

app.use('/api/auth', authRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))

app.listen(PORT, () => {
  console.log(`IDIO backend listening on http://localhost:${PORT}`)
})
