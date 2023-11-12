package API

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"prog-2052/Firebase"
	"strings"
)

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
		break
	case "schedule":
		GroupScheduleBaseHandler(w, r)
		break
	case "shopping":
		GroupShoppingBaseHandler(w, r)
		break
	case "new":
		GroupNewHandler(w, r)
		break
	case "deleteGroup":
		DeleteGroup(w, r)
		break
	case "groupName":
		GetGroupName(w, r)
		break
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
		
		//Delete the chat and group from Firebase
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

func LeaveGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodDelete {
		// Retrieve the groupID from the query parameters
		groupID := r.URL.Query().Get("groupID")
		username := r.URL.Query().Get("username")

		err := Firebase.DeleteMemberFromGroup(groupID, username)
		if err != nil {
			http.Error(w, "Could not delete the user from the group", http.StatusInternalServerError)
		}

		// Delete the group if there are no members left
		group, err := Firebase.ReturnCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Could not get the group", http.StatusInternalServerError)
		}

		if len(group.Members) == 0 {
			err = Firebase.DeleteCacheChat(group.Chat)
			err = Firebase.DeleteCacheGroup(groupID)
			if err != nil {
				http.Error(w, "Could not delete the group", http.StatusInternalServerError)
			}
		}

		w.WriteHeader(http.StatusOK)

	} else {
		http.Error(w, "Error: Method not supported", http.StatusBadRequest)
	}
}
func GetGroupName(w http.ResponseWriter, r *http.Request) {

	if r.Method == http.MethodGet {
		groupID := r.URL.Query().Get("groupID")

		groupName, err := Firebase.GetGroupName(groupID)
		if err != nil {
			http.Error(w, "Could not get the group name", http.StatusInternalServerError)
		}

		err = EncodeJSONBody(w, r, groupName)
		if err != nil {
			http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
	}
}

func GroupNewHandler(w http.ResponseWriter, r *http.Request) {
	var group Firebase.Group
	chatID := r.URL.Query().Get("chatID")
	err := DecodeJSONBody(w, r, &group)
	if err != nil {
		http.Error(w, "Error; Could not decode JSON body", http.StatusBadRequest)
		return
	}
	if group.Image == "" {
		group.Image = DEFAULTIMAGES[rand.Int()%len(DEFAULTIMAGES)]
	}
	id, err := Firebase.AddGroup(group, chatID)
	if err != nil {
		http.Error(w, "Error; Could not add group", http.StatusInternalServerError)
		return
	}

	chatMembers := make([]string, 0)
	for key := range group.Members {
		chatMembers = append(chatMembers, key)
	}
	log.Println("Chat members: ", chatMembers)
	// Create a Chat struct with ChatOwner and Name
	chat := Firebase.Chat{
		ChatOwner:  group.Owner,
		Name:       group.Name,
		Members:    chatMembers,
		DocumentID: chatID,
	}

	err = Firebase.AddNewChat(chat)
	if err != nil {
		http.Error(w, "Error; Could not create the group chat", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	//Add group id to body response
	json.NewEncoder(w).Encode(id)
}

func GroupMemberBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupMemberGetHandler(w, r)
		break
	case http.MethodPost:
		GroupMemberPostHandler(w, r)
		break
	case http.MethodDelete:
		GroupMemberDeleteHandler(w, r)
		break
	case http.MethodPatch:
		GroupMemberPatchHandler(w, r)
		break
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func GroupMemberPatchHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the query parameters from the URL
	username := r.URL.Query().Get("username")
	newRole := r.URL.Query().Get("newRole")
	groupID := r.URL.Query().Get("groupID")
	if username == "" || newRole == "" || groupID == "" {
		http.Error(w, "Error; Could not parse query parameters", http.StatusBadRequest)
		return
	}

	err := Firebase.UpdateMemberRole(username, newRole, groupID)
	if err != nil {
		http.Error(w, "Failed to update role", http.StatusInternalServerError)
		return
	}

	// Respond with a success status
	w.WriteHeader(http.StatusOK)
}

// TODO: Er ikke denne lik relativt lik LeaveGroup?
func GroupMemberDeleteHandler(w http.ResponseWriter, r *http.Request) {
	groupID := r.URL.Query().Get("groupID")
	username := r.URL.Query().Get("username")

	err := Firebase.DeleteMemberFromGroup(groupID, username)
	if err != nil {
		http.Error(w, "Could not delete user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func GroupMemberPostHandler(w http.ResponseWriter, r *http.Request) {
	var reqBody Firebase.AddGroupMember
	err := DecodeJSONBody(w, r, &reqBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	err = Firebase.AddUserToGroup(reqBody.Username, reqBody.GroupID)
	if err != nil {
		http.Error(w, "Could not add user to the group", http.StatusBadRequest)
		return
	}

	err = Firebase.AddGroupToUser(reqBody.Username, reqBody.GroupID)
	if err != nil {
		http.Error(w, "Could not add the group to the user", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func GroupMemberGetHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the groupID from the query parameters
	groupID := r.URL.Query().Get("groupID")

	// Fetch and prepare the group members data based on the groupID
	groupMembersData, err := Firebase.GetGroupMembers(groupID)
	if err != nil {
		http.Error(w, "Could not get the name and roles of the group members", http.StatusInternalServerError)
		return
	}

	err = EncodeJSONBody(w, r, groupMembersData)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}
}

func GroupScheduleBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupScheduleGetHandler(w, r)
		break
	case http.MethodPost:
		GroupSchedulePostHandler(w, r)
		break
	case http.MethodDelete:
		GroupScheduleDeleteHandler(w, r)
		break
	case http.MethodPatch:
		GroupSchedulePatchHandler(w, r)
		break
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func GroupScheduleGetHandler(w http.ResponseWriter, r *http.Request) {
	groupID := r.URL.Query().Get("groupID")
	group, err := Firebase.ReturnCacheGroup(groupID)
	if err != nil {
		http.Error(w, "Error; Could not find group", http.StatusBadRequest)
		return
	}
	err = EncodeJSONBody(w, r, group.Schedule)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}

	//http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupSchedulePostHandler(w http.ResponseWriter, r *http.Request) {
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
	if group.Schedule == nil {
		group.Schedule = make(map[string]Firebase.Dinner)
	}

	group.Schedule[requestBody.Date] = Firebase.Dinner{
		CustomRecipe: requestBody.CustomRecipe,
		Recipe:       requestBody.Recipe,
		Responsible:  requestBody.Responsible,
	}
	err = Firebase.PatchCacheGroup(group)
	if err != nil {
		http.Error(w, "Error; Could not patch group", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func GroupScheduleDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupSchedulePatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupShoppingBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupShoppingGetHandler(w, r)
		break
	case http.MethodPost:
		GroupShoppingPostHandler(w, r)
		break
	case http.MethodDelete:
		GroupShoppingDeleteHandler(w, r)
		break
	case http.MethodPatch:
		GroupShoppingPatchHandler(w, r)
		break
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func GroupShoppingGetHandler(w http.ResponseWriter, r *http.Request) {
	//Retrieve shopping list for a group
	groupID := r.URL.Query().Get("groupID")
	shoppingList, err := Firebase.ReturnCacheGroup(groupID)
	if err != nil {
		http.Error(w, "Could not get the shopping list", http.StatusInternalServerError)
		return
	}
	err = EncodeJSONBody(w, r, shoppingList)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}

}

func GroupShoppingPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupShoppingDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupShoppingPatchHandler(w http.ResponseWriter, r *http.Request) {
	groupID := r.URL.Query().Get("groupID")
	group, err := Firebase.ReturnCacheGroup(groupID)

	listId := group.ShoppingLists[0]
	shoppingList, err := Firebase.ReturnCacheShoppingList(listId)
	if err != nil {
		http.Error(w, "Error while getting shopping list: "+err.Error(), http.StatusBadRequest)
		return
	}
	var newshoppinglist Firebase.ShoppingList
	err = DecodeJSONBody(w, r, &newshoppinglist)
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
		return
	}

	shoppingList.Assignees = newshoppinglist.Assignees
	shoppingList.List = newshoppinglist.List

	Firebase.PatchCacheShoppingList(shoppingList)
	if err != nil {
		http.Error(w, "Error while updating shopping lists", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}
