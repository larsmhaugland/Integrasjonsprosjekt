package Firebase

import (
	"context"
	"errors"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

// CUSTOM ERROR CODES
var ErrUserExists = errors.New("No user found")

func GetFirestoreClient(ctx context.Context) (*firestore.Client, error) {

	//Check if service account file exists
	_, err := os.ReadFile("Firebase/service-account.json")
	if err != nil {
		log.Println("error reading service-account.json:", err)
		return nil, err
	}
	opt := option.WithCredentialsFile("Firebase/service-account.json")

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Printf("error initializing app: %v", err)
		return nil, err
	}
	client, err := app.Firestore(ctx)
	if err != nil {
		log.Printf("error initializing Firestore client: %v", err)
		return nil, err
	}

	return client, nil
}

/*****************				USER FUNCTIONS				*****************/

func GetUserData(userID string) (User, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return User{}, err
	}
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

		return user, nil
	}
}

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
	}
	_, _, err = client.Collection("users").Add(ctx, data)
	if err != nil {
		log.Println("Error adding user:", err)
		return err
	}
	return nil
}

func DeleteUser(userID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	_, err = client.Collection("users").Doc(userID).Delete(ctx)
	if err != nil {
		log.Println("Error deleting user:", err)
		return err
	}
	return nil
}

func PatchUser(user User) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	data := map[string]interface{}{
		"username":       user.Username,
		"password":       user.Password,
		"shopping-lists": user.ShoppingLists,
		"recipes":        user.Recipes,
		"groups":         user.Groups,
		"name":           user.Name,
		"chats":          user.Chats,
	}
	_, err = client.Collection("users").Doc(user.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching user:", err)
		return err
	}
	return nil
}

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

func AddChatToUser(username string, chatID string) error {
	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

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

func AddChatToGroup(groupID string, chatID string) error {
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Add the new group to the users groups field
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

func GetUserChats(username string) ([]Chat, error) {
	// Get the userdata with the chat ID's
	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return nil, err
	}
	// create array to hold the data for the chats
	chats := make([]Chat, 0)
	// Add all the chats the user is part of to the array
	for _, chatID := range userData.Chats {
		log.Println("chatID: ", chatID)
		chatData, err := ReturnCacheChat(chatID)
		if err != nil {
			log.Println("error getting chat data from cache:", err)
			return nil, err
		}
		chats = append(chats, chatData)
	}

	return chats, nil
}

func RemoveChatFromMember(username string, chatID string) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}

	updatedChats := make([]string, 0)

	for _, currentChatID := range userData.Chats {
		if currentChatID != chatID {
			updatedChats = append(updatedChats, currentChatID)
		}
	}

	_, err = client.Collection("users").Doc(userData.DocumentID).Update(ctx, []firestore.Update{
		{Path: "chats", Value: updatedChats},
	})
	if err != nil {
		log.Println("error updating user document:", err)
		return err
	}

	userData.Chats = updatedChats

	UserCache[username] = CacheData{userData, time.Now()}

	return nil
}

/*****************				GROUP FUNCTIONS				*****************/

func AddGroup(group Group, chatID string) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}
	docRef := client.Collection("groups").Doc(group.DocumentID)
	//Need to make a slice of members so that Firebase correctly adds the field
	var tmpMemberSlice []string
	tmpMemberSlice = append(tmpMemberSlice, group.Owner)

	members := map[string]string{
		group.Owner: "owner",
	}
	for key := range group.Members {
		if key != group.Owner {
			members[key] = "member"
		}
	}
	//Add group to database
	_, err = docRef.Set(ctx, map[string]interface{}{
		"members": members,
		"owner":   group.Owner,
		"name":    group.Name,
		"chat":    chatID,
	})
	//doc, _, err := client.Collection("groups").Add(ctx, data)
	if err != nil {
		log.Println("Error adding group:", err)
		return "", err
	}

	log.Println("documentID on groupCreation: ", group.DocumentID)
	return group.DocumentID, nil
}

func GetGroupData(groupID string) (Group, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Group{}, err
	}
	var group Group
	doc, err := client.Collection("groups").Doc(groupID).Get(ctx)
	if err != nil {
		log.Println("Error getting group:", err)
		return Group{}, err
	}

	err = doc.DataTo(&group)
	group.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting document:", err)
		return Group{}, err
	}

	//Firebase is stupid and stores arrays as []interface{} so we need to convert them to []string x2
	if _, ok := doc.Data()["shopping-lists"].([]interface{}); ok {
		tmpShoppingLists := doc.Data()["shopping-lists"].([]interface{})
		for _, v := range tmpShoppingLists {
			if str, ok := v.(string); ok {
				group.ShoppingLists = append(group.ShoppingLists, str)
			} else {
				log.Println("Error; Failed to convert shopping list id to string:", err)

			}
		}
	}

	if _, ok := doc.Data()["members"].(map[string]interface{}); ok {
		tmpMembers := doc.Data()["members"].(map[string]interface{})
		group.Members = make(map[string]string, len(tmpMembers))
		for key, value := range tmpMembers {
			if str, ok := value.(string); ok {
				group.Members[key] = str
			} else {
				log.Println("Error; Failed to convert member id to string:", err)
			}
		}
	}
	//TODO: group recipes also need to be converted to []string
	return group, nil
}

func PatchGroup(group Group) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	data := map[string]interface{}{
		"members":        group.Members,
		"owner":          group.Owner,
		"name":           group.Name,
		"recipes":        group.Recipes,
		"schedule":       group.Schedule,
		"shopping-lists": group.ShoppingLists,
		"chat":           group.Chat,
	}
	_, err = client.Collection("groups").Doc(group.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching group:", err)
		return err
	}
	return nil
}

func GetGroupName(groupID string) (string, error) {
	// Get the group data from cache (check ReturnCacheGroup documentation)
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return "", err
	}
	return groupData.Name, nil
}

func GetGroupMembers(groupID string) ([]GroupMemberNameRole, error) {
	// Get the group data from cache (check ReturnCacheGroup documentation)
	group, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return nil, err
	}

	// Get the members usernames and roles from the group data
	members := group.Members

	// Create a slice to store the group members names and roles
	var groupMembersNameRole []GroupMemberNameRole

	// Populate the slice with member usernames and roles
	for username, roleName := range members {
		groupMembersNameRole = append(groupMembersNameRole, GroupMemberNameRole{
			Username: username,
			Rolename: roleName,
		})
	}

	return groupMembersNameRole, nil
}

func DeleteMemberFromGroup(groupID string, username string) error {

	// Get the group data from cache (check ReturnCacheGroup documentation)
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return err
	}

	// Remove the user from the groups members list, by adding all other user to a new variable
	updatedMembers := make(map[string]string)
	for key, value := range groupData.Members {
		if key != username {
			updatedMembers[key] = value
		}
	}

	// Update the group data with the modified members list
	groupData.Members = updatedMembers

	// Update the cache with the modified group data
	GroupCache[groupID] = CacheData{groupData, time.Now()}

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Update the Firestore document with the modified members list
	_, err = client.Collection("groups").Doc(groupID).Update(ctx, []firestore.Update{
		{Path: "members", Value: updatedMembers},
	})
	if err != nil {
		log.Println("error updating group document:", err)
		return err
	}

	// Same process, but for the user document instead
	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}

	// Remove the groupID from the users groups list
	updatedGroups := make([]string, 0)
	for _, group := range userData.Groups {
		if group != groupID {
			updatedGroups = append(updatedGroups, group)
		}
	}

	// Update the user data with the modified groups list
	userData.Groups = updatedGroups

	// Update the cache with the modified user data
	UserCache[username] = CacheData{userData, time.Now()}

	// Update the Firestore document with the modified groups list
	_, err = client.Collection("users").Doc(userData.DocumentID).Update(ctx, []firestore.Update{
		{Path: "groups", Value: updatedGroups},
	})
	if err != nil {
		log.Println("error updating user document:", err)
		return err
	}

	return nil
}

func DeleteGroup(groupID string) error {
	// Check if the group data exists in the cache
	_, ok := GroupCache[groupID]
	if ok {
		// If it is in the cache remove it
		delete(GroupCache, groupID)
	}

	// Update the Firestore document with the modified groups list
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Reference to the specific document
	groupRef := client.Collection("groups").Doc(groupID)

	// Delete the document
	_, err = groupRef.Delete(ctx)
	if err != nil {
		log.Println("Error deleting group document:", err)
		return err
	}

	return nil
}

func UpdateMemberRole(username string, newRole string, groupID string) error {
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return err
	}

	groupData.Members[username] = newRole

	// Update the Firestore document with the modified groups list
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	memberToUpdate := "members." + username
	// Update the role for the user in the specified group using Firestore
	_, err = client.Collection("groups").Doc(groupID).Update(ctx, []firestore.Update{
		{Path: memberToUpdate, Value: newRole},
	})
	if err != nil {
		log.Println("error updating user role in group:", err)
		return err
	}

	GroupCache[groupID] = CacheData{groupData, time.Now()}

	return nil
}

/*****************				RECIPE FUNCTIONS				*****************/

func AddRecipe(recipe Recipe) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}
	//Add recipe to database
	data := map[string]interface{}{
		"name":         recipe.Name,
		"time":         recipe.Time,
		"image":        recipe.Image,
		"description":  recipe.Description,
		"difficulty":   recipe.Difficulty,
		"URL":          recipe.URL,
		"ingredients":  recipe.Ingredients,
		"instructions": recipe.Instructions,
		"categories":   recipe.Categories,
		"portions":     recipe.Portions,
	}

	//Add recipe to recipes
	doc, _, err := client.Collection("recipes").Add(ctx, data)
	if err != nil {
		log.Println("Error adding recipe:", err)
		return "", err
	}

	return doc.ID, nil
}

func GetRecipeData(recipeID string) (Recipe, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Recipe{}, err
	}
	var recipe Recipe
	doc, err := client.Collection("recipes").Doc(recipeID).Get(ctx)
	if err != nil {
		log.Println("Error getting recipe:", err)
		return Recipe{}, err
	}
	err = doc.DataTo(&recipe)
	recipe.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting document:", err)
		return Recipe{}, err
	}
	return recipe, nil
}

func PatchRecipe(recipe Recipe) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	data := map[string]interface{}{
		"name":         recipe.Name,
		"time":         recipe.Time,
		"image":        recipe.Image,
		"description":  recipe.Description,
		"difficulty":   recipe.Difficulty,
		"URL":          recipe.URL,
		"ingredients":  recipe.Ingredients,
		"instructions": recipe.Instructions,
		"categories":   recipe.Categories,
		"portions":     recipe.Portions,
	}
	_, err = client.Collection("recipes").Doc(recipe.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching recipe:", err)
		return err
	}
	return nil
}

func DeleteRecipe(recipeID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	_, err = client.Collection("recipes").Doc(recipeID).Delete(ctx)
	if err != nil {
		log.Println("Error deleting recipe:", err)
		return err
	}
	return nil
}

/*****************				SHOPPING LIST FUNCTIONS				*****************/

func GetShoppingListData(listID string) (ShoppingList, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return ShoppingList{}, err
	}
	var list ShoppingList
	doc, err := client.Collection("shopping-list").Doc(listID).Get(ctx)
	if err != nil {
		log.Println("Error getting shopping list:", err)
		return ShoppingList{}, err
	}
	err = doc.DataTo(&list)
	list.DocumentID = doc.Ref.ID

	if err != nil {
		log.Println("Error converting document:", err)
		return ShoppingList{}, err
	}
	return list, nil
}

func AddShoppingList(list ShoppingList) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}
	data := map[string]interface{}{
		"assignees": list.Assignees,
		"list":      list.List,
	}
	//Add shoppinglist to database
	id, _, err := client.Collection("shopping-list").Add(ctx, data)
	if err != nil {
		log.Println("Error adding shopping list:", err)
		return "", err
	}
	ShoppingCache[id.ID] = CacheData{list, time.Now()}
	return id.ID, nil
}

func PatchShoppingList(list ShoppingList) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	data := map[string]interface{}{
		"assignees": list.Assignees,
		"list":      list.List,
	}
	_, err = client.Collection("shopping-list").Doc(list.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching shopping list:", err)
		return err
	}
	return nil
}

func DeleteShoppingList(listID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	_, err = client.Collection("shopping-list").Doc(listID).Delete(ctx)
	if err != nil {
		log.Println("Error deleting shopping list:", err)
		return err
	}
	return nil
}

/*****************				Chat Functions				*****************/

func GetChatData(chatID string) (Chat, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Chat{}, err
	}

	var chat Chat
	doc, err := client.Collection("chat").Doc(chatID).Get(ctx)
	if err != nil {
		log.Println("Error getting chat document", err)
		return Chat{}, err
	}

	err = doc.DataTo(&chat)
	chat.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting firebase document to chat struct", err)
		return Chat{}, err
	}

	return chat, nil
}

func AddMessageToChat(message Message, chatID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)

	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}
	// In case there are no messages already in the chat
	if chatData.Messages == nil {
		chatData.Messages = append(make([]Message, 0), message)
	} else {
		chatData.Messages = append(chatData.Messages, message)
	}

	ChatCache[chatID] = CacheData{chatData, time.Now()}

	chatDocRef := client.Collection("chat").Doc(chatID)

	_, err = chatDocRef.Update(ctx, []firestore.Update{
		{Path: "messages", Value: chatData.Messages},
	})

	if err != nil {
		log.Println("error updating chat document with new message", err)
		return err
	}

	return nil

}

// Adds a new chat document to the firestore chat collection
// parameters chat: the chat struct to be added to the database
// parameters newGroup: bool to check if chat is created because a new group was created on the homepage
func AddNewChat(chat Chat) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}
	docRefNewChat := client.Collection("chat").Doc(chat.DocumentID)

	_, err = docRefNewChat.Set(ctx, map[string]interface{}{
		"members":   chat.Members,
		"chatOwner": chat.ChatOwner,
		"name":      chat.Name,
	})
	if err != nil {
		log.Println("error adding new chat document to the firestore database", err)
		return err
	}

	for _, member := range chat.Members {
		err = AddChatToUser(member, chat.DocumentID)
		if err != nil {
			log.Println("error adding chat to user", err)
			return err
		}
	}
	// Pretty sure this line is not needed as they should be the same
	chat.DocumentID = docRefNewChat.ID

	ChatCache[chat.DocumentID] = CacheData{chat, time.Now()}

	return nil
}

func RemoveMemberFromChat(chatID string, username string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}

	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}

	currentMembers := make([]string, 0)

	for _, memberName := range chatData.Members {
		if memberName != username {
			currentMembers = append(currentMembers, memberName)
		}
	}

	chatData.Members = currentMembers

	_, err = client.Collection("chat").Doc(chatID).Update(ctx, []firestore.Update{
		{Path: "members", Value: currentMembers},
	})
	if err != nil {
		log.Println("error updating chat document with members after removal", err)
		return err
	}

	RemoveChatFromMember(username, chatID)

	ChatCache[chatData.DocumentID] = CacheData{chatData, time.Now()}

	return nil
}

func AddMemberToChat(chatID string, username string) ([]string, error) {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return nil, err
	}

	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return nil, err
	}

	chatData.Members = append(chatData.Members, username)

	_, err = client.Collection("chat").Doc(chatID).Update(ctx, []firestore.Update{
		{Path: "members", Value: chatData.Members},
	})
	if err != nil {
		log.Println("error updating chat document with members after removal", err)
		return nil, err
	}

	AddChatToUser(username, chatID)

	ChatCache[chatData.DocumentID] = CacheData{chatData, time.Now()}

	return chatData.Members, nil
}

func DeleteChat(chatID string) error {

	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}

	// Check if the chat data exists in the cache
	_, ok := ChatCache[chatID]
	if ok {
		// If it is in the cache remove it
		delete(ChatCache, chatID)
	} else {
		log.Println("error getting chat data from cache:")
	}

	// Update the Firestore document with the modified groups list
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}

	// Reference to the specific document
	chatRef := client.Collection("chat").Doc(chatID)

	// Delete the document
	_, err = chatRef.Delete(ctx)
	if err != nil {
		log.Println("Error deleting chat document:", err)
		return err
	}

	for _, member := range chatData.Members {
		err = RemoveChatFromMember(member, chatID)
		if err != nil {
			log.Println("error removing chat from user", err)
			return err
		}
	}

	return nil
}

func GetGroupChat(groupID string) (Chat, error) {
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return Chat{}, err
	}

	chatData, err := ReturnCacheChat(groupData.Chat)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return Chat{}, err
	}

	return chatData, nil
}

/*****************				TODOS				*****************/

// TODO: THis function and the one underneath are extremly similair and should be made into one
func AddUserToGroup(username string, groupID string) error {
	// Get the group data from cache (check ReturnCacheGroup documentation)
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return err
	}
	// Modify the group's members list
	groupData.Members[username] = "member"

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	_, err = client.Collection("groups").Doc(groupID).Update(ctx, []firestore.Update{
		{Path: "members", Value: groupData.Members},
	})
	if err != nil {
		log.Println("error updating group document:", err)
		return err
	}

	// Update the cache with the modified group data
	GroupCache[groupID] = CacheData{groupData, time.Now()}

	return nil

}

// TODO: THis function and the one above are extremly similair and should be made into one
func AddGroupToUser(username string, groupID string) error {
	// Get the user data from cache (check ReturnCacheUser documentation)
	userData, err := ReturnCacheUser(username)
	if err != nil {
		log.Println("error getting user data from cache:", err)
		return err
	}
	// Add the new group to the user's groups list
	userData.Groups = append(userData.Groups, groupID)

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	// Add the new group to the users groups field
	_, err = client.Collection("users").Doc(userData.DocumentID).Update(ctx, []firestore.Update{
		{Path: "groups", Value: userData.Groups},
	})
	if err != nil {
		log.Println("error updating user document:", err)
		return err
	}

	// Update the cache with the modified user data
	UserCache[username] = CacheData{userData, time.Now()}

	return nil
}
