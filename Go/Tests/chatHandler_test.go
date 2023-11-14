package Tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"prog-2052/API"
	"prog-2052/Firebase"
	"testing"
	"time"
)

func ResetChatData(chatID string) {
	// Fetch chat data from cache or database
	chat, err := Firebase.ReturnCacheChat(chatID)
	if err != nil {
		fmt.Println("Error when fetching chat: " + err.Error())
		return
	}

	// Modify chat data as needed
	chat.Name = "testchat"
	chat.Members = []string{"testuser", "testuser2"}
	chat.ChatOwner = "testuser"
	chat.Messages = []Firebase.Message{}

	// Update chat data in Firebase
	err = Firebase.PatchCacheChat(chat)
	if err != nil {
		fmt.Println("Error when patching chat: " + err.Error())
	}
}

func TestGetUserChats(t *testing.T) {
	// Set up a request with a username parameter
	req, err := http.NewRequest("GET", "/chat/chat?username=testuser", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.GetUserChats(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check the response body
	var chats []Firebase.Chat
	err = json.Unmarshal(rr.Body.Bytes(), &chats)
	if err != nil {
		t.Errorf("error decoding response body: %v", err)
	}
}

func TestNewChat(t *testing.T) {
	// Create a new chat for testing
	newChat := Firebase.Chat{
		Name:      "TestChatNew",
		Members:   []string{"testuser", "testuser2"},
		ChatOwner: "testuser",
	}

	// Encode the chat as JSON
	jsonData, err := json.Marshal(newChat)
	if err != nil {
		t.Fatal(err)
	}

	// Create a request with the JSON data
	req, err := http.NewRequest("POST", "/chat/chat", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}

	// Set the request content type to JSON
	req.Header.Set("Content-Type", "application/json")

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.NewChat(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}
}

func TestDeleteChat(t *testing.T) {
	newChat := Firebase.Chat{
		Name:      "TestDeleteChat",
		Members:   []string{"testuser", "testuser2"},
		ChatOwner: "testuser",
		DocumentID: "testDeleteChatID",
	}

	err := Firebase.AddNewChat(newChat)
	if err != nil {
		t.Fatal(err)
	}

	chatID := "testDeleteChatID"

	// Create a request with the chatID parameter
	req, err := http.NewRequest("DELETE", "/chat/chat?chatID="+chatID, nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.DeleteChat(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}

func TestChatMessagesGetHandler(t *testing.T) {
	// Assume the chatID for testing
	chatID := "testchat"

	// Create a request with the chatID parameter
	req, err := http.NewRequest("GET", "/chat/messages?chatID="+chatID, nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.ChatMessagesGetHandler(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check the response body
	var members []string
	err = json.Unmarshal(rr.Body.Bytes(), &members)
	if err != nil {
		t.Errorf("error decoding response body: %v", err)
	}

	
}

func TestChatMessagesPostHandler(t *testing.T) {
	// Assume the chatID for testing
	chatID := "testChatID"

	// Create a test message
	testMessage := Firebase.Message{
		Content:   "Hello, chat!",
		Sender:    "testUser",
		Timestamp: time.Now(),
	}

	// Encode the test message as JSON
	jsonData, err := json.Marshal(testMessage)
	if err != nil {
		t.Fatal(err)
	}

	// Create a request with the chatID parameter and JSON message in the body
	req, err := http.NewRequest("POST", "/chat/messages?chatID="+chatID, bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}

	// Set the request content type to JSON
	req.Header.Set("Content-Type", "application/json")

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.ChatMessagesPostHandler(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}
}

func TestChatMembersDeleteHandler(t *testing.T) {
	// Assume the chatID and username for testing
	chatID := "testChatID"
	username := "testUsername"

	// Create a request with the chatID and username parameters
	req, err := http.NewRequest("DELETE", "/chat/members?chatID="+chatID+"&username="+username, nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.ChatMembersDeleteHandler(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}

func TestChatMembersPostHandler(t *testing.T) {
	// Assume the chatID for testing
	chatID := "testChatID"

	// Create a test new member
	newMember := Firebase.NewMemberChat{
		Username: "newUser",
	}

	// Encode the test new member as JSON
	jsonData, err := json.Marshal(newMember)
	if err != nil {
		t.Fatal(err)
	}

	// Create a request with the chatID parameter and JSON new member in the body
	req, err := http.NewRequest("POST", "/chat/members?chatID="+chatID, bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}

	// Set the request content type to JSON
	req.Header.Set("Content-Type", "application/json")

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.ChatMembersPostHandler(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check the response body (updated members list)
	var updatedMembers []string
	err = json.Unmarshal(rr.Body.Bytes(), &updatedMembers)
	if err != nil {
		t.Errorf("error decoding response body: %v", err)
	}
}

func TestGetChatData(t *testing.T) {
	// Assume the groupID for testing
	groupID := "testGroupID"

	// Create a request with the groupID parameter
	req, err := http.NewRequest("GET", "/chatData?groupID="+groupID, nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// Call the handler function
	API.GetChatData(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
}
