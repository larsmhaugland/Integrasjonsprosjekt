package Firebase

import (
	"context"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// GetAllUsers returns a slice with User structs,
// this slice is all the users in the database.
func GetAllUsers() ([]User, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return nil, err
	}

	// Declare the slice of Users and got through all the documents in the 'users' collection
	// and add each of them to the users slice
	var users []User
	iter := client.Collection("users").Documents(ctx)
	for {
		var user User
		doc, err := iter.Next()
		if err != nil {
			log.Println("Error getting next document:", err)
			break
		}
		err = doc.DataTo(&user)
		user.DocumentID = doc.Ref.ID
		if err != nil {
			log.Println("Error converting document:", err)
			break
		}

		if _, ok := doc.Data()["username"].(string); ok {
			user.Username = doc.Data()["username"].(string)
		} else {
			log.Println("Error; Failed to convert username to string")
		}

		if _, ok := doc.Data()["password"].(string); ok {
			user.Password = doc.Data()["password"].(string)
		} else {
			log.Println("Error; Failed to convert password to string")
		}

		if _, ok := doc.Data()["name"].(string); ok {
			user.Name = doc.Data()["name"].(string)
		} else {
			log.Println("Error; Failed to convert name to string")
		}

		//Firebase is stupid and stores arrays as []interface{} so we need to convert them to []string
		if _, ok := doc.Data()["shopping-lists"].([]interface{}); ok {

			tmpShoppingLists := doc.Data()["shopping-lists"].([]interface{})
			for _, v := range tmpShoppingLists {
				if str, ok := v.(string); ok {
					user.ShoppingLists = append(user.ShoppingLists, str)
				} else {
					log.Println("Error; Failed to convert shopping list id to string" + err.Error())
				}
			}
		}
		if _, ok := doc.Data()["recipes"].([]interface{}); ok {
			tmpRecipes := doc.Data()["recipes"].([]interface{})
			for _, v := range tmpRecipes {
				if str, ok := v.(string); ok {
					user.Recipes = append(user.Recipes, str)
				} else {
					log.Println("Error; Failed to convert recipe id to string" + err.Error())
				}
			}
		}
		if _, ok := doc.Data()["chats"].([]interface{}); ok {
			tmpGroupLists := doc.Data()["chats"].([]interface{})
			for _, v := range tmpGroupLists {
				if str, ok := v.(string); ok {
					user.Chats = append(user.Chats, str)
				} else {
					log.Println("Error; Failed to convert chat id to string" + err.Error())
				}
			}
		}
		if _, ok := doc.Data()["groups"].([]interface{}); ok {
			tmpGroupLists := doc.Data()["groups"].([]interface{})
			for _, v := range tmpGroupLists {
				if str, ok := v.(string); ok {
					user.Groups = append(user.Groups, str)
				} else {
					log.Println("Error; Failed to convert group id to string" + err.Error())
				}
			}
		}

		users = append(users, user)
	}
	return users, nil
}

// GetUserData returns a User struct with the data of the user with the given userID.
func GetUserData(userID string) (User, error) {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return User{}, err
	}

	// Declare the user struct and go through the users collection to find the document with the correct user
	var user User
	iter := client.Collection("users").Where("username", "==", userID).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			log.Println("Error; No user found with username: " + userID)
			return User{}, err
		}
		if err != nil {
			log.Println("Error; Failed to iterate")
			return User{}, err
		}

		user.DocumentID = doc.Ref.ID

		if _, ok := doc.Data()["username"].(string); ok {
			user.Username = doc.Data()["username"].(string)
		} else {
			log.Println("Error; Failed to convert username to string")
		}

		if _, ok := doc.Data()["password"].(string); ok {
			user.Password = doc.Data()["password"].(string)
		} else {
			log.Println("Error; Failed to convert password to string")
		}

		if _, ok := doc.Data()["name"].(string); ok {
			user.Name = doc.Data()["name"].(string)
		} else {
			log.Println("Error; Failed to convert name to string")
		}

		//Firebase stores arrays as []interface{} so we need to convert them to []string
		if _, ok := doc.Data()["shopping-lists"].([]interface{}); ok {

			tmpShoppingLists := doc.Data()["shopping-lists"].([]interface{})
			for _, v := range tmpShoppingLists {
				if str, ok := v.(string); ok {
					user.ShoppingLists = append(user.ShoppingLists, str)
				} else {
					log.Println("Error; Failed to convert shopping list id to string" + err.Error())
				}
			}
		}
		if _, ok := doc.Data()["recipes"].([]interface{}); ok {
			tmpRecipes := doc.Data()["recipes"].([]interface{})
			for _, v := range tmpRecipes {
				if str, ok := v.(string); ok {
					user.Recipes = append(user.Recipes, str)
				} else {
					log.Println("Error; Failed to convert recipe id to string" + err.Error())
				}
			}
		}
		if _, ok := doc.Data()["chats"].([]interface{}); ok {
			tmpGroupLists := doc.Data()["chats"].([]interface{})
			for _, v := range tmpGroupLists {
				if str, ok := v.(string); ok {
					user.Chats = append(user.Chats, str)
				} else {
					log.Println("Error; Failed to convert chat id to string" + err.Error())
				}
			}
		}
		if _, ok := doc.Data()["groups"].([]interface{}); ok {
			tmpGroupLists := doc.Data()["groups"].([]interface{})
			for _, v := range tmpGroupLists {
				if str, ok := v.(string); ok {
					user.Groups = append(user.Groups, str)
				} else {
					log.Println("Error; Failed to convert group id to string" + err.Error())
				}
			}
		}

		return user, nil
	}
}

// AddUser adds a user to the database.
func AddUser(user User) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
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
		return ErrUserExists
	}

	//Add user to database
	data := map[string]interface{}{
		"username": user.Username,
		"password": user.Password,
		"name":     user.Name,
	}
	_, _, err = client.Collection("users").Add(ctx, data)
	if err != nil {
		log.Println("Error adding user:", err)
		return err
	}
	return nil
}

// DeleteUser deletes the user with the given userID from the database.
func DeleteUser(userID string) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Delete the document with the user to be deleted
	_, err = client.Collection("users").Doc(userID).Delete(ctx)
	if err != nil {
		log.Println("Error deleting user:", err)
		return err
	}
	return nil
}

// PatchUser updates the user in the database, with the given userID, with the new data.
func PatchUser(user User) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Set the data for the updated user document
	data := map[string]interface{}{
		"username":       user.Username,
		"password":       user.Password,
		"shopping-lists": user.ShoppingLists,
		"recipes":        user.Recipes,
		"groups":         user.Groups,
		"name":           user.Name,
		"chats":          user.Chats,
	}

	// Update the document with the new data
	_, err = client.Collection("users").Doc(user.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching user:", err)
		return err
	}
	return nil
}

// GetUsersFromPartialName returns a slice with usernames that contains the given partialUsername.
func GetUsernamesFromPartialName(partialUsername string) ([]string, error) {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return nil, err
	}

	var results []string

	// Get the documents where the partialUsername is found in the username field.
	// Using Where twice is like using && in if statemnets
	collection := client.Collection("users")
	query := collection.Where("username", ">=", partialUsername).
		Where("username", "<", partialUsername+"\uf8ff")

	// Get the iterator for the query and go through all the documents in the users collection
	iter := query.Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Println("Error querying Firestore:", err)
			return nil, err
		}
		results = append(results, doc.Data()["username"].(string))
	}
	return results, nil
}

// AddChatToUser adds the given chatID to the user with the given username.
func AddChatToUser(username string, chatID string) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Get the userdata from cache/database
	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}

	// Create a new slice if there is not already one
	if userData.Chats == nil {
		userData.Chats = make([]string, 0)
	}
	userData.Chats = append(userData.Chats, chatID)

	// Add the new group to the users groups field
	_, err = client.Collection("users").Doc(userData.DocumentID).Update(ctx, []firestore.Update{
		{Path: "chats", Value: userData.Chats},
	})
	if err != nil {
		log.Println("error updating user document:", err)
		return err
	}

	// Update the cache with the modified user data
	UserCache[username] = CacheData{userData, time.Now()}
	return nil
}

// AddChatTogroup creates the group chat for the newly created group.
func AddChatToGroup(groupID string, chatID string) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Get the groupdata from cache/database
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}

	// Add the chat to the groups chat field
	_, err = client.Collection("groups").Doc(groupData.DocumentID).Update(ctx, []firestore.Update{
		{Path: "chat", Value: groupData.Chat},
	})
	if err != nil {
		log.Println("error updating user document:", err)
		return err
	}

	groupData.Chat = chatID
	// Update the cache with the modified user data
	GroupCache[groupID] = CacheData{groupData, time.Now()}

	return nil
}

// GetUserChats returns a slice with Chat structs,
// this slice is all the chats the user with the given username is part of.
func GetUserChats(username string) ([]Chat, error) {

	// Get the userdata for the specified user from cache/database
	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return nil, err
	}

	// create array to hold the data for the chats
	chats := make([]Chat, 0)

	// Add all the chats the user is part of to the array
	for _, chatID := range userData.Chats {
		// Get the chat data for the current chat from cache/database
		chatData, err := ReturnCacheChat(chatID)
		if err != nil {
			log.Println("error getting chat data from cache:", err)
			return nil, err
		}
		chats = append(chats, chatData)
	}

	return chats, nil
}

// RemoveChatFromMember removes the given chatID from the user with the given username.
func RemoveChatFromMember(username string, chatID string) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Get the userdata for the specified user from cache/database
	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}

	// Slice to hold the updated chats
	updatedChats := make([]string, 0)

	// Add all the chats the user is part of to the slice, except the one to be removed
	for _, currentChatID := range userData.Chats {
		if currentChatID != chatID {
			updatedChats = append(updatedChats, currentChatID)
		}
	}

	// Update the users chats field with the new slice
	_, err = client.Collection("users").Doc(userData.DocumentID).Update(ctx, []firestore.Update{
		{Path: "chats", Value: updatedChats},
	})
	if err != nil {
		log.Println("error updating user document:", err)
		return err
	}

	userData.Chats = updatedChats

	// Update the cache for the user with the new data
	UserCache[username] = CacheData{userData, time.Now()}

	return nil
}
