package Socket

import (
	"log"
	"net/http"
	"time"

	socketio "github.com/googollee/go-socket.io"
)

func InitSocketIOServer(mux *http.ServeMux) *socketio.Server {

	server := socketio.NewServer(nil)

	server.OnConnect("/socket.io/", func(s socketio.Conn) error {
		log.Println("User connected:", s.ID())
		// Add your WebSocket connection handling here
		return nil
	})

	server.OnDisconnect("/socket.io/", func(s socketio.Conn, reason string) {
		log.Println("User disconnected:", s.ID(), reason)
		// Handle WebSocket disconnections
	})

	server.OnEvent("/socket.io/", "joinChat", func(s socketio.Conn, activeChatID string) {
		// When a client joins a chat, they join the corresponding room
		if activeChatID != "" {
			s.Join(activeChatID)
		}
	})

	server.OnEvent("/socket.io/", "leaveChat", func(s socketio.Conn, activeChatID string) {
		// When a client leaves a chat, they leave the room
		if activeChatID != "" {
			s.Leave(activeChatID)
		}
	})

	server.OnEvent("/socket.io/", "chatMessage", func(s socketio.Conn, messageData struct {
		Content      string    `json:"content"`
		Sender       string    `json:"sender"`
		Timestamp    time.Time `json:"timestamp"`
		ActiveChatID string    `json:"activeChatID"`
	}) {
		log.Println("Chat message:", messageData.Content)

		messageData.Timestamp = time.Now()
		roomID := messageData.ActiveChatID

		// Broadcast the message to all clients in the same namespace
		server.BroadcastToRoom("/socket.io/", "chatMessage", roomID, messageData)
	})

	return server
}
