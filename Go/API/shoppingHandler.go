package API

import (
	"net/http"
	"prog-2052/Firebase"
)

func ShoppingBaseHandler(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	switch r.Method {
	case http.MethodGet:
		ShoppingGetHandler(w, r)
		break
	case http.MethodPost:
		ShoppingPostHandler(w, r)
		break
	case http.MethodDelete:
		ShoppingDeleteHandler(w, r)
		break
	case http.MethodPatch:
		ShoppingPatchHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func ShoppingGetHandler(w http.ResponseWriter, r *http.Request) {
	username := r.Header.Get("username")
	if username == "" {
		http.Error(w, "Error; No username provided", http.StatusBadRequest)
		return
	}
	//Get user from cache
	user, err := Firebase.ReturnCacheUser(username)
	if err != nil {
		http.Error(w, "Error while getting user: "+err.Error(), http.StatusBadRequest)
		return
	}

	var shoppingLists []Firebase.ShoppingList
	//Get all shopping lists from DB using the IDs in the user struct
	for _, shoppingListID := range user.ShoppingLists {
		shoppingList, err := Firebase.ReturnCacheShoppingList(shoppingListID)
		if err != nil {
			http.Error(w, "Error while getting shopping list: "+err.Error(), http.StatusBadRequest)
			return
		}
		shoppingLists = append(shoppingLists, shoppingList)
	}
	//Encode response to body
	err = EncodeJSONBody(w, r, shoppingLists)
	if err != nil {
		http.Error(w, "Error while encoding JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
}

func ShoppingPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func ShoppingDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func ShoppingPatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
