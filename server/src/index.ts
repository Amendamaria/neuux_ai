// Example Hono server setup (your /server folder)
// This is what runs on your backend

import { Hono } from "hono"

const app = new Hono()

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" })
})

// Chat endpoint - receives messages from Next.js frontend
app.post("/api/chat", async (c) => {
  const { message } = await c.req.json()

  // TODO: Add your AI logic here
  // This is where you'd process the message with an AI model
  // For now, returning a mock response

  const mockResponse = `You said: "${message}". This is a mock response from your Hono backend.`

  return c.json({
    response: mockResponse,
    id: Math.random().toString(36).substr(2, 9),
  })
})

export default app
