package Socket

import (
	"log"
	"net/http"

	socketio "github.com/googollee/go-socket.io"
)

func InitSocketIOServer(mux *http.ServeMux) *socketio.Server {

	server := socketio.NewServer(nil)

	server.OnConnect("/", func(s socketio.Conn) error {
		log.Println("User connected:", s.ID())
		// Add your WebSocket connection handling here
		return nil
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		log.Println("User disconnected:", s.ID(), reason)
		// Handle WebSocket disconnections
	})

	server.OnEvent("/", "chat message", func(s socketio.Conn, msg string) {
		log.Println("Chat message:", msg)
		// Handle chat message event
		// Broadcast the message to all connected clients
		server.BroadcastToRoom("/", "chat", "chat message", msg)
	})

	return server
}
