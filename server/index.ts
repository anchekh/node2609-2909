import express, { Application } from "express";
import http, { Server } from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";

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
                methods: [ "GET", "POST" ]
            }
        })

        this.app.use(cors())

        this.configureRoutes()
        this.configureSocketEvents()
    }

    private configureRoutes() {
        this.app.get("/", (req, res) => res.send("Hello"))
    }

    private configureSocketEvents() {
        this.io.on("connection", (socket) => {
            console.log(`connected: `, socket.id);

            socket.emit("server-message", `Hello, ${socket.id}!`)
            console.log(`Client ${socket.id} received a message`)

            socket.broadcast.emit("server-message", `Client ${socket.id} has connected`)
            console.log(`Client ${socket.id} has connected`)

            socket.on("client-message", (message) => {
            console.log(`Client ${socket.id} sent a message: ${message}`)

            socket.emit("server-message", `Your message: ${message}`)
            console.log(`${message}`)

            socket.broadcast.emit("server-message", `Client ${socket.id} sent a message: ${message}`)
            console.log(`Client ${socket.id} sent a message: ${message}`)
    })

            // socket.emit("message", "Hello")
            // socket.on("message1", (message) => {
            // console.log(message)
            // })

            socket.on("disconnect", () => {
                // console.log(`disconnected: `, socket.id);
                this.io.emit("server-message", `Client ${socket.id} disconnected`)
                console.log(`Client ${socket.id} disconnected`)
            })
        })
    }

    public start() {
        this.httpServer.listen(
            this.port,
            () => console.log(`listening at:${this.port}`)
        )
    }
}

new SocketServer(3000).start()