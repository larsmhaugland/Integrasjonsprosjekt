package Firebase

import (
	"cloud.google.com/go/firestore"
	"context"
	"errors"
	firebase "firebase.google.com/go"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"log"
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
