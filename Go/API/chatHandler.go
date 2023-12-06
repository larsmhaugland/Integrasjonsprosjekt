package API

import (
	"encoding/json"
	"net/http"
	"prog-2052/Firebase"
	"strings"
	"time"
)

// ChatBaseHandler handles all requests to the /chat endpoint and reroutes them to the correct handler
func ChatBaseHandler(w http.ResponseWriter, r *http.Request) {

	// Set the CORS for the request
	SetCORSHeaders(w)

	// No options requests used on this endpooint, so just return
	if r.Method == http.MethodOptions {
		return
	}

	// Get the correct parts of the URL to correctly redirect the user
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.Error(w, "Error; Incorrect usage of URL.", http.StatusBadRequest)
		return
	}

	// Find the correct handler for the request
	switch parts[2] {

	case "chat":
		ChatChatBaseHandler(w, r)

	case "members":
		ChatMemberBaseHandler(w, r)

	case "membersDelete":
		ChatMembersDeleteHandler(w, r)

	case "messages":
		ChatMessagesBaseHandler(w, r)

	case "name":
		ChatMemberBaseHandler(w, r)

	case "chatData":
		GetChatData(w, r)

	default:
		http.Error(w, "Error; Endpoint not supported", http.StatusBadRequest)
		return
	}
}

// ChatBaseHandler handles all requests to the /chat origin endpoint
// and calls the correct function based on request method
func ChatChatBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetUserChats(w, r)

	case http.MethodPost:
		NewChat(w, r)

	case http.MethodDelete:
		DeleteChat(w, r)

	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// GetUserChats gets all the chats for a user, requires the parameter username
func GetUserChats(w http.ResponseWriter, r *http.Request) {

	username := r.URL.Query().Get("username")
	if username == "" {
		http.Error(w, "Error; No username provided", http.StatusBadRequest)
		return
	}

	// Get the chats from the database
	chats, err := Firebase.GetUserChats(username)
	if err != nil {
		http.Error(w, "Error; Could not get chats", http.StatusInternalServerError)
		return
	}

	// Encode the chats into JSON format for the response
	err = json.NewEncoder(w).Encode(chats)
	if err != nil {
		http.Error(w, "Error; Could not encode chats", http.StatusInternalServerError)
		return
	}
}

// Newchat creates a new chat in the database
func NewChat(w http.ResponseWriter, r *http.Request) {
	var chat Firebase.Chat

	// Decode the JSON body into a chat struct
	err := json.NewDecoder(r.Body).Decode(&chat)
	if err != nil {
		http.Error(w, "Error; Could not decode JSON body", http.StatusBadRequest)
		return
	}

	// Add the new chat to the database
	err = Firebase.AddNewChat(chat)
	if err != nil {
		http.Error(w, "Error; Could not create new chat", http.StatusInternalServerError)
		return
	}

	// Return a 201 status code
	w.WriteHeader(http.StatusCreated)
}

// DeleteChat deletes a chat from the database
func DeleteChat(w http.ResponseWriter, r *http.Request) {
	// Get the chatID parameter form the URL
	chatID := r.URL.Query().Get("chatID")
	if chatID == "" {
		http.Error(w, "Error; No chatID provided", http.StatusBadRequest)
		return
	}

	// Delete the chat from the database
	err := Firebase.DeleteChat(chatID)
	if err != nil {
		http.Error(w, "Error; Could not delete chat", http.StatusInternalServerError)
		return
	}

	// Return a 204 status code
	w.WriteHeader(http.StatusNoContent)
}

// ChatMemberBaseHandler is the base handler for all requests to the /chat/members endpoint
// and correctly reroutes to the function associated with the method in the request
func ChatMemberBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		ChatMembersGetHandler(w, r)

	case http.MethodPost:
		ChatMembersPostHandler(w, r)

	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// ChatMessagesBaseHandler is the base handler for all requests to the /chat/messages endpoint
// and correctly reroutes to the function associated with the method in the request
func ChatMessagesBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		ChatMessagesGetHandler(w, r)

	case http.MethodPost:
		ChatMessagesPostHandler(w, r)

	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// ChatMessagesGetHandler gets all the messages for the chat with the chatID parameter
func ChatMessagesGetHandler(w http.ResponseWriter, r *http.Request) {
	// Get the chatID from the request URL
	chatID := r.URL.Query().Get("chatID")
	if chatID == "" {
		http.Error(w, "Error; No chatID provided", http.StatusBadRequest)
		return
	}

	// Get the messages from the database
	chatData, err := Firebase.GetChatData(chatID)
	if err != nil {
		http.Error(w, "Error when fetching messages: ", http.StatusInternalServerError)
		return
	}

	// Encode the messages into JSON format for the response
	err = json.NewEncoder(w).Encode(chatData.Members)
	if err != nil {
		http.Error(w, "Error when encoding messages: ", http.StatusInternalServerError)
		return
	}
}

// ChatMessagesPosthandler adds a new message to the chat with the chatID parameter
func ChatMessagesPostHandler(w http.ResponseWriter, r *http.Request) {

	// Declare the message struct and populate it with the decoded JSON response
	var message Firebase.Message
	err := DecodeJSONBody(w, r, &message)
	if err != nil {
		http.Error(w, "Error when decoding request POST: ", http.StatusBadRequest)
		return
	}

	// Get the chatID from the request URL
	chatID := r.URL.Query().Get("chatID")
	if chatID == "" {
		http.Error(w, "Error; No chatID provided", http.StatusBadRequest)
		return
	}

	// Set the timestamp for the message
	message.Timestamp = time.Now()

	// Add the message to the database
	err = Firebase.AddMessageToChat(message, chatID)
	if err != nil {
		http.Error(w, "Error when adding message to chat: ", http.StatusInternalServerError)
		return
	}

	// Return a 201 status code
	w.WriteHeader(http.StatusCreated)
}

// ChatMembersGetHandler gets all the members for the chat with the specified chatID parameter
func ChatMembersGetHandler(w http.ResponseWriter, r *http.Request) {
	// Get the chatID from the request URL
	chatID := r.URL.Query().Get("chatID")
	if chatID == "" {
		http.Error(w, "Error; No chatID provided", http.StatusBadRequest)
		return
	}

	// Get the members from the database
	members, err := Firebase.GetChatData(chatID)
	if err != nil {
		http.Error(w, "Error when fetching members: ", http.StatusInternalServerError)
		return
	}

	// Encode the members into JSON format for the response
	err = json.NewEncoder(w).Encode(members.Members)
	if err != nil {
		http.Error(w, "Error when encoding members: ", http.StatusInternalServerError)
		return
	}
}

// ChatMebersDeleteHandler deletes a member from the chat with the specified chatID parameter
func ChatMembersDeleteHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method == http.MethodPost {
		// Get the chatID and username from the request URL

		var request Firebase.RemoveMembersFromChat
		err := DecodeJSONBody(w, r, &request)
		if err != nil {
			http.Error(w, "Error when decoding request POST: ", http.StatusBadRequest)
			return
		}

		if request.ChatID == "" || len(request.Usernames) == 0 {
			http.Error(w, "Invalid chatID or usernames", http.StatusBadRequest)
			return
		}

		// Delete the member from the chat
		err = Firebase.RemoveMemberFromChat(request.ChatID, request.Usernames)
		if err != nil {
			http.Error(w, "Error when deleting member: ", http.StatusInternalServerError)
			return
		}

		// No response body needed
		w.WriteHeader(http.StatusNoContent)
	} else {
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// ChatMembersPostHandler adds a new member to the chat with the specified chatID parameter
func ChatMembersPostHandler(w http.ResponseWriter, r *http.Request) {

	// Get the chatID from the request URL
	chatID := r.URL.Query().Get("chatID")
	if chatID == "" {
		http.Error(w, "Error; No chatID provided", http.StatusBadRequest)
		return
	}

	// Decode the JSON body into a newMember struct
	var newMember Firebase.NewMemberChat
	err := DecodeJSONBody(w, r, &newMember)
	if err != nil {
		http.Error(w, "Error when decoding POST request: ", http.StatusBadRequest)
		return
	}

	// Add the new member to the chat, and get the updated members list sent back
	members, err2 := Firebase.AddMemberToChat(chatID, newMember.Username)
	if err2 != nil {
		http.Error(w, "Error when adding members to chat: ", http.StatusInternalServerError)
		return
	}

	// Encode the new members into JSON format for the response
	err = EncodeJSONBody(w, r, members)
	if err != nil {
		http.Error(w, "Error when encoding members: ", http.StatusInternalServerError)
		return
	}
}

// GetChatData gets all the data for the chat with the specified groupID parameter
func GetChatData(w http.ResponseWriter, r *http.Request) {

	// Get the groupID from the request URL
	groupID := r.URL.Query().Get("groupID")
	if groupID == "" {
		http.Error(w, "Error; No groupID provided", http.StatusBadRequest)
		return
	}

	// Get the chat data from the database
	chat, err := Firebase.GetGroupChat(groupID)
	if err != nil {
		http.Error(w, "Error while getting group chat: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Encode the chat data into JSON format for the response
	err = EncodeJSONBody(w, r, chat)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}
}
