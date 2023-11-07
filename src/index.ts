import { Client } from "./client"
import { Server } from "./server"

async function init() {
    const c = new Client("deltex11")
    await c.connect()
    const s = new Server(c)
    s.start()
}

init()