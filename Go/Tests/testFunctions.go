package Tests

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"prog-2052/API"
	"prog-2052/Firebase"
	"strings"
	"time"

	"google.golang.org/api/iterator"
)

func RecipeDeleteHandlerTest(w http.ResponseWriter, r *http.Request) {

	var user Firebase.User
	err := API.DecodeJSONBody(w, r, &user)
	if err != nil {
		http.Error(w, "Error when decoding request DELETE: "+err.Error(), http.StatusBadRequest)
		return
	}
	recipeID := strings.Split(r.URL.Path, "/")[len(strings.Split(r.URL.Path, "/"))-1]
	if recipeID == "" {
		http.Error(w, "Error; No id provided", http.StatusBadRequest)
		return
	}

	//Get user from cache
	user, err = Firebase.ReturnCacheUser(user.Username)
	if err != nil {
		http.Error(w, "Error when fetching user: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Search for recipe in user
	index := -1
	for i, rID := range user.Recipes {
		if rID == recipeID {
			index = i
			break
		}
	}
	//If recipe is found, remove it from user
	if index != -1 {
		user.Recipes = append(user.Recipes[:index], user.Recipes[index+1:]...)
		err = Firebase.PatchCacheUser(user)
		if err != nil {
			http.Error(w, "Error when patching user: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	//Remove recipe from groups
	for _, groupID := range user.Groups {
		group, err := Firebase.ReturnCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Error when fetching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
		//If recipe is found, remove it from group
		if ok := group.Recipes[recipeID]; ok != (Firebase.GroupRecipe{}) {
			delete(group.Recipes, recipeID)
			err = Firebase.PatchCacheGroup(group)
			if err != nil {
				http.Error(w, "Error when patching group: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}
	//Remove recipe from firebase
	err = Firebase.DeleteRecipe(recipeID)
	if err != nil {
		http.Error(w, "Error when deleting recipe: "+err.Error(), http.StatusInternalServerError)
		return
	}
	delete(Firebase.RecipeCache, recipeID)
}

func DeleteGroupTest(w http.ResponseWriter, r *http.Request) {

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

func UserCredentialPostHandlerTest(w http.ResponseWriter, r *http.Request) {
	//Decode the JSON body
	var user Firebase.User
	err := API.DecodeJSONBody(w, r, &user)
	fmt.Println(user)
	if err != nil {
		http.Error(w, "Error while decoding JSON body", http.StatusBadRequest)
		return
	}
	//Hash password
	user.Password, err = API.HashPassword(user.Password)

	if err != nil {
		fmt.Println("Error while hashing password")
		http.Error(w, "Error while hashing password", http.StatusBadRequest)
		return
	}
	//Add the user to the database
	err = AddUserTest(user, user.DocumentID)
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
		Path:     "/",                            // Cookie is valid for all paths
		SameSite: http.SameSiteNoneMode,
	}
	//Add the cookie to the response
	http.SetCookie(w, &authCookie)
	w.WriteHeader(http.StatusCreated)
}

func AddUserTest(user Firebase.User, userID string) error {

	ctx := context.Background()
	client, err := Firebase.GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	//Check if user already exists
	iter := client.Collection("users").Where("username", "==", user.Username).Documents(ctx)
	for {
		_, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Println("Error; Failed to iterate")
			return err
		}
		return Firebase.ErrUserExists
	}

	//Add user to database
	data := map[string]interface{}{
		"username": user.Username,
		"password": user.Password,
		"name":     user.Name,
	}
	docRef := client.Collection("users").Doc(userID)
	_, err = docRef.Set(ctx, data)
	if err != nil {
		log.Println("Error adding user:", err)
		return err
	}
	return nil
}

func UserCredentialPostLoginHandlerTest(w http.ResponseWriter, r *http.Request) {
	//Decode the JSON body
	var user Firebase.User
	err := API.DecodeJSONBody(w, r, &user)
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
			Value:    "test",                         // Set your authentication token
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
