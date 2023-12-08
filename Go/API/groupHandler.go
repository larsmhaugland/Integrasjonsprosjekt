// Description: This file contains all the handlers for the /group endpoint
// It correctly reroutes the request to the correct handler based on the request method and URL
package API

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"prog-2052/Firebase"
	"strings"
)

// Different default images for groups
var DEFAULTIMAGES = []string{"defaultBackground1", "defaultBackground2", "defaultBackground3",
	"defaultBackground4", "defaultBackground5", "defaultBackground6", "defaultBackground7",
	"defaultBackground8", "defaultBackground9", "defaultBackground10", "defaultBackground11",
	"defaultBackground12", "defaultBackground13", "defaultBackground14", "defaultBackground15"}

// GroupBaseHandler handles all requests to the /group endpoint and reroutes them to the correct handler
func GroupBaseHandler(w http.ResponseWriter, r *http.Request) {

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
	case "members":
		GroupMemberBaseHandler(w, r)

	case "schedule":
		GroupScheduleBaseHandler(w, r)

	case "shopping":
		GroupShoppingBaseHandler(w, r)

	case "new":
		GroupNewHandler(w, r)

	case "deleteGroup":
		DeleteGroup(w, r)

	case "groupName":
		GetGroupName(w, r)

	case "leaveGroup":
		LeaveGroup(w, r)

	default:
		http.Error(w, "Error; Endpoint not supported", http.StatusBadRequest)
		return
	}
}

// DeleteGroup deletes the group with the groupID sent as parameter from the database
func DeleteGroup(w http.ResponseWriter, r *http.Request) {

	// Only delete method supported
	if r.Method == http.MethodDelete {

		// Retrieve the groupID from the query parameters
		groupID := r.URL.Query().Get("groupID")
		if groupID == "" {
			http.Error(w, "Error; Could not parse query parameters", http.StatusBadRequest)
			return
		}

		// Get the data for the specified group from cache/database
		group, err := Firebase.ReturnCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Could not get the group", http.StatusInternalServerError)
		}

		//Remove image from server
		ImagePath := "/UsrImages/"
		if r.Host == "localhost:8080" {
			ImagePath = "../Webserver/Images/"
		}
		if !strings.Contains(group.Image, "defaultBackground") {
			//Remove recipe image from storage
			err = os.Remove(ImagePath + group.Image + ".jpeg")
			if err != nil {
				http.Error(w, "Error when deleting image: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		// Delete the group and chat from the users
		for key, value := range group.Members {
			fmt.Println(key, value)
			user, err := Firebase.ReturnCacheUser(key)
			if err != nil {
				http.Error(w, "Could not delete the group from the user", http.StatusInternalServerError)
			}

			for i, chat := range user.Chats {
				if chat == group.Chat {
					user.Chats = append(user.Chats[:i], user.Chats[i+1:]...)
				}
			}
			for i, group := range user.Groups {
				if group == groupID {
					user.Groups = append(user.Groups[:i], user.Groups[i+1:]...)
				}
			}
			err = Firebase.PatchCacheUser(user)
			if err != nil {
				http.Error(w, "Could not patch user", http.StatusInternalServerError)
			}
		}

		// Delete the chat and group from Firebase
		err = Firebase.DeleteCacheChat(group.Chat)
		if err != nil {
			http.Error(w, "Could not delete the group chat from cache", http.StatusInternalServerError)
		}

		err = Firebase.DeleteCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Could not delete the group from cache", http.StatusInternalServerError)
		}
		// Respond with a success or error status
		w.WriteHeader(http.StatusOK)
	} else {
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
	}
}

// LeaveGroup deletes the user with the username sent as parameter from the group with the groupID sent as parameter
func LeaveGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodDelete {
		// Retrieve the query parameters from the URL
		groupID := r.URL.Query().Get("groupID")
		username := r.URL.Query().Get("username")

		// Delete the user from the group in the database
		err := Firebase.DeleteMemberFromGroup(groupID, username)
		if err != nil {
			http.Error(w, "Could not delete the user from the group", http.StatusInternalServerError)
		}

		// Get the group data from the database
		group, err := Firebase.ReturnCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Could not get the group", http.StatusInternalServerError)
		}

		// If there are no more members in the group, delete the group and chat from the database
		if len(group.Members) == 0 {
			err = Firebase.DeleteCacheChat(group.Chat)
			if err != nil {
				http.Error(w, "Could not delete the group chat", http.StatusInternalServerError)
			}
			err = Firebase.DeleteCacheGroup(groupID)
			if err != nil {
				http.Error(w, "Could not delete the group", http.StatusInternalServerError)
			}
		}
		// Respond with a success status
		w.WriteHeader(http.StatusOK)

	} else {
		http.Error(w, "Error: Method not supported", http.StatusBadRequest)
	}
}

// GetGroupName gets the name of the group with the specified groupID in the URL
func GetGroupName(w http.ResponseWriter, r *http.Request) {

	if r.Method == http.MethodGet {
		// Retrieve the groupID from the URL query parameter
		groupID := r.URL.Query().Get("groupID")

		// Get the group name from the database
		groupName, err := Firebase.GetGroupName(groupID)
		if err != nil {
			http.Error(w, "Could not get the group name", http.StatusInternalServerError)
		}

		// Encode the groupName to JSON format for the response
		err = EncodeJSONBody(w, r, groupName)
		if err != nil {
			http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
	}
}

// GroupNewHandler creates a new group and adds it to the database. It also creates a groupchat for the group
func GroupNewHandler(w http.ResponseWriter, r *http.Request) {

	var group Firebase.Group
	chatID := r.URL.Query().Get("chatID")

	// Decode the JSON body from the request and save it in the group struct
	err := DecodeJSONBody(w, r, &group)
	if err != nil {
		http.Error(w, "Error; Could not decode JSON body", http.StatusBadRequest)
		return
	}

	// Set a default image if none is specified
	if group.Image == "" {
		group.Image = DEFAULTIMAGES[rand.Int()%len(DEFAULTIMAGES)]
	}

	// Add the group to the database
	id, err := Firebase.AddGroup(group, chatID)
	if err != nil {
		http.Error(w, "Error; Could not add group", http.StatusInternalServerError)
		return
	}

	// Add the members from the request body to a new array
	chatMembers := make([]string, 0)
	for key := range group.Members {
		chatMembers = append(chatMembers, key)
	}
	// Create a Chat struct with the necessary fields for the database
	chat := Firebase.Chat{
		ChatOwner:  group.Owner,
		Name:       group.Name,
		Members:    chatMembers,
		DocumentID: chatID,
	}

	// Add the chat to the databse
	err = Firebase.AddNewChat(chat)
	if err != nil {
		http.Error(w, "Error; Could not create the group chat", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	//Add group id to body response
	json.NewEncoder(w).Encode(id)
}

// GroupMemberBaseHandler handles all requests to the /group/members endpoint and reroutes them to the correct handler
func GroupMemberBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupMemberGetHandler(w, r)

	case http.MethodPost:
		GroupMemberPostHandler(w, r)

	case http.MethodDelete:
		GroupMemberDeleteHandler(w, r)

	case http.MethodPatch:
		GroupMemberPatchHandler(w, r)
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// GroupMemberGetHandler updates the role for the specified user from the URL
func GroupMemberPatchHandler(w http.ResponseWriter, r *http.Request) {

	// Parse the query parameters from the URL
	username := r.URL.Query().Get("username")
	newRole := r.URL.Query().Get("newRole")
	groupID := r.URL.Query().Get("groupID")

	if username == "" || newRole == "" || groupID == "" {
		http.Error(w, "Error; Could not parse query parameters", http.StatusBadRequest)
		return
	}

	// Update the role for the specified user in the database
	err := Firebase.UpdateMemberRole(username, newRole, groupID)
	if err != nil {
		http.Error(w, "Failed to update role", http.StatusInternalServerError)
		return
	}

	// Respond with a success status
	w.WriteHeader(http.StatusOK)
}

// GroupMemberDeleteHandler deletes the specified user from the specified group
func GroupMemberDeleteHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the query parameters from the URL
	groupID := r.URL.Query().Get("groupID")
	username := r.URL.Query().Get("username")

	// Delete the user from the group in the database
	err := Firebase.DeleteMemberFromGroup(groupID, username)
	if err != nil {
		http.Error(w, "Could not delete user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// GroupMemberPostHandler adds a new user to the specified group
func GroupMemberPostHandler(w http.ResponseWriter, r *http.Request) {
	// Decode the JSON body from the request
	var reqBody Firebase.AddGroupMember
	err := DecodeJSONBody(w, r, &reqBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	// Add the user to the group in the database
	err = Firebase.AddUserToGroup(reqBody.Username, reqBody.GroupID)
	if err != nil {
		http.Error(w, "Could not add user to the group", http.StatusBadRequest)
		return
	}

	// Add the group to the user in the database
	err = Firebase.AddGroupToUser(reqBody.Username, reqBody.GroupID)
	if err != nil {
		http.Error(w, "Could not add the group to the user", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// GroupMemberGetHandler gets the name and roles of the members in the specified group
func GroupMemberGetHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the groupID from the query parameters
	groupID := r.URL.Query().Get("groupID")

	// Fetch and prepare the group members data based on the groupID
	groupMembersData, err := Firebase.GetGroupMembers(groupID)
	if err != nil {
		http.Error(w, "Could not get the name and roles of the group members", http.StatusInternalServerError)
		return
	}

	// Encode the group members data to JSON format for the response
	err = EncodeJSONBody(w, r, groupMembersData)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}
}

// GroupScheduleBaseHandler handles all requests to the /group/schedule endpoint and reroutes them to the correct handler
func GroupScheduleBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupScheduleGetHandler(w, r)

	case http.MethodPost:
		GroupSchedulePostHandler(w, r)

	case http.MethodDelete:
		GroupScheduleDeleteHandler(w, r)

	case http.MethodPatch:
		GroupSchedulePatchHandler(w, r)
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// GroupScheduleGetHandler retrieves the schedule for the specified group
func GroupScheduleGetHandler(w http.ResponseWriter, r *http.Request) {
	// Get the data for the group using the groupID from the query parameter in the URL
	groupID := r.URL.Query().Get("groupID")
	group, err := Firebase.ReturnCacheGroup(groupID)
	if err != nil {
		http.Error(w, "Error; Could not find group", http.StatusBadRequest)
		return
	}

	// Encode the schedule to JSON format for the response
	err = EncodeJSONBody(w, r, group.Schedule)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}

}

// GroupSchedulePostHandler adds a new schedule to the specified group
func GroupSchedulePostHandler(w http.ResponseWriter, r *http.Request) {

	// Define the input struct for the request body
	type input struct {
		Date         string   `json:"date"`
		CustomRecipe string   `json:"customRecipe"`
		Recipe       string   `json:"recipe"`
		Responsible  []string `json:"responsible"`
	}
	var requestBody input

	err := DecodeJSONBody(w, r, &requestBody)
	if err != nil {
		http.Error(w, "Error; Could not decode JSON body", http.StatusBadRequest)
		return
	}

	// Get the groupID from the query parameter in the URL and use it to get the group data from the database
	groupID := r.URL.Query().Get("groupID")
	if groupID == "" {
		http.Error(w, "Error; Could not find groupID", http.StatusBadRequest)
		return
	}
	group, err := Firebase.ReturnCacheGroup(groupID)
	if err != nil {
		http.Error(w, "Error; Could not find group", http.StatusBadRequest)
		return
	}

	// Create the schedule map if it does not exist and populate it with the correct data
	if group.Schedule == nil {
		group.Schedule = make(map[string]Firebase.Dinner)
	}
	group.Schedule[requestBody.Date] = Firebase.Dinner{
		CustomRecipe: requestBody.CustomRecipe,
		Recipe:       requestBody.Recipe,
		Responsible:  requestBody.Responsible,
	}

	// Update the group data in the database
	err = Firebase.PatchCacheGroup(group)
	if err != nil {
		http.Error(w, "Error; Could not patch group", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// These functions are not yet needed for the application, but are defined for potential future use.
func GroupScheduleDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
func GroupSchedulePatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// GroupShoppingBaseHandler handles all requests to the /group/shopping endpoint and reroutes them to the correct handler
func GroupShoppingBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupShoppingGetHandler(w, r)

	case http.MethodPost:
		GroupShoppingPostHandler(w, r)

	case http.MethodDelete:
		GroupShoppingDeleteHandler(w, r)

	case http.MethodPatch:
		GroupShoppingPatchHandler(w, r)
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// GroupShoppingGetHandler retrieves the shopping list for the specified group
func GroupShoppingGetHandler(w http.ResponseWriter, r *http.Request) {
	// Get the group data from the database using the groupID from the query parameter in the URL
	groupID := r.URL.Query().Get("groupID")
	shoppingList, err := Firebase.ReturnCacheGroup(groupID)
	if err != nil {
		http.Error(w, "Could not get the shopping list", http.StatusInternalServerError)
		return
	}

	// Encode the shopping list to JSON format for the response
	err = EncodeJSONBody(w, r, shoppingList)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}

}

// These functions are not yet needed for the application, but are defined for potential future use.
func GroupShoppingPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
func GroupShoppingDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// GroupShoppingPatchHandler updates the shopping list for the specified group
func GroupShoppingPatchHandler(w http.ResponseWriter, r *http.Request) {
	// Get the group data from the database using the groupID from the query parameter in the URL
	groupID := r.URL.Query().Get("groupID")
	group, err := Firebase.ReturnCacheGroup(groupID)
	if err != nil {
		http.Error(w, "Error while getting group: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get the shopping list data from the database using the shopping list ID from the group data
	listId := group.ShoppingLists[0]
	shoppingList, err := Firebase.ReturnCacheShoppingList(listId)
	if err != nil {
		http.Error(w, "Error while getting shopping list: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Decode the JSON body from the request and save it in the newshoppinglist struct
	var newshoppinglist Firebase.ShoppingList
	err = DecodeJSONBody(w, r, &newshoppinglist)
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
		return
	}

	// Update the necesasry data for the shoppingList
	shoppingList.Assignees = newshoppinglist.Assignees
	shoppingList.List = newshoppinglist.List

	// Update the shopping list in the database
	Firebase.PatchCacheShoppingList(shoppingList)
	if err != nil {
		http.Error(w, "Error while updating shopping lists", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}
