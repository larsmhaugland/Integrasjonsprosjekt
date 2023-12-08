package Socket

import (
	"container/heap"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var allowedIPAddress = "10.212.174.249:8080"

// New type for managing chat rooms based on last message time
type ChatRoomHeap []*ChatRoomInfo

type ChatRoomInfo struct {
	ActiveChatID    string
	LastMessageTime time.Time
}

// Methods that has to be implemented for the heap interface
func (h ChatRoomHeap) Len() int           { return len(h) }
func (h ChatRoomHeap) Less(i, j int) bool { return h[i].LastMessageTime.Before(h[j].LastMessageTime) }
func (h ChatRoomHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *ChatRoomHeap) Push(x interface{}) {
	*h = append(*h, x.(*ChatRoomInfo)) // Push the new item to the heap (heap is a pointer)
}

func (h *ChatRoomHeap) Pop() interface{} {
	old := *h // Get a copy of the heap
	n := len(old)
	item := old[n-1]  // Item to be popped from the heap
	*h = old[0 : n-1] // Update heap with the abscence of the last item
	return item       // return the popped item
}

// Track chat rooms using priority queue with heap interface
var chatRoomHeap ChatRoomHeap

// Init function to initialize the chat room heap. Called at package initialization
func init() {
	chatRoomHeap = make(ChatRoomHeap, 0)
	heap.Init(&chatRoomHeap)
}

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
	// Upgrade the HTTP connection to a websocket connection
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	// Listen to messages from the websocket connection
	handleMessage(conn)

	defer conn.Close()
}

// handleMessage listens to messages from the websocket connection
// and handles them according to the event type of the message
func handleMessage(conn *websocket.Conn) {
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
	}
}

// Handle the joinChat event
func joinChatRoom(connInfo *ConnectionInfo, activeChatID string) {
	if activeChatID != "" {
		// Create the chat room if it doesn't exist
		if chatRooms[activeChatID] == nil {
			chatRooms[activeChatID] = make(map[*ConnectionInfo]bool)
			roomInfo := &ChatRoomInfo{
				ActiveChatID:    activeChatID,
				LastMessageTime: time.Now(),
			}
			heap.Push(&chatRoomHeap, roomInfo) // Push the new room to the heap
		}
		// Add the client to the chat room
		chatRooms[activeChatID][connInfo] = true
	}
}

// Handle the leaveChat event
func leaveChatRoom(connInfo *ConnectionInfo, activeChatID string) {
	if activeChatID != "" && chatRooms[activeChatID] != nil {
		// Remove the client from the chat room
		delete(chatRooms[activeChatID], connInfo)

		// Check if the chat room is empty, if yes, remove it from the heap
		if len(chatRooms[activeChatID]) == 0 {
			for i, roomInfo := range chatRoomHeap {
				if roomInfo.ActiveChatID == activeChatID {
					heap.Remove(&chatRoomHeap, i) // Remove the room from the heap
					break
				}
			}
			delete(chatRooms, activeChatID) // Delete the room from the map, as it is now empty
		}
	}
}

// chatRoomCleanup checks when the last message was received in each chat room
// and closes the room if it is idle for too long
func chatRoomCleanup() {
	idleThreshold := time.Duration(30) * time.Minute

	for chatRoomHeap.Len() > 0 {
		roomInfo := heap.Pop(&chatRoomHeap).(*ChatRoomInfo)
		if time.Since(roomInfo.LastMessageTime) > idleThreshold {
			closeChatRoom(roomInfo.ActiveChatID)
		} else {
			// If the room is still active, re-insert it into the heap with updated time
			heap.Push(&chatRoomHeap, roomInfo)
			break // Break the loop since next rooms will also be active (the heap is sorted by message time)
		}
	}
}

// RunChatRoomCleanup periodically runs chat room cleanup in the background
func RunChatRoomCleanup(interval time.Duration) {
	cleanupTimer := time.NewTimer(interval) // Timer that fires at the specified interval
	defer cleanupTimer.Stop()

	for { // Infinite loop
		<-cleanupTimer.C // Blocked until the timer fires
		chatRoomCleanup()
		cleanupTimer.Reset(interval) // Reset the timer for the next interval
	}
}

/*
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
}*/

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
