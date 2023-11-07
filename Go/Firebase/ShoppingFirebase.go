package Firebase

import (
	"context"
	"log"
	"time"
)

func GetAllShoppingLists() ([]ShoppingList, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return nil, err
	}
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
