package Socket

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var allowedIPAddress = "10.212.174.249:8080"

// ConnectionInfo stores the websocket connection and the last message time
type ConnectionInfo struct {
	Connection      *websocket.Conn
	LastMessageTime time.Time
}

// Map to track clients in chat rooms
var chatRooms = make(map[string]map[*ConnectionInfo]bool)

// Upgrader for the websocket connection
var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
		/*remoteAddr := r.RemoteAddr
		return remoteAddr == allowedIPAddress*/
	},
}

// WebSocketHandler handles the websocket connection from the user
// It upgrades the HTTP connection to a websocket connection and then runs
// the handleMessage function
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received websocket connection request")
	// Upgrade the HTTP connection to a websocket connection
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	log.Println("Upgraded connection to websocket")
	// Listen to messages from the websocket connection
	handleMessage(conn)

	defer conn.Close()
}

// handleMessage listens to messages from the websocket connection
// and handles them according to the event type of the message
func handleMessage(conn *websocket.Conn) {
	log.Println("Listening to messages from websocket connection")
	// Unterminated loop that listens to messages and handles them
	for {

		// Try to read a message from the websocket connection
		messageType, data, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			return
		}

		// Make sure the message is a text message
		if messageType == websocket.TextMessage {
			log.Println("Received message:", string(data))

			// Set the lastMessageTime to the current time
			connectionInfo := &ConnectionInfo{
				Connection:      conn,
				LastMessageTime: time.Now(),
			}

			// Parse the received JSON message
			var messageData map[string]interface{}
			err := json.Unmarshal(data, &messageData)
			if err != nil {
				log.Println("Error unmarshaling JSON:", err)
				continue
			}

			// Mesaage must have an event field to identify what to do with the message
			event, ok := messageData["event"].(string)
			if !ok {
				log.Println("Received message without 'event' field.")
				break
			}

			// Get the message data from the message
			message, _ := messageData["message"].(map[string]interface{})

			// Handle the message according to the event type
			switch event {
			case "joinChat":
				// Handle the joinChat event
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

	messageData["timestamp"] = time.Now()

	// Marshal the message to JSON
	messageJSON, jsonErr := json.Marshal(messageData)
	if jsonErr != nil {
		log.Println("Error marshaling messageData:", jsonErr)
		return
	}

	for roomConn := range chatRooms[messageData["activeChatID"].(string)] {
		// Broadcast the message to clients in the same room
		err := roomConn.Connection.WriteMessage(websocket.TextMessage, messageJSON)
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

// chatRoomCleanup checks when the last message was received in each chat room
// and closes the room if it is idle for too long
func chatRoomCleanup() {
	for activeChatID, room := range chatRooms {

		// Set the time threshold for a room to be considered idle
		idleThreshold := time.Duration(30) * time.Minute

		// Calculate the last time a message was received in this room.
		lastMessageTime := getLastMessageTime(room)

		// Close the room if it is idle.
		if time.Since(lastMessageTime) > idleThreshold {
			closeChatRoom(activeChatID)
		}
	}
}

// RunChatRoomCleanup periodiaqlly runs chat room cleanup in the background
func RunChatRoomCleanup() {
	// Unterminated loop that runs the cleanup function at regular intervals
	for {
		// Sleep for 5 minutes, so it runs with 5 minutes time intervals
		time.Sleep(time.Duration(5) * time.Minute)
		// Run the cleanup function
		chatRoomCleanup()
	}
}

// getLastMessageTime returns the time of the last message received in the room
func getLastMessageTime(room map[*ConnectionInfo]bool) time.Time {
	var latestTime time.Time
	// Go through the connections in the room an check the last message time for each of them
	for connInfo := range room {
		if connInfo.LastMessageTime.After(latestTime) {
			latestTime = connInfo.LastMessageTime
		}
	}
	return latestTime
}

// closeChatRoom closes the specified chat room
func closeChatRoom(activeChatID string) {
	if chatRooms[activeChatID] != nil {

		// CLose all the connections in the chatroom
		for connInfo := range chatRooms[activeChatID] {
			connInfo.Connection.Close()
		}

		// Delete the room from the map.
		delete(chatRooms, activeChatID)
	}
}
