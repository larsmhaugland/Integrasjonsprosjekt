package Firebase

import (
	"context"
	"errors"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

// CUSTOM ERROR CODES
var ErrUserExists = errors.New("No user found")

func GetFirestoreClient(ctx context.Context) (*firestore.Client, error) {
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
			log.Println("Error; No user found")
			return User{}, err
		}
		if err != nil {
			log.Println("Error; Failed to iterate")
			return User{}, err
		}
		err = doc.DataTo(&user)
		if err != nil {
			log.Println("Error converting document:", err)
			return User{}, err
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
	_, err = client.Collection("recipes").Doc(recipe.ID).Set(ctx, recipe)
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
	iter := client.Collection("users").
		Where("username", ">=", partialUsername).
		Where("username", "<", partialUsername+"\uf8ff").Documents(ctx)

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

// TODO: THis function and the one underneath are extremly similair and should be made into one
func AddUserToGroup (username string, groupName string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	// Query Firestore to find the group document with the matching "name" field
    groupRef, err := client.Collection("groups").
        Where("name", "==", groupName).
        Documents(ctx).
        Next()
    if err != nil {
        log.Println("error getting group document:", err)
        return err
    }

	 // Get the current members list from the document data
	 var currentMembers []string
	 if members, exists := groupRef.Data()["members"]; exists {
		 currentMembers = members.([]string)
	 }

	 // Add the new username to the members list
	 currentMembers = append(currentMembers, username)

	 // Update the Firestore document with the modified members list
	 _, err = client.Collection("groups").Doc(groupRef.Ref.ID).Update(ctx, []firestore.Update{
        {Path: "members", Value: currentMembers},
    })
    if err != nil {
        log.Println("error updating group document:", err)
        return err
    }

	return nil
}

// TODO: THis function and the one above are extremly similair and should be made into one
func AddGroupToUser(username string, groupName string) error {
    ctx := context.Background()
    client, err := GetFirestoreClient(ctx)
    if err != nil {
        log.Println("error getting Firebase client:", err)
        return err
    }

    // Get the user document by username
    userRef, err := client.Collection("users").
        Where("name", "==", username).
        Documents(ctx).
        Next()
    if err != nil {
        log.Println("error getting group document:", err)
        return err
    }

    // Extract the current groups list from the document data
    var currentGroups []string
    if groups, exists := userRef.Data()["groups"]; exists {
        currentGroups = groups.([]string)
    }

    // Add the new groupName to the groups list
    currentGroups = append(currentGroups, groupName)

    // Update the Firestore document with the modified groups list
    _, err = client.Collection("users").Doc(userRef.Ref.ID).Update(ctx, []firestore.Update{
        {Path: "groups", Value: currentGroups},
    })
    if err != nil {
        log.Println("error updating user document:", err)
        return err
    }

    return nil
}

func GetGroupMembers (groupID string) ([]GroupMemberNameRole, error)  {
	ctx := context.Background()
    client, err := GetFirestoreClient(ctx)
    if err != nil {
        log.Println("error getting Firebase client:", err)
        return nil, err
    }

	// Find the group document by matching groupID with the name field
    groupDoc, err := client.Collection("groups").
        Where("name", "==", groupID).
        Documents(ctx).
        Next()
    if err != nil {
        log.Println("error finding group document:", err)
        return nil, err
    }

	// Extract the members names from the group document
    var members []string
    if membersData, exists := groupDoc.Data()["members"]; exists {
        members = membersData.([]string)
    }

	// Add the members to the slice of group members that will be returned
	var groupMembersNameRole []GroupMemberNameRole
    for _, memberName := range members {
        // TODO: add the role as a field in the groups collection so it is not hardcoded
        groupMembersNameRole = append(groupMembersNameRole, GroupMemberNameRole{
            Username: memberName,
            Rolename: "Member",
        })
    }

    return groupMembersNameRole, nil
}
