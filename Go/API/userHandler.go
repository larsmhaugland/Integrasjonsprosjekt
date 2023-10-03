package API

import (
	"encoding/json"
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
		break
	case "recipes":
		UserRecipeBaseHandler(w, r)
		break
	case "groups":
		UserGroupBaseHandler(w, r)
		break
	case "search":
		UserSearchHandler(w, r)

	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func UserRecipeBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		UserRecipeGetHandler(w, r)
		break
	case http.MethodPost:
		UserRecipePostHandler(w, r)
		break
	case http.MethodDelete:
		UserRecipeDeleteHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func UserRecipeDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func UserRecipePostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func UserRecipeGetHandler(w http.ResponseWriter, r *http.Request) {
	//Get username from header
	username := r.Header.Get("username")
	user, err := Firebase.ReturnCacheUser(username)
	if err != nil {
		http.Error(w, "Error while getting user recipes: "+err.Error(), http.StatusBadRequest)
		return
	}
	//Get parameters from URL
	includeGroups := r.URL.Query().Get("groups")

	var recipes []Firebase.Recipe
	var groups []string
	if includeGroups == "true" {
		for _, group := range user.Groups {
			g, err := Firebase.ReturnCacheGroup(group)
			if err != nil {
				http.Error(w, "Error while getting group recipes: "+err.Error(), http.StatusBadRequest)
				return
			}
			for _, id := range g.Recipes {
				recipe, err := Firebase.ReturnCacheRecipe(id)
				if err != nil {
					http.Error(w, "Error while getting recipe: "+err.Error(), http.StatusBadRequest)
					return
				}
				recipes = append(recipes, recipe)
				groups = append(groups, group)
			}
		}
	}
	data := map[string]interface{}{
		"GroupRecipes": recipes,
		"UserRecipes":  user.Recipes,
	}

	err = EncodeJSONBody(w, r, data)
	if err != nil {
		http.Error(w, "Error while encoding JSON body: "+err.Error(), http.StatusInternalServerError)
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
		break
	case http.MethodPatch:
		UserCredentialPatchHandler(w, r)
		break
	case http.MethodDelete:
		UserCredentialDeleteHandler(w, r)
		break
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

	//Check if the credentials match
	if user.Username == credentials.Username && user.Password == credentials.Password {
		// Create a new cookie
		authCookie := http.Cookie{
			Name:     "AuthToken",                    // Cookie name
			Value:    "test",                         // Set your authentication token
			Expires:  time.Now().Add(24 * time.Hour), // Set expiration time
			HttpOnly: true,                           // Cookie is not accessible via JavaScript
			Path:     "/",                            // Cookie is valid for all paths
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
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
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
		Value:    "test",                         // Set your authentication token
		Expires:  time.Now().Add(24 * time.Hour), // Set expiration time
		HttpOnly: true,                           // Cookie is not accessible via JavaScript
		Path:     "/",                            // Cookie is valid for all paths
		Secure:   true,                           // Cookie is only valid for HTTPS
	}
	//Add the cookie to the response
	http.SetCookie(w, &authCookie)
	http.Error(w, "User added", http.StatusCreated)

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
		break
	case http.MethodPost:
		UserGroupPostHandler(w, r)
		break
	case http.MethodDelete:
		UserGroupDeleteHandler(w, r)
		break
	case http.MethodPatch:
		UserGroupPatchHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func UserGroupGetHandler(w http.ResponseWriter, r *http.Request) {
	var user Firebase.User
	err := DecodeJSONBody(w, r, &user)
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
		return
	}
	groups, err := Firebase.ReturnCacheUser(user.Username)
	if err != nil {
		http.Error(w, "Error while getting user groups", http.StatusBadRequest)
		return
	}
	err = EncodeJSONBody(w, r, groups)
	if err != nil {
		http.Error(w, "Error while encoding JSON body", http.StatusInternalServerError)
		return
	}
}

func UserSearchHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		partialUsername := r.URL.Query().Get("partialUsername")
		err, userNames := Firebase.GetUsernamesFromPartialName(partialUsername)
		if err != nil {
			http.Error(w, "Could not find usernames that match input username from the database", http.StatusBadRequest)
			return
		}
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
	http.Error(w, "Not implemented", http.StatusNotImplemented)
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
