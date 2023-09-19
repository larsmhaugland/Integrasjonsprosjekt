package Firebase

import (
	"cloud.google.com/go/firestore"
	"context"
	firebase "firebase.google.com/go"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"log"
)

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
