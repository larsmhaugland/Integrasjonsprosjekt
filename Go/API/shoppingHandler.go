package API

import (
	"net/http"
	"prog-2052/Firebase"
	"strings"
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

// ShoppingGetHandler handles GET requests to /shopping/{id}?userOrGroup={userOrGroup}
// Returns all shopping lists for a user or group
func ShoppingGetHandler(w http.ResponseWriter, r *http.Request) {
	userOrGroup := r.URL.Query().Get("userOrGroup")
	parts := strings.Split(r.URL.Path, "/")
	saveToID := parts[len(parts)-1]
	if saveToID == "" {
		http.Error(w, "Error; No id provided", http.StatusBadRequest)
		return
	}
	var shoppingLists []Firebase.ShoppingList

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
	} else {
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
		}
	}

	//Encode response to body
	err := EncodeJSONBody(w, r, shoppingLists)
	if err != nil {
		http.Error(w, "Error while encoding JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
}

func ShoppingPostHandler(w http.ResponseWriter, r *http.Request) {
	groupParam := r.URL.Query().Get("group")
	parts := strings.Split(r.URL.Path, "/")
	saveToID := parts[len(parts)-1]
	var shoppingList Firebase.ShoppingList
	err := DecodeJSONBody(w, r, &shoppingList)
	if err != nil {
		http.Error(w, "Error when decoding request POST: "+err.Error(), http.StatusBadRequest)
		return
	}
	id, err := Firebase.AddShoppingList(shoppingList)
	if err != nil {
		http.Error(w, "Error when adding shopping list: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if groupParam == "true" {
		group, err := Firebase.ReturnCacheGroup(saveToID)
		if err != nil {
			http.Error(w, "Error when getting group "+saveToID+": "+err.Error(), http.StatusInternalServerError)
			return
		}
		group.ShoppingLists = append(group.ShoppingLists, id)
		err = Firebase.PatchCacheGroup(group)
		if err != nil {
			http.Error(w, "Error when patching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		user, err := Firebase.ReturnCacheUser(saveToID)
		if err != nil {
			http.Error(w, "Error when getting user "+saveToID+": "+err.Error(), http.StatusInternalServerError)
			return
		}
		user.ShoppingLists = append(user.ShoppingLists, id)
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

/*				NOTE: Tenker vi ikke trenger denne fordi vi heller kan bare slette de fra Group eller User handler */

func ShoppingDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

/*				Samme gjelder egt denne også, kan heller være en del av user/group handler	*/
func ShoppingPatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
