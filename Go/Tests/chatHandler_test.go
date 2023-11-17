package Tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"prog-2052/API"
	"prog-2052/Firebase"
	"testing"
	"time"
)

//var testServer *httptest.Server

/*
	func setupTestServer() {
		// Create a new router
		router := mux.NewRouter()

		// Set up routes by using the handler functions for chat from the API pakcgae
		router.HandleFunc("/chat/chat/", API.ChatBaseHandler).Methods(http.MethodGet, http.MethodPost, http.MethodDelete)
		router.HandleFunc("/chat/members", API.ChatMemberBaseHandler).Methods(http.MethodGet, http.MethodPost, http.MethodDelete)
		router.HandleFunc("/chat/messages", API.ChatMessagesBaseHandler).Methods(http.MethodGet, http.MethodPost)
		router.HandleFunc("/chat/chatData", API.GetChatData).Methods(http.MethodGet)

		// Use the test server with the router
		testServer = httptest.NewServer(router)
		defer testServer.Close()
	}
*/
func TestMain(m *testing.M) {
	//setupTestServer()
	Firebase.InitCache() // Initialize cache
	ResetChatData("testchat")
	ResetUserData("testuser", "testrecipe")
	ResetUserData("testuser2", "testrecipe2")

	// Run the tests and get the exit code
	exitCode := m.Run()

	// Exit with the same exit code as the tests
	os.Exit(exitCode)
}

func ResetChatData(chatID string) {
	chat, err := Firebase.ReturnCacheChat(chatID)
	if err != nil {
		fmt.Println("Error when fetching chat: " + err.Error())
		return
	}

	// Modify chat data as needed
	chat.Name = "testchat"
	chat.Members = []string{"testuser", "testuser2", "testuser3"}
	chat.ChatOwner = "testuser"
	chat.DocumentID = chatID
	chat.Messages = []Firebase.Message{
		{
			Content:   "Hello, chat!",
			Sender:    "testuser",
			Timestamp: time.Now(),
		},
	}

	// Update chat data in Firebase
	err = Firebase.PatchCacheChat(chat)
	if err != nil {
		fmt.Println("Error when patching chat: " + err.Error())
	}
}

func TestNewChat(t *testing.T) {

	// Create a new chat for testing
	newChat := Firebase.Chat{
		Name:       "TestChatNew",
		Members:    []string{"testuser", "testuser2"},
		ChatOwner:  "testuser",
		DocumentID: "TestChatNew",
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

func TestGetUserChats(t *testing.T) {
	t.Log("Resetting chat data")
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
	t.Log("Succesfull in getting user chats")
}

func TestDeleteChat(t *testing.T) {
	newChat := Firebase.Chat{
		Name:       "testDeleteChatID",
		Members:    []string{"testuser", "testuser2"},
		ChatOwner:  "testuser",
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

func TestChatMessagesPostHandler(t *testing.T) {
	// Assume the chatID for testing
	chatID := "testchat"

	// Create a test message
	testMessage := Firebase.Message{
		Content:   "Hello, chat!",
		Sender:    "testuser",
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

func TestChatMembersDeleteHandler(t *testing.T) {
	// Assume the chatID and username for testing
	chatID := "testchat"
	username := "testuser"

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

	//Restore the user to the chat again
	ResetChatData("testchat")
}

func TestChatMembersPostHandler(t *testing.T) {
	// Assume the chatID for testing
	chatID := "testchat"

	// Create a test new member
	newMember := Firebase.NewMemberChat{
		Username: "testuser",
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
	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)
	groupID := "testgroup"

	// Create a request with the groupID parameter
	req, err := http.NewRequest("GET", "/chat/chatData?groupID="+groupID, nil)
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
