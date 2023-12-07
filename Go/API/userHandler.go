package API

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"golang.org/x/crypto/sha3"
	"log"
	"net/http"
	"prog-2052/Firebase"
	"strings"
	"time"
)

func UserBaseHandler(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.Error(w, "Error; Incorrect usage of URL.", http.StatusBadRequest)
		return
	}
	switch parts[2] {
	case http.MethodOptions: // For CORS
		return
	case "credentials":
		UserCredentialBaseHandler(w, r)

	case "groups":
		UserGroupBaseHandler(w, r)

	case "search":
		UserSearchHandler(w, r)
	case "shopping":
		UserShoppingBaseHandler(w, r)
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func UserCredentialBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		if r.URL.Path == "/user/credentials/checkCookie" {
			CheckUserCookie(w, r)
		} else if r.URL.Path == "/user/credentials/login" {
			UserCredentialPostLoginHandler(w, r)
		} else if r.URL.Path == "/user/credentials/register" {
			UserCredentialPostHandler(w, r)
		}

	case http.MethodPatch:
		UserCredentialPatchHandler(w, r)

	case http.MethodDelete:
		UserCredentialDeleteHandler(w, r)

	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
	}
}

func CheckUserCookie(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	/*
		authCookie, err := r.Cookie("AuthToken")
		if err != nil || authCookie == nil || authCookie.Value != "test" {
			// Authentication failed, redirect to login page or return an error
			http.Error(w, "Cookie not valid", http.StatusUnauthorized)
			return
		}
	*/
}

func UserCredentialPostLoginHandler(w http.ResponseWriter, r *http.Request) {
	//Decode the JSON body
	var user Firebase.User
	err := DecodeJSONBody(w, r, &user)
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
		return
	}
	//Get the user credentials from the database
	credentials, err := Firebase.ReturnCacheUser(user.Username)
	if err != nil {
		http.Error(w, "Error while getting user credentials"+err.Error(), http.StatusBadRequest)
		return
	}

	//Hash the password
	user.Password, err = HashPassword(user.Password)

	if err != nil {
		log.Println("Error while hashing password")
		http.Error(w, "Error while hashing password", http.StatusBadRequest)
		return
	}

	//Check if the credentials match
	if user.Username == credentials.Username && user.Password == credentials.Password {
		// Create a new cookie
		authCookie := http.Cookie{
			Name:     "AuthToken",                    // Cookie name
			Value:    "test",                         // Set authentication token
			Expires:  time.Now().Add(24 * time.Hour), // Set expiration time
			Path:     "/",                            // Cookie is valid for all paths
			SameSite: http.SameSiteNoneMode,
		}
		// Add the cookie to the response
		http.SetCookie(w, &authCookie)
	} else {
		http.Error(w, "Wrong username or password", http.StatusBadRequest)
		return
	}

}

func UserCredentialPostHandler(w http.ResponseWriter, r *http.Request) {
	//Decode the JSON body
	var user Firebase.User
	err := DecodeJSONBody(w, r, &user)
	fmt.Println(user)
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
		return
	}
	//Hash password
	user.Password, err = HashPassword(user.Password)

	if err != nil {
		fmt.Println("Error while hashing password")
		http.Error(w, "Error while hashing password", http.StatusBadRequest)
		return
	}
	//Add the user to the database
	err = Firebase.AddUser(user)
	if err != nil {
		if err == Firebase.ErrUserExists {
			http.Error(w, "User already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Error while adding user", http.StatusBadRequest)
		return
	}
	//Create a new cookie
	authCookie := http.Cookie{
		Name:     "AuthToken",                    // Cookie name
		Value:    "test",                         // Set authentication token
		Expires:  time.Now().Add(24 * time.Hour), // Set expiration time
		Path:     "/",                            // Cookie is valid for all paths
		SameSite: http.SameSiteNoneMode,
	}
	//Add the cookie to the response
	http.SetCookie(w, &authCookie)
	w.WriteHeader(http.StatusCreated)
}

func HashPassword(password string) (string, error) {
	hash := sha3.New384()
	_, err := hash.Write([]byte(password))
	if err != nil {
		return "", err
	}
	hashInBytes := hash.Sum(nil)
	hashString := hex.EncodeToString(hashInBytes)
	return hashString, nil
}

func UserCredentialDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func UserCredentialPatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func UserGroupBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	
	case http.MethodGet:
		UserGroupGetHandler(w, r)
	
	case http.MethodPost:
		UserGroupPostHandler(w, r)
	
	case http.MethodOptions: // For CORS

	case http.MethodDelete:
		UserGroupDeleteHandler(w, r)

	case http.MethodPatch:
		UserGroupPatchHandler(w, r)
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func UserGroupGetHandler(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	groups, err := Firebase.ReturnCacheUser(username)
	if err != nil {
		http.Error(w, "Error while getting user", http.StatusBadRequest)
		return
	}

	uniqueGroupIds := make(map[string]struct{})
	var uniqueGroups []Firebase.Group

	for _, groupID := range groups.Groups {
		_, exists := uniqueGroupIds[groupID]
		if !exists {
			groupData, err := Firebase.ReturnCacheGroup(groupID)
			if err != nil {
				http.Error(w, "Error while getting group data", http.StatusBadRequest)
				return
			}
			uniqueGroups = append(uniqueGroups, groupData)
			uniqueGroupIds[groupID] = struct{}{}
		}
	}
	err = EncodeJSONBody(w, r, uniqueGroups)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}
}

func UserSearchHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		partialUsername := r.URL.Query().Get("partialUsername")
		userNames, err := Firebase.GetUsernamesFromPartialName(partialUsername)
		if err != nil {
			http.Error(w, "Error querying firebase for usernames", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err2 := EncodeJSONBody(w, r, userNames)
		if err2 != nil {
			http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
			return
		}
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func UserGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func UserGroupDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func UserGroupPatchHandler(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	log.Print("Username: " + username)
	user, err := Firebase.ReturnCacheUser(username)
	if err != nil {
		http.Error(w, "Error while getting user", http.StatusBadRequest)
		log.Printf("Error while getting user: %v\n", err)
		return
	}

	var groupID string
	err = DecodeJSONBody(w, r, &groupID)
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
		log.Printf("Error while decoding JSON body: %v\n", err)
		return
	}

	for _, group := range user.Groups {
		if group == groupID {
			http.Error(w, "User already in group", http.StatusBadRequest)
			log.Printf("User already in group\n")
			return
		}
	}
	user.Groups = append(user.Groups, groupID)

	// Now, update the user in the database
	err = Firebase.PatchCacheUser(user)
	if err != nil {
		http.Error(w, "Error while updating user", http.StatusBadRequest)
		log.Printf("Error while updating user: %v\n", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func UserShoppingBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodOptions: // For CORS
	
	case http.MethodDelete:
		UserShoppingDeleteHandler(w, r)

	case http.MethodPatch:
		UserShoppingPatchHandler(w, r)
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func UserShoppingDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func UserShoppingPatchHandler(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	user, err := Firebase.ReturnCacheUser(username)
	if err != nil {
		http.Error(w, "Error while getting user", http.StatusBadRequest)
		return
	}

	listId := user.ShoppingLists[0]
	log.Printf("List ID: %v\n", listId)
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

func DecodeJSONBody(w http.ResponseWriter, r *http.Request, u interface{}) error {
	// Decode the JSON body
	err := json.NewDecoder(r.Body).Decode(u)
	if err != nil {
		return err
	}
	return nil
}

func EncodeJSONBody(w http.ResponseWriter, r *http.Request, u interface{}) error {
	err := json.NewEncoder(w).Encode(u)
	if err != nil {
		return err
	}
	return nil
}
