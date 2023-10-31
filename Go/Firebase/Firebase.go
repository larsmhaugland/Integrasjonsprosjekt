package Firebase

import (
	"context"
	"errors"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
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
