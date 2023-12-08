// Description: This file contains all the handlers for the /shopping endpoint
// It correctly reroutes the request to the correct handler based on the request method and URL
package API

import (
	"log"
	"net/http"
	"prog-2052/Firebase"
	"strings"
)

// ShoppingBaseHandler handles all requests to the /shopping endpoint and reroutes them to the correct handler
func ShoppingBaseHandler(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	switch r.Method {
	case http.MethodGet:
		ShoppingGetHandler(w, r)

	case http.MethodPost:
		ShoppingPostHandler(w, r)

	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

// ShoppingGetHandler handles GET requests to /shopping/{id}?userOrGroup={userOrGroup}
// Returns all shopping lists for a user or group
func ShoppingGetHandler(w http.ResponseWriter, r *http.Request) {
	// Get the query parameters from the URL
	userOrGroup := r.URL.Query().Get("userOrGroup")
	parts := strings.Split(r.URL.Path, "/")
	saveToID := parts[len(parts)-1]
	if saveToID == "" {
		http.Error(w, "Error; No id provided", http.StatusBadRequest)
		log.Printf("Error; No id provided")
		return
	}
	var shoppingLists []Firebase.ShoppingList

	// Get the shopping lists from the group
	if userOrGroup == "group" {
		group, err := Firebase.ReturnCacheGroup(saveToID)
		if err != nil {
			http.Error(w, "Error while getting group: "+err.Error(), http.StatusBadRequest)
			return
		}

		//Get all shopping lists from DB using the IDs in the group struct
		for _, shoppingListID := range group.ShoppingLists {
			shoppingList, err := Firebase.ReturnCacheShoppingList(shoppingListID)
			if err != nil {
				http.Error(w, "Error while getting shopping list: "+err.Error(), http.StatusBadRequest)
				return
			}
			shoppingLists = append(shoppingLists, shoppingList)
		}
	} else { // Get the shopping lists from the user
		user, err := Firebase.ReturnCacheUser(saveToID)
		if err != nil {
			http.Error(w, "Error while getting user: "+err.Error(), http.StatusBadRequest)
			return
		}

		//Get all shopping lists from DB using the IDs in the user struct
		for _, shoppingListID := range user.ShoppingLists {
			shoppingList, err := Firebase.ReturnCacheShoppingList(shoppingListID)
			if err != nil {
				http.Error(w, "Error while getting shopping list: "+err.Error(), http.StatusBadRequest)
				return
			}
			shoppingLists = append(shoppingLists, shoppingList)
			log.Printf("Shopping list: %v", shoppingList)
		}
	}

	//Encode response to body
	err := EncodeJSONBody(w, r, shoppingLists)
	if err != nil {
		http.Error(w, "Error while encoding JSON: "+err.Error(), http.StatusBadRequest)
		log.Printf("Error while encoding JSON: " + err.Error())
		return
	}
}

// ShoppingPostHandler handles POST requests to /shopping/{id}?group={trueOrFalse}
// It adds a shopping list in the database to a user or group
func ShoppingPostHandler(w http.ResponseWriter, r *http.Request) {
	// Get the query parameters from the URL
	groupParam := r.URL.Query().Get("group")
	parts := strings.Split(r.URL.Path, "/")
	saveToID := parts[len(parts)-1]
	var shoppingList Firebase.ShoppingList
	err := DecodeJSONBody(w, r, &shoppingList)
	if err != nil {
		http.Error(w, "Error when decoding request POST: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Add the shopping list to the shopping list collection in the database
	id, err := Firebase.AddShoppingList(shoppingList)
	if err != nil {
		http.Error(w, "Error when adding shopping list: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Add the shopping list to the group
	if groupParam == "true" {
		group, err := Firebase.ReturnCacheGroup(saveToID)
		if err != nil {
			http.Error(w, "Error when getting group "+saveToID+": "+err.Error(), http.StatusInternalServerError)
			return
		}
		group.ShoppingLists = append(group.ShoppingLists, id)
		// Update the group in the database with the new shopping list
		err = Firebase.PatchCacheGroup(group)
		if err != nil {
			http.Error(w, "Error when patching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else { // Add the shopping list to the user
		user, err := Firebase.ReturnCacheUser(saveToID)
		if err != nil {
			http.Error(w, "Error when getting user "+saveToID+": "+err.Error(), http.StatusInternalServerError)
			return
		}
		user.ShoppingLists = append(user.ShoppingLists, id)
		// Update the user in the database with the new shopping list
		err = Firebase.PatchCacheUser(user)
		if err != nil {
			http.Error(w, "Error when patching user: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusCreated)
	err = EncodeJSONBody(w, r, id)
	if err != nil {
		http.Error(w, "Error when encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
