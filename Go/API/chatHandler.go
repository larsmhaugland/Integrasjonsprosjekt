package API

import (
	"encoding/json"
	"net/http"
	"prog-2052/Firebase"
	"strings"
	"time"
)

func ChatBaseHandler(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	if r.Method == http.MethodOptions {
		return
	}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.Error(w, "Error; Incorrect usage of URL.", http.StatusBadRequest)
		return
	}
	switch parts[2] {

	case "chat":
		ChatChatBaseHandler(w, r)

	case "members":
		ChatMemberBaseHandler(w, r)

	case "messages":
		ChatMessagesBaseHandler(w, r)

	case "name":
		ChatMemberBaseHandler(w, r)

	default:
		http.Error(w, "Error; Endpoint not supported", http.StatusBadRequest)
		return
	}
}

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

func GetUserChats(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")

	chats, err := Firebase.GetUserChats(username)
	if err != nil {
		http.Error(w, "Error; Could not get chats", http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(chats)
	if err != nil {
		http.Error(w, "Error; Could not encode chats", http.StatusInternalServerError)
		return
	}
}

func NewChat(w http.ResponseWriter, r *http.Request) {
	var chat Firebase.Chat

	err := json.NewDecoder(r.Body).Decode(&chat)
	if err != nil {
		http.Error(w, "Error; Could not decode JSON body", http.StatusBadRequest)
		return
	}

	err = Firebase.AddNewChat(chat, false)
	if err != nil {
		http.Error(w, "Error; Could not create new chat", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func DeleteChat(w http.ResponseWriter, r *http.Request) {
	chatID := r.URL.Query().Get("chatID")

	err := Firebase.DeleteChat(chatID)
	if err != nil {
		http.Error(w, "Error; Could not delete chat", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func ChatMemberBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		ChatMembersGetHandler(w, r)

	case http.MethodPost:
		ChatMembersPostHandler(w, r)

	case http.MethodDelete:
		ChatMembersDeleteHandler(w, r)

	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

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

func ChatMessagesGetHandler(w http.ResponseWriter, r *http.Request) {
	chatID := r.URL.Query().Get("chatID")

	chatData, err := Firebase.GetChatData(chatID)
	if err != nil {
		http.Error(w, "Error when fetching messages: ", http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(chatData.Members)
	if err != nil {
		http.Error(w, "Error when encoding messages: ", http.StatusInternalServerError)
		return
	}
}

func ChatMessagesPostHandler(w http.ResponseWriter, r *http.Request) {

	var message Firebase.Message

	err := DecodeJSONBody(w, r, &message)
	if err != nil {
		http.Error(w, "Error when decoding request POST: ", http.StatusBadRequest)
		return
	}

	chatID := r.URL.Query().Get("chatID")
	message.Timestamp = time.Now()

	err = Firebase.AddMessageToChat(message, chatID)
	if err != nil {
		http.Error(w, "Error when adding message to chat: ", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func ChatMembersGetHandler(w http.ResponseWriter, r *http.Request) {
	chatID := r.URL.Query().Get("chatID")

	members, err := Firebase.GetChatData(chatID)
	if err != nil {
		http.Error(w, "Error when fetching members: ", http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(members.Members)
	if err != nil {
		http.Error(w, "Error when encoding members: ", http.StatusInternalServerError)
		return
	}
}

func ChatMembersDeleteHandler(w http.ResponseWriter, r *http.Request) {
	chatID := r.URL.Query().Get("chatID")
	username := r.URL.Query().Get("username")

	err := Firebase.RemoveMemberFromChat(chatID, username)
	if err != nil {
		http.Error(w, "Error when deleting member: ", http.StatusInternalServerError)
		return
	}

	// No response body needed
	w.WriteHeader(http.StatusNoContent)
}

func ChatMembersPostHandler(w http.ResponseWriter, r *http.Request) {

	chatID := r.URL.Query().Get("chatID")
	var newMember Firebase.NewMemberChat

	err := DecodeJSONBody(w, r, &newMember)
	if err != nil {
		http.Error(w, "Error when decoding POST request: ", http.StatusBadRequest)
		return
	}

	members, err2 := Firebase.AddMemberToChat(chatID, newMember.Username)
	if err2 != nil {
		http.Error(w, "Error when adding members to chat: ", http.StatusInternalServerError)
		return
	}

	err = EncodeJSONBody(w, r, members)
	if err != nil {
		http.Error(w, "Error when encoding members: ", http.StatusInternalServerError)
		return
	}
}
