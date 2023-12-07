// Package Firebase includes all the functions necessary for communicating with the
// firestore database. The functions are used by the API package to handle requests from
// the javascript frontend, and then get the correct information from the database and return it to
// the javascript frontend.
package Firebase

import (
	"context"
	"errors"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/option"
)

// CUSTOM ERROR CODES
var ErrUserExists = errors.New("no user found")

// GetFirestoreClient returns an initialized firestore client
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
