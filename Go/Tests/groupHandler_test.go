package Tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"prog-2052/API"
	"prog-2052/Firebase"
	"strings"
	"testing"
	"time"
)

func ResetGroupData(name string, chat string, username string, recipe string, extraMembers bool) {
	group, err := Firebase.ReturnCacheGroup(name)
	if err != nil {
		fmt.Println("Error when fetching user: " + err.Error())
	}
	group.Name = name
	if extraMembers {
		group.Members = map[string]string{username: "owner", "testuser2": "member"}
	} else {
		group.Members = map[string]string{username: "owner"}
	}
	group.Recipes = map[string]Firebase.GroupRecipe{recipe: {
		Owner: username,
	}}
	//group.Recipes = make(map[string]Firebase.GroupRecipe)
	specificTime := time.Date(2023, 11, 15, 9, 56, 6, 0, time.UTC)
	group.Recipes["testrecipe"] = Firebase.GroupRecipe{LastEaten: specificTime, Owner: username}
	group.ShoppingLists = []string{"testshoppinglistgroup"}
	group.Schedule = map[string]Firebase.Dinner{}
	group.Schedule = make(map[string]Firebase.Dinner)
	group.Schedule["2020-01-01"] = Firebase.Dinner{Recipe: "testrecipe", Responsible: []string{username}}
	group.Chat = chat
	group.DocumentID = name
	err = Firebase.PatchCacheGroup(group)
	if err != nil {
		fmt.Println("Error when patching group: " + err.Error())
	}
}

func TestDeleteGroup(t *testing.T) {
	ResetUserData("testuser", "testrecipe")
	ResetGroupData("testgroupdelete", "testchatdelete", "testuser", "testrecipe", false)

	newChat := Firebase.Chat{
		Name:       "testDeleteChatID",
		Members:    []string{"testuser"},
		ChatOwner:  "testuser",
		DocumentID: "testchatdelete",
	}

	Firebase.AddNewChat(newChat)

	// Create a new request with a DELETE method and a groupID query parameter
	req, err := http.NewRequest(http.MethodDelete, "/deleteGroup?groupID=testgroupdelete", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	// Call the DeleteGroup function with the request and response recorder
	DeleteGroupTest(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check that the group was deleted from cache
	_, err = Firebase.ReturnCacheGroup("testgroupdelete")
	if err == nil {
		t.Errorf("group was not deleted from cache")
	}

	// Check that the chat was deleted from cache
	_, err = Firebase.ReturnCacheChat("testchatdelete")
	if err == nil {
		t.Errorf("chat was not deleted from cache")
	}

	// Check that the group was deleted from all users
	users := []string{"testuser"}
	for _, user := range users {
		u, err := Firebase.ReturnCacheUser(user)
		if err != nil {
			t.Errorf("could not get user from cache")
		}
		for _, group := range u.Groups {
			if group == "testgroupdelete" {
				t.Errorf("group was not deleted from user")
			}
		}
		for _, chat := range u.Chats {
			if chat == "testchatdelete" {
				t.Errorf("chat was not deleted from user")
			}
		}
	}
}
func TestLeaveGroup(t *testing.T) {
	ResetChatData("testchat2")
	ResetGroupData("testgroup2", "testchat2", "testuser3", "testrecipe", true)
	ResetUserData("testuser3", "testrecipe")

	// Create a new request with a DELETE method and groupID and username query parameters
	req, err := http.NewRequest(http.MethodDelete, "/leaveGroup?groupID=testgroup2&username=testuser3", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.LeaveGroup(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check that the user was deleted from the group
	group, err := Firebase.ReturnCacheGroup("testgroup2")
	if err != nil {
		t.Errorf("could not get group from cache")
	}
	if _, ok := group.Members["testuser3"]; ok {
		t.Errorf("user was not deleted from group")
	}

	// Check that the group was deleted from all users
	users := []string{"testuser3"}
	for _, user := range users {
		u, err := Firebase.ReturnCacheUser(user)
		if err != nil {
			t.Errorf("could not get user from cache")
		}
		for _, group := range u.Groups {
			if group == "testgroup2" {
				t.Errorf("group was not deleted from user")
			}
		}
		for _, chat := range u.Chats {
			if chat == "testchat2" {
				t.Errorf("chat was not deleted from user")
			}
		}
	}
}

func TestGetGroupName(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	// Create a new request with a GET method and a groupID query parameter
	req, err := http.NewRequest(http.MethodGet, "/getGroupName?groupID=testgroup", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GetGroupName(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check the response body of the response recorder
	expected := `"testgroup"`
	if strings.TrimSuffix(rr.Body.String(), "\n") != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
}

func TestGroupNewHandler(t *testing.T) {

	// Create a new request with a POST method and a JSON body
	group := Firebase.Group{
		Name:       "testgroup2",
		Owner:      "testuser",
		Members:    map[string]string{"testuser": "owner"},
		DocumentID: "testgroup2",
	}

	jsonBody, err := json.Marshal(group)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest(http.MethodPost, "/groupNew?chatID=testchatnew", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupNewHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	// Check that the group was added to cache
	_, err = Firebase.ReturnCacheGroup("testgroup2")
	if err != nil {
		t.Errorf("group was not added to cache")
	}

	// Check that the chat was added to cache
	_, err = Firebase.ReturnCacheChat("testchatnew")
	if err != nil {
		t.Errorf("chat was not added to cache")
	}

	// Check the response body of the response recorder
	var id string
	err = json.NewDecoder(rr.Body).Decode(&id)
	if err != nil {
		t.Errorf("could not decode response body")
	}
	if id == "" {
		t.Errorf("handler returned empty group id")
	}
}

func TestGroupMemberPatchHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)
	ResetUserData("testuser", "testrecipe")

	// Create a new request with a PATCH method and query parameters
	req, err := http.NewRequest(http.MethodPatch, "/groupMemberPatch?username=testuser&newRole=member&groupID=testgroup", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupMemberPatchHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check that the member's role was updated in the group
	group, err := Firebase.ReturnCacheGroup("testgroup")
	if err != nil {
		t.Errorf("could not get group from cache")
	}
	if group.Members["testuser"] != "member" {
		t.Errorf("member's role was not updated in group")
	}
}

func TestGroupMemberPostHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	// Create a new request with a POST method and a JSON body
	addGroupMember := Firebase.AddGroupMember{
		Username: "testuser3",
		GroupID:  "testgroup",
	}
	jsonBody, err := json.Marshal(addGroupMember)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest(http.MethodPost, "/groupMemberPost", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	// Call the handler function
	API.GroupMemberPostHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check that the user was added to the group
	group, err := Firebase.ReturnCacheGroup("testgroup")
	if err != nil {
		t.Errorf("could not get group from cache")
	}
	if _, ok := group.Members["testuser3"]; !ok {
		t.Errorf("user was not added to group")
	}

	// Check that the group was added to the user
	user, err := Firebase.ReturnCacheUser("testuser2")
	if err != nil {
		t.Errorf("could not get user from cache")
	}
	groupFound := false
	for _, group := range user.Groups {
		if group == "testgroup" {
			groupFound = true
		}
	}
	if !groupFound {
		t.Errorf("group was not added to user")
	}
}

func TestGroupMemberGetHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	// Create a new request with a GET method and a groupID query parameter
	req, err := http.NewRequest(http.MethodGet, "/groupMemberGet?groupID=testgroup", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupMemberGetHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := `[{"username":"testuser","roleName":"owner"}]`
	if strings.TrimSuffix(rr.Body.String(), "\n") != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
}

func TestGroupScheduleGetHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	// Create a new request with a GET method and a groupID query parameter
	req, err := http.NewRequest(http.MethodGet, "/groupScheduleGet?groupID=testgroup", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupScheduleGetHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check the response body of the response recorder
	expected := `{"2020-01-01":{"customRecipe":"","recipe":"testrecipe","responsible":["testuser"]}}`
	if strings.TrimSuffix(rr.Body.String(), "\n") != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
}
func TestGroupSchedulePostHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)
	group, err := Firebase.ReturnCacheGroup("testgroup")
	if err != nil {
		t.Errorf("could not get group from cache")
	}
	group.Schedule = nil
	Firebase.PatchCacheGroup(group)

	type scheduleTest struct {
		Date         string   `json:"date"`
		CustomRecipe string   `json:"customRecipe"`
		Recipe       string   `json:"recipe"`
		Responsible  []string `json:"responsible"`
	}
	schedule := scheduleTest{
		Date:         "2020-01-01",
		CustomRecipe: "testcustomrecipe",
		Recipe:       "testrecipe",
		Responsible:  []string{"testuser"},
	}

	// Create a new request with a POST method and a JSON body
	jsonBody, err := json.Marshal(schedule)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest(http.MethodPost, "/groupSchedulePost?groupID=testgroup&date=2020-01-01", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupSchedulePostHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check that the schedule was added to the group
	group2, err := Firebase.ReturnCacheGroup("testgroup")
	if err != nil {
		t.Errorf("could not get group from cache")
	}
	if _, ok := group2.Schedule["2020-01-01"]; !ok {
		t.Errorf("schedule was not added to group")
	}
}
func TestGroupSchedulePostHandlerWrongdata(t *testing.T) {

	type scheduleTest struct {
		Date         string   `json:"date"`
		CustomRecipe string   `json:"customRecipe"`
		Recipe       string   `json:"recipe"`
		Responsible  []string `json:"responsible"`
	}
	schedule := scheduleTest{
		Date:         "2020-01-01",
		CustomRecipe: "0",
		Recipe:       "wrong",
		Responsible:  []string{"testuser"},
	}

	jsonBody, err := json.Marshal(schedule)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest(http.MethodPost, "/groupSchedulePost?groupID=test&date=", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupSchedulePostHandler(rr, req)
	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
}

func TestGroupShoppingGetHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	// Create a new request with a GET method and a groupID query parameter
	req, err := http.NewRequest(http.MethodGet, "/groupShoppingGet?groupID=testgroup", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupShoppingGetHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Define a struct to represent the shopping part of the response
	type ShoppingPart struct {
		ShoppingLists []string `json:"shopping-lists"`
	}

	// Unmarshal the response into the ShoppingPart struct
	var gotShoppingPart ShoppingPart
	err = json.Unmarshal(rr.Body.Bytes(), &gotShoppingPart)
	if err != nil {
		t.Fatalf("error unmarshaling response body: %v", err)
	}

	expected := `{"documentID":"testgroup","members":{"testuser":"owner"},"owner":"","name":"testgroup","recipes":{"testrecipe":{"lastEaten":"2023-11-15T09:56:06Z","owner":"testuser"}},"schedule":{"2020-01-01":{"customRecipe":"","recipe":"testrecipe","responsible":["testuser"]}},"shopping-lists":["testshoppinglistgroup"],"chat":"testchat","image":""}`
	// Compare the ShoppingPart structs
	if strings.TrimSuffix(rr.Body.String(), "\n") != expected {
		t.Errorf("handler returned unexpected shopping part: got %v want %v", rr.Body.String(), expected)
	}
}

func TestGroupShoppingPatchHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	newShoppingList := Firebase.ShoppingList{
		DocumentID: "testshoppinglistgroup",
		Assignees:  []string{"testuser"},
		List: map[string]Firebase.ShoppingListItem{
			"item1": {Complete: false, Quantity: "1", Category: "category1"},
			"item2": {Complete: false, Quantity: "1", Category: "category2"},
		},
	}

	// Now you can encode this struct as JSON for the request body
	body, err := json.Marshal(newShoppingList)
	if err != nil {
		t.Fatal(err)
	}
	// Create a new request with a PATCH method and a groupID query parameter
	req, err := http.NewRequest(http.MethodPatch, "/groupShoppingPatch?groupID=testgroup", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupShoppingPatchHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Check that the shopping list was updated in cache
	group, err := Firebase.ReturnCacheGroup("testgroup")
	if err != nil {
		t.Errorf("could not get group from cache")
	}
	listId := group.ShoppingLists[0]
	shoppingList, err := Firebase.ReturnCacheShoppingList(listId)
	if err != nil {
		t.Errorf("could not get shopping list from cache")
	}
	if len(shoppingList.List) != 2 {
		t.Errorf("shopping list was not updated in cache")
	}
}

func TestGroupShoppingPatchHandlerWrongGroup(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	newShoppingList := Firebase.ShoppingList{
		DocumentID: "ListDoesNotexist",
		Assignees:  []string{"testuser"},
		List: map[string]Firebase.ShoppingListItem{
			"item1": {Complete: false, Quantity: "1", Category: "category1"},
			"item2": {Complete: false, Quantity: "1", Category: "category2"},
		},
	}

	// Now you can encode this struct as JSON for the request body
	body, err := json.Marshal(newShoppingList)
	if err != nil {
		t.Fatal(err)
	}
	// Create a new request with a PATCH method and a groupID query parameter
	req, err := http.NewRequest(http.MethodPatch, "/groupShoppingPatch?groupID=groupnonexistent", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}

	// Create a new response recorder
	rr := httptest.NewRecorder()

	API.GroupShoppingPatchHandler(rr, req)

	// Check the status code of the response recorder
	if status := rr.Code; status != http.StatusInternalServerError {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}
