import express, { Application } from "express";
import http, { Server } from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import { PrismaClient } from "./generated/prisma";

const client = new PrismaClient()

class SocketServer {
    private app: Application
    private httpServer: Server
    private io: IOServer
    private readonly port: number = 3000

    constructor(port?: number) {
        this.port = port || Number(process.env.PORT)
        this.app = express()
        this.httpServer = http.createServer(this.app)
        this.io = new IOServer(this.httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            }
        })
        this.app.use(cors());
        this.configureRoutes();
        this.configureSocketEvents();
    }

    private configureRoutes(){
        this.app.get("/", (req, res) => res.send("Hello"))
    }

    private configureSocketEvents() {
        this.io.on("connection", (socket) => {
            console.log("connected: ", socket.id);

            // socket.emit("message", "this is message") 

            // socket.on("message", (message) => {
            //     console.log(message);
            //     socket.broadcast.emit("broadcasted", message)
            // })

            socket.on("disconnect", () => {
                console.log("disconnected: ", socket.id)
            })

            socket.on("login", async (user_id: string) => {
            try {
                const user = await client.user.upsert ({
                    where: { user_id },
                    update: { online: true },
                    create: { user_id, online: true }
                })
                
                console.log("User logged in:", user_id)
                
                this.io.emit("userStatus", {
                    user_id: user.user_id,
                    online: user.online,
                    created_at: user.created_at
                })
                
            } catch (err) {
                console.error("Login error:", err)
            }
            })

            socket.on("logout", async (user_id: string) => {
            try {
                const user = await client.user.update({
                    where: { user_id },
                    data: { online: false }
                });
                
                console.log("User logged out:", user_id);
                
                this.io.emit("userStatus", {
                    user_id: user.user_id,
                    online: user.online,
                    created_at: user.created_at
                })
                
            } catch (err) {
                console.error("Logout error:", err)
            }
        })
            socket.on("logout", async (user_id: string) => {
            try {
                const user = await client.user.update({
                    where: { user_id },
                    data: { online: false }
                });
                
                console.log("User logged out:", user_id);
                
                this.io.emit("userStatus", {
                    user_id: user.user_id,
                    online: user.online,
                    created_at: user.created_at
                })
                
            } catch (error) {
                console.error("Logout error:", error)
            }
        })

        })
    }

    public start() {
        this.httpServer.listen (
            this.port, () => console.log(`Listening at :${this.port}`)
        )
    }
}

new SocketServer(3000).start()