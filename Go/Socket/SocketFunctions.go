package Socket

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

type SocketServer struct {
	clients map[*websocket.Conn]bool
	join    chan *websocket.Conn
	leave   chan *websocket.Conn
	message chan struct {
		conn *websocket.Conn
		data []byte
	}
}

type ConnectionInfo struct {
	Connection      *websocket.Conn
	LastMessageTime time.Time
}

// Map to track clients in chat rooms
var chatRooms = make(map[string]map[*ConnectionInfo]bool)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

/*func WsEndpoint(w http.ResponseWriter, r *http.Request){
	Upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	server := InitSocketServer()
	server.run()
}*/

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	//server := InitSocketServer()
	log.Println("WebSocketHandler() is running")
	//server.run(conn)
	handleMessage(conn)
	defer conn.Close()
	// Handle WebSocket connections here
}

func InitSocketServer() *SocketServer {
	server := &SocketServer{
		clients: make(map[*websocket.Conn]bool),
		join:    make(chan *websocket.Conn),
		leave:   make(chan *websocket.Conn),
		message: make(chan struct {
			conn *websocket.Conn
			data []byte
		}),
	}
	return server
}

/*
func (s *SocketServer) run(conn *websocket.Conn) {
	log.Println("Start of run function")
	// Add the new WebSocket connection to the clients map
	s.join <- conn
	log.Println("No error with s.join <- conn")
	// Defer removing the connection when it is closed
	defer func() {
		s.leave <- conn
	}()
	log.Println("run() is running")
	for {
		select {
		case msg := <-s.message:
			// Process the received message
			handleMessage(msg.conn, s)
		}
	}

}*/

func (s *SocketServer) run(conn *websocket.Conn) {
	log.Println("Start of run function")
	for {
		select {
		case conn := <-s.join:
			// A new client has connected
			log.Println("New client has connected")
			s.clients[conn] = true

		case conn := <-s.leave:
			// A client has disconnected
			delete(s.clients, conn)
			conn.Close()

		case msg := <-s.message:
			// Go routine to run handleMessage concurrently for all incoming messages
			log.Println("Message recieved now handling it")
			handleMessage(msg.conn)
		}
	}
}

func handleMessage(conn *websocket.Conn) {

	connectionInfo := &ConnectionInfo{
		Connection:      conn,
		LastMessageTime: time.Now(), // Set the initial LastMessageTime
	}
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			return
		}
		log.Println("Iam here")
		if messageType == websocket.TextMessage {
			log.Println("Received message:", string(p))
			// Parse the received JSON message
			var messageData map[string]interface{}
			if err := json.Unmarshal(p, &messageData); err != nil {
				log.Println("Error unmarshaling JSON:", err)
				continue
			}

			event, ok := messageData["event"].(string)
			if !ok {
				log.Println("Received message without 'event' field.")
				continue
			}

			message, _ := messageData["message"].(map[string]interface{})
			if !ok {
				log.Println("Received message without 'message' field.")
				continue
			}
			log.Println("message", message)

			// Handle the event and message as needed
			switch event {
			case "joinChat":
				// Handle the joinChat event
				log.Println("Trying to get activeCHatID")
				activeChatID, ok := messageData["activeChatID"].(string)
				if ok {
					joinChatRoom(connectionInfo, activeChatID)
				} else {
					log.Println("Received joinChat event without 'activeChatID' field.")
				}
			case "leaveChat":
				// Handle the leaveChat event
				activeChatID, ok := messageData["activeChatID"].(string)
				if ok {
					leaveChatRoom(connectionInfo, activeChatID)
				} else {
					log.Println("Received leaveChat event without 'activeChatID' field.")
				}
			case "chatMessage":
				// Handle the chatMessage event
				log.Println("Should broadcase message now")
				broadcastMessageToRoom(connectionInfo, message)
			default:
				log.Println("Received unknown event:", event)
			}
		}
	}
}

// Handle the chatMessage event
func broadcastMessageToRoom(connInfo *ConnectionInfo, messageData map[string]interface{}) {
	// Marshal the message to JSON
	messageData["timestamp"] = time.Now()
	log.Println("message: ", messageData)
	messageJSON, jsonErr := json.Marshal(messageData)
	if jsonErr != nil {
		log.Println("Error marshaling messageData:", jsonErr)
		return
	}

	for roomConnInfo := range chatRooms[messageData["activeChatID"].(string)] {
		// Broadcast the message to clients in the same room
		err := roomConnInfo.Connection.WriteMessage(websocket.TextMessage, messageJSON)
		if err != nil {
			log.Printf("Error sending message to client: %v\n", err)
		}
		log.Println("Broadcasted message to client")
	}
}

// Handle the joinChat event
func joinChatRoom(connInfo *ConnectionInfo, activeChatID string) {
	log.Println("activeChatid: ", activeChatID)
	if activeChatID != "" {
		// Create the chat room if it doesn't exist
		if chatRooms[activeChatID] == nil {
			chatRooms[activeChatID] = make(map[*ConnectionInfo]bool)
		}
		// Add the client to the chat room
		chatRooms[activeChatID][connInfo] = true
		log.Println("User joined the chat room")
	}
}

// Handle the leaveChat event
func leaveChatRoom(connInfo *ConnectionInfo, activeChatID string) {
	if activeChatID != "" && chatRooms[activeChatID] != nil {
		// Remove the client from the chat room
		delete(chatRooms[activeChatID], connInfo)
		log.Println("User left the chat room")
	}
}

func chatRoomCleanup() {
	for activeChatID, room := range chatRooms {
		// Define a time threshold to determine if a room is idle (e.g., 30 minutes).
		// You can adjust the duration as needed.
		idleThreshold := time.Duration(30) * time.Minute

		// Calculate the last time a message was received in this room.
		// You need to keep track of the last message time in your application.
		// For this example, we assume a global variable "lastMessageTime" is used.
		lastMessageTime := getLastMessageTime(room)

		if time.Since(lastMessageTime) > idleThreshold {
			// The room is idle. Clean it up.
			closeChatRoom(activeChatID)
		}
	}
}

func getLastMessageTime(room map[*ConnectionInfo]bool) time.Time {
	var latestTime time.Time
	for connInfo := range room {
		if connInfo.LastMessageTime.After(latestTime) {
			latestTime = connInfo.LastMessageTime
		}
	}
	return latestTime
}

func closeChatRoom(activeChatID string) {
	if chatRooms[activeChatID] != nil {
		for connInfo := range chatRooms[activeChatID] {
			// Close and delete connections in the room.
			connInfo.Connection.Close()
		}
		// Delete the room from the map.
		delete(chatRooms, activeChatID)
	}
}
