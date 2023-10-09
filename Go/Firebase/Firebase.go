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
		err = doc.DataTo(&user)
		user.DocumentID = doc.Ref.ID
		if err != nil {
			log.Println("Error converting document:", err)
			return User{}, err
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
	}
	_, err = client.Collection("users").Doc(user.Username).Set(ctx, data)
	if err != nil {
		log.Println("Error patching user:", err)
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

/*****************				GROUP FUNCTIONS				*****************/

func AddGroup(group Group) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}
	//Need to make a slice of members so that Firebase correctly adds the field
	var tmpMemberSlice []string
	tmpMemberSlice = append(tmpMemberSlice, group.Owner)
	//Add group to database
	data := map[string]interface{}{
		"members": tmpMemberSlice,
		"owner":   group.Owner,
		"name":    group.Name,
	}
	doc, _, err := client.Collection("groups").Add(ctx, data)
	if err != nil {
		log.Println("Error adding group:", err)
		return "", err
	}
	return doc.ID, nil
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
	if err != nil {
		log.Println("Error converting document:", err)
		return Group{}, err
	}
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
	}
	_, err = client.Collection("groups").Doc(group.ID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching group:", err)
		return err
	}
	return nil
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

func AddRecipe(recipe Recipe, groups []string, user string) (string, error) {
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
		"picture":      recipe.Picture,
		"description":  recipe.Description,
		"URL":          recipe.URL,
		"ingredients":  recipe.Ingredients,
		"instructions": recipe.Instructions,
		"categories":   recipe.Categories,
		"portions":     recipe.Portions,
		"owner":        user,
		"image":        recipe.Image,
	}

	//Add recipe to recipes
	doc, _, err := client.Collection("recipes").Add(ctx, data)
	if err != nil {
		log.Println("Error adding recipe:", err)
		return "", err
	}

	//Add recipe to user
	_, err = client.Collection("users").Doc(user).Update(ctx, []firestore.Update{
		{Path: "recipes", Value: firestore.ArrayUnion(doc.ID)},
	})

	//Add recipe to groups
	for _, group := range groups {
		_, err := client.Collection("groups").Doc(group).Update(ctx, []firestore.Update{
			{Path: "recipes", Value: firestore.ArrayUnion(doc.ID)},
		})
		if err != nil {
			log.Println("Error adding recipe to group:", err)
			return "", err
		}
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
		"URL":          recipe.URL,
		"ingredients":  recipe.Ingredients,
		"instructions": recipe.Instructions,
		"categories":   recipe.Categories,
		"portions":     recipe.Portions,
	}
	_, err = client.Collection("recipes").Doc(recipe.ID).Set(ctx, data)
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

/*****************				RECIPE FUNCTIONS				*****************/

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
	list.ID = doc.Ref.ID

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
	_, err = client.Collection("shopping-list").Doc(list.ID).Set(ctx, data)
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
