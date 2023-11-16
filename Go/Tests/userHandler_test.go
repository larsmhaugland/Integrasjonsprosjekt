package Tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"prog-2052/API"
	"prog-2052/Firebase"
	"reflect"
	"strings"
	"testing"
)

func ResetUserData(username string, recipename string) {
	user, err := Firebase.ReturnCacheUser(username)
	if err != nil {
		fmt.Println("Error when fetching user: " + err.Error())
	}
	user.Username = username
	user.Password = "testpassword"
	user.Name = username
	user.Recipes = []string{recipename}
	user.ShoppingLists = []string{"testlist"}
	user.Groups = []string{"testgroup"}
	user.Chats = []string{}
	user.DocumentID = username
	err = Firebase.PatchCacheUser(user)
	if err != nil {
		fmt.Println("Error when patching user: " + err.Error())
	}
}

func TestUserCredentialPostHandler(t *testing.T) {

	newUser := Firebase.User{
		Username:   "testuserlogin",
		Password:   "testpassword",
		Name:       "testuserlogin",
		Recipes:    []string{"testrecipe"},
		Groups:     []string{"testgroup"},
		Chats:      []string{"testchat"},
		DocumentID: "testuserlogin",
	}

	// Encode the test user as JSON
	jsonData, err := json.Marshal(newUser)
	if err != nil {
		t.Errorf("Error while encoding JSON data: %v", err)
	}

	// Create a new request with the JSON data
	req, err := http.NewRequest("POST", "/register", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Errorf("Error while creating request: %v", err)
	}

	// Create a new recorder to record the response
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(UserCredentialPostHandlerTest)
	handler.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusCreated)
	}

	// Check the cookie value
	cookie := rr.Header().Get("Set-Cookie")

	// Split the cookie string by ';'
	// The cookie has time specific fields whcih will not work for our test environment, so we have to
	// extract the other relevant fields and check against them
	cookieParts := strings.Split(cookie, ";")

	var authToken, path, sameSite string

	// Loop through each part of the cookie to extract specific attributes
	for _, part := range cookieParts {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "AuthToken=") {
			authToken = part
		} else if strings.HasPrefix(part, "Path=") {
			path = part
		} else if strings.HasPrefix(part, "SameSite=") {
			sameSite = part
		}
	}

	// Check individual parts against expected values
	if authToken != "AuthToken=test" || path != "Path=/" || sameSite != "SameSite=None" {
		t.Errorf("Handler returned wrong cookie value: got AuthToken=%s; %s; %s, want AuthToken=test; Path=/; SameSite=None", authToken, path, sameSite)
	}

	// Check that the user was added to the database
	user, err := Firebase.ReturnCacheUser("testuserlogin")
	if err != nil {
		t.Errorf("Error when fetching user: %v", err)
	}
	if user.Username != newUser.Username {
		t.Errorf("User was not added to the database")
	}
}

func TestUserCredentialPostLoginHandler(t *testing.T) {

	testuser, err := Firebase.ReturnCacheUser("testuserlogin")
	if err != nil {
		t.Errorf("Error when fetching user: %v", err)
	}

	// Encode the test user as JSON
	jsonData, err := json.Marshal(testuser)
	if err != nil {
		t.Errorf("Error while encoding JSON data: %v", err)
	}

	// Create a new request with the JSON data
	req, err := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Errorf("Error while creating request: %v", err)
	}

	// Create a new recorder to record the response
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(UserCredentialPostLoginHandlerTest)
	handler.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check the cookie value
	cookie := rr.Header().Get("Set-Cookie")
	
	// Split the cookie string by ';'
	// The cookie has time specific fields whcih will not work for our test environment, so we have to
	// extract the other relevant fields and check against them
	cookieParts := strings.Split(cookie, ";")

	var authToken, path, sameSite string

	// Loop through each part of the cookie to extract specific attributes
	for _, part := range cookieParts {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "AuthToken=") {
			authToken = part
		} else if strings.HasPrefix(part, "Path=") {
			path = part
		} else if strings.HasPrefix(part, "SameSite=") {
			sameSite = part
		}
	}

	// Check individual parts against expected values
	if authToken != "AuthToken=test" || path != "Path=/" || sameSite != "SameSite=None" {
		t.Errorf("Handler returned wrong cookie value: got AuthToken=%s; %s; %s, want AuthToken=test; Path=/; SameSite=None", authToken, path, sameSite)
	}

	Firebase.DeleteUser("testuserlogin")
}

func TestUserGroupGetHandler(t *testing.T) {
	// Reset user data before running the test
	ResetUserData("testuser", "testrecipe")

	// Create a test user
	testUser := Firebase.User{
		Password:   "testpassword",
		Name:       "testuserget",
		Username:   "testuserget",
		Groups:     []string{"group1", "group2", "group1"},
		DocumentID: "testuserget",
	}
	err := Firebase.PatchCacheUser(testUser)
	if err != nil {
		t.Errorf("Error when setting user: %v", err)
	}

	// Create a test group
	testGroup1 := Firebase.Group{
		DocumentID: "group1",
		Name:       "Test Group 1",
		Members:    map[string]string{"testuserget": "member", "testuser2": "admin"},
	}
	err = Firebase.PatchCacheGroup(testGroup1)
	if err != nil {
		t.Errorf("Error when setting group: %v", err)
	}

	// Create another test group
	testGroup2 := Firebase.Group{
		DocumentID: "group2",
		Name:       "Test Group 2",
		Members:    map[string]string{"testuserget": "member", "testuser2": "admin"},
	}
	err = Firebase.PatchCacheGroup(testGroup2)
	if err != nil {
		t.Errorf("Error when setting group: %v", err)
	}

	// Create a new request with the test user's username as a query parameter
	req, err := http.NewRequest("GET", "/groups?username=testuser", nil)
	if err != nil {
		t.Errorf("Error while creating request: %v", err)
	}

	// Create a new recorder to record the response
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(API.UserGroupGetHandler)
	handler.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check the response body
	expectedBody := `[{"documentID":"testgroup","members":{"testuser":"owner"},"owner":"","name":"testgroup","recipes":{"testrecipe":{"lastEaten":"2023-11-15T09:56:06Z","owner":"testuser"}},"schedule":{"2020-01-01":{"customRecipe":"","recipe":"testrecipe","responsible":["testuser"]}},"shopping-lists":["testshoppinglistgroup"],"chat":"testchat","image":""}]`
	if strings.TrimSuffix(rr.Body.String(), "\n") != expectedBody {
		t.Errorf("Handler returned wrong response body: got %v, want %v", rr.Body.String(), expectedBody)
	}
}

func TestUserSearchHandler(t *testing.T) {
	// Create a new request with a partial username as a query parameter
	req, err := http.NewRequest("GET", "/search?partialUsername=testuserr", nil)
	if err != nil {
		t.Errorf("Error while creating request: %v", err)
	}

	// Create a new recorder to record the response
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(API.UserSearchHandler)
	handler.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check the response body
	expectedBody := `["testuserrecipe"]`
	if strings.TrimSuffix(rr.Body.String(), "\n") != expectedBody {
		t.Errorf("Handler returned wrong response body: got %v, want %v", rr.Body.String(), expectedBody)
	}
}

func TestUserGroupPatchHandler(t *testing.T) {
	// Reset user data before running the test
	ResetUserData("testuser2", "testrecipe")
	ResetGroupData("testgroup2", "testchat", "testuser", "testrecipe", false)
	group, err := Firebase.ReturnCacheGroup("testgroup2")
	if err != nil {
		t.Errorf("Error when fetching group: %v", err)
	}

	testuser, err := Firebase.ReturnCacheUser("testuser2")
	if err != nil {
		t.Errorf("Error when fetching user: %v", err)
	}

	err = Firebase.PatchCacheUser(testuser)
	if err != nil {
		t.Errorf("Error when setting user: %v", err)
	}

	// Encode the test group ID as JSON
	jsonData, err := json.Marshal(group.DocumentID)
	if err != nil {
		t.Errorf("Error while encoding JSON data: %v", err)
	}

	// Create a new request with the test user's username as a query parameter
	req, err := http.NewRequest("PATCH", "/groups?username=testuser2", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Errorf("Error while creating request: %v", err)
	}

	// Create a new recorder to record the response
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(API.UserGroupPatchHandler)
	handler.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check that the group was added to the user's groups
	user, err := Firebase.ReturnCacheUser(testuser.Username)
	if err != nil {
		t.Errorf("Error when fetching user: %v", err)
	}
	if user.Groups[1] != group.DocumentID {
		t.Errorf("Group was not added to the user's groups")
	}
}
func TestUserShoppingPatchHandler(t *testing.T) {
	
	// Reset user data before running the test
	ResetUserData("testuser", "testrecipe")

	testuser, err := Firebase.ReturnCacheUser("testuser")
	if err != nil {
		t.Errorf("Error when fetching user: %v", err)
	}

	err = Firebase.PatchCacheUser(testuser)
	if err != nil {
		t.Errorf("Error when setting user: %v", err)
	}

	// Create a test shopping list
	testShoppingList := Firebase.ShoppingList{
		DocumentID: "testlist",
		Assignees:  []string{"testuser"},
		List: map[string]Firebase.ShoppingListItem{
			"itemID1": {
				Complete: false,
				Quantity: "1",
				Category: "test-category",
			},
		},
	}
	err = Firebase.PatchCacheShoppingList(testShoppingList)
	if err != nil {
		t.Errorf("Error when setting shopping list: %v", err)
	}

	// Encode the updated shopping list as JSON
	newShoppingList := Firebase.ShoppingList{
		DocumentID: "testlist",
		Assignees:  []string{"testuser"},
		List: map[string]Firebase.ShoppingListItem{
			"itemID2": {
				Complete: false,
				Quantity: "1",
				Category: "test-category",
			},
		},
	}
	jsonData, err := json.Marshal(newShoppingList)
	if err != nil {
		t.Errorf("Error while encoding JSON data: %v", err)
	}

	// Create a new request with the test user's username as a query parameter
	req, err := http.NewRequest("PATCH", "/shopping?username=testuser", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Errorf("Error while creating request: %v", err)
	}

	// Create a new recorder to record the
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(API.UserShoppingPatchHandler)
	handler.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check that the shopping list was updated
	updatedShoppingList, err := Firebase.ReturnCacheShoppingList(testShoppingList.DocumentID)
	if err != nil {
		t.Errorf("Error when fetching shopping list: %v", err)
	}
	if !reflect.DeepEqual(updatedShoppingList, newShoppingList) {
		t.Errorf("Shopping list was not updated correctly")
	}
}
