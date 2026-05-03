const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const agent = require('../agent/agent');



async function initSocketServer(httpServer) {

    const io = new Server(httpServer,{
        path:"/api/socket/socket.io/",
        cors: {
            origin:[ 'http://localhost:5173','https://market-place-tawny-eight.vercel.app'],
            credentials: true
        }
    })

    io.use((socket, next) => {

        const cookies = socket.handshake.headers?.cookie;
        const parsedCookies = cookies ? cookie.parse(cookies) : {};
        const headerToken = socket.handshake.headers?.authorization?.split(' ')[1];
        const authToken = socket.handshake.auth?.token;
        const token = parsedCookies.token || authToken || headerToken;

        if (!token) {
            return next(new Error('Token not provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = decoded;
            socket.token = token;

            next()

        } catch (err) {
            next(new Error('Invalid token'));
        }

    })

    io.on('connection', (socket) => {

        console.log(socket.user, socket.token)


        socket.on('message', async (data) => {
            try {
                const agentResponse = await agent.invoke({
                    messages: [
                        {
                            role: "user",
                            content: data
                        }
                    ]
                }, {
                    metadata: {
                        token: socket.token
                    }
                })

                const lastMessage = agentResponse.messages[ agentResponse.messages.length - 1 ]
                socket.emit('message', lastMessage.content)
            } catch (error) {
                console.error('AI Buddy socket message error:', error)
                socket.emit('message', error?.message || 'AI Buddy is temporarily unavailable.')
            }

        })

        socket.on('error', (error) => {
            console.error('AI Buddy socket error:', error)
        })

        socket.on('disconnect', (reason) => {
            console.log('AI Buddy socket disconnected:', reason)
        })

    })

}


module.exports = { initSocketServer };
