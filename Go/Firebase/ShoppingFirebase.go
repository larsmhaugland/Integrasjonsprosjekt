// Description: This file contains all the functions that are used to 
// interact with the Firebase database for the shopping list.
package Firebase

import (
	"context"
	"log"
	"time"
)

// GetAllShoppingLists returns a slice with ShoppingList structs,
// this slice is all the Shopping lists in the database.
func GetAllShoppingLists() ([]ShoppingList, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return nil, err
	}

	// Declare the slice of ShoppingLists and got through all the documents in the 'shopping-list' collection
	// and add each of them to the ShoppingList slice
	var lists []ShoppingList
	iter := client.Collection("shopping-list").Documents(ctx)
	for {
		var list ShoppingList
		doc, err := iter.Next()
		if err != nil {
			log.Println("Error getting next document:", err)
			break
		}
		err = doc.DataTo(&list)
		list.DocumentID = doc.Ref.ID
		if err != nil {
			log.Println("Error converting document:", err)
			break
		}
		lists = append(lists, list)
	}

	return lists, nil
}

// GetShoppingListData returns a ShoppingList struct, this struct is the Shopping list with the given listID.
func GetShoppingListData(listID string) (ShoppingList, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return ShoppingList{}, err
	}

	// Declare the ShoppingList struct and get the document with the given listID
	var list ShoppingList
	doc, err := client.Collection("shopping-list").Doc(listID).Get(ctx)
	if err != nil {
		log.Println("Error getting shopping list:", err)
		return ShoppingList{}, err
	}

	// Convert the data from the document to the list list struct
	err = doc.DataTo(&list)
	list.DocumentID = doc.Ref.ID

	if err != nil {
		log.Println("Error converting document:", err)
		return ShoppingList{}, err
	}

	return list, nil
}

// AddShoppingList adds a new shopping list to the database and returns the documentID of the new list.
func AddShoppingList(list ShoppingList) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}

	// Initialize the data for the new shopping list
	data := map[string]interface{}{
		"assignees": list.Assignees,
		"list":      list.List,
	}

	// Add shoppinglist to database
	id, _, err := client.Collection("shopping-list").Add(ctx, data)
	if err != nil {
		log.Println("Error adding shopping list:", err)
		return "", err
	}

	// Add the new shopping list to the cache
	ShoppingCache[id.ID] = CacheData{list, time.Now()}
	return id.ID, nil
}

// PatchShoppingList updates the shopping list with the new data from the shopping list sent as a parameter.
func PatchShoppingList(list ShoppingList) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Initialize the data for the updated shopping list
	data := map[string]interface{}{
		"assignees": list.Assignees,
		"list":      list.List,
	}

	// Update the shopping list in the database
	_, err = client.Collection("shopping-list").Doc(list.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching shopping list:", err)
		return err
	}
	return nil
}

// DeleteShoppingList deletes the shopping list with the given listID from the database.
func DeleteShoppingList(listID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Delete the shopping list from the database
	_, err = client.Collection("shopping-list").Doc(listID).Delete(ctx)
	if err != nil {
		log.Println("Error deleting shopping list:", err)
		return err
	}
	return nil
}
