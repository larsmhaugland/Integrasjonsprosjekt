package Firebase

import (
	"context"
	"log"
	"time"

	"cloud.google.com/go/firestore"
)

// GetAllGroups returns a slice of all the groups in the firestore database
func GetAllGroups() ([]Group, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return nil, err
	}

	// Go through all the groups in the firestore document and add them to a slice of group structs
	var groups []Group
	iter := client.Collection("groups").Documents(ctx)
	for {
		var group Group
		doc, err := iter.Next()
		if err != nil {
			log.Println("Error getting next document:", err)
			break
		}
		err = doc.DataTo(&group)
		group.DocumentID = doc.Ref.ID
		if err != nil {
			log.Println("Error converting document:", err)
			break
		}
		groups = append(groups, group)
	}
	return groups, nil
}

// AddGroup adds a new group to the firestore database and gives the document
// the unique ID which is the chatID sent as a parameter and returns the firestore document ID.
func AddGroup(group Group, chatID string) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}

	// Create a reference to the document
	docRef := client.Collection("groups").Doc(group.DocumentID)

	// Set the first element in the members map to be the owner
	members := map[string]string{
		group.Owner: "owner",
	}
	// Set the rest of the members to be members by adding the username as key and "member" as value
	for key := range group.Members {
		if key != group.Owner {
			members[key] = "member"
		}
	}

	// Set the data for the new group document
	_, err = docRef.Set(ctx, map[string]interface{}{
		"members": members,
		"owner":   group.Owner,
		"name":    group.Name,
		"chat":    chatID,
		"image":   group.Image,
	})
	if err != nil {
		log.Println("Error adding group:", err)
		return "", err
	}

	log.Println("documentID on groupCreation: ", group.DocumentID)
	// Return the groups documentID
	return group.DocumentID, nil
}

// GetGroupData returns the group data from the firestore database with the specified groupID
func GetGroupData(groupID string) (Group, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Group{}, err
	}

	// Get the data from the document with the specified groupID from firestore
	var group Group
	doc, err := client.Collection("groups").Doc(groupID).Get(ctx)
	if err != nil {
		log.Println("Error getting group:", err)
		return Group{}, err
	}

	// Convert the data from the document to a Group struct
	err = doc.DataTo(&group)
	group.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting document:", err)
		return Group{}, err
	}

	//Firebase stores arrays as []interface{} so we need to convert them to []string x2
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

// PatchGroup updates the group data in the firestore database with the specified groupID
func PatchGroup(group Group) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Set the data members of the group that potentially needs to be updated
	data := map[string]interface{}{
		"members":        group.Members,
		"owner":          group.Owner,
		"name":           group.Name,
		"recipes":        group.Recipes,
		"schedule":       group.Schedule,
		"shopping-lists": group.ShoppingLists,
		"chat":           group.Chat,
		"image":          group.Image,
	}

	// Update the group document with the new data
	_, err = client.Collection("groups").Doc(group.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching group:", err)
		return err
	}
	return nil
}

// GetGroupName returns the name of the group with the specified groupID
func GetGroupName(groupID string) (string, error) {
	// Get the group data from cache/database
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return "", err
	}
	return groupData.Name, nil
}

// GetGroupMembers returns a slice of the group members with each entry having a
// username and a role
func GetGroupMembers(groupID string) ([]GroupMemberNameRole, error) {
	// Get the group data from cache/database
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

// DeleteMemberFromGroup removes the specified user from the specified group
func DeleteMemberFromGroup(groupID string, username string) error {

	// Get the group data from cache/database
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return err
	}

	// Get the user data from cache/database
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

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	// Update the Firestore document with the modified groups list
	_, err = client.Collection("users").Doc(userData.DocumentID).Update(ctx, []firestore.Update{
		{Path: "groups", Value: updatedGroups},
	})
	if err != nil {
		log.Println("error updating user document:", err)
		return err
	}

	//If the owner is the one that is removed, as well as the only member, delete the group
	if len(groupData.Members) == 1 && groupData.Owner == username {
		err = DeleteGroup(groupID)
		if err != nil {
			log.Println("error deleting group:", err)
			return err
		}
		return nil
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

	// Update the Firestore document with the modified members list
	_, err = client.Collection("groups").Doc(groupID).Update(ctx, []firestore.Update{
		{Path: "members", Value: updatedMembers},
	})
	if err != nil {
		log.Println("error updating group document:", err)
		return err
	}

	return nil
}

// DeleteGroup deletes the group with the specified groupID
func DeleteGroup(groupID string) error {

	// Check if the group data exists in the cache
	_, ok := GroupCache[groupID]
	if ok {
		// If it is in the cache remove it
		delete(GroupCache, groupID)
	}

	// Get the firebase context and client
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Get the group data from cache/database
	group, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
	}

	// Delete the chat from cache/database
	err = DeleteCacheChat(group.Chat)
	if err != nil {
		log.Println("error deleting chat from cache:", err)
	}

	// Reference to the specific group document
	groupRef := client.Collection("groups").Doc(groupID)

	// Delete the document
	_, err = groupRef.Delete(ctx)
	if err != nil {
		log.Println("Error deleting group document:", err)
		return err
	}

	return nil
}

// UpdateMemberRole updates the specified users role in the specified group with the newRole
func UpdateMemberRole(username string, newRole string, groupID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	//Get group data from cache/database
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return err
	}

	// Update the role for the user
	groupData.Members[username] = newRole

	memberToUpdate := "members." + username
	// Update the role for the user in the specified group in the firestore document
	_, err = client.Collection("groups").Doc(groupID).Update(ctx, []firestore.Update{
		{Path: memberToUpdate, Value: newRole},
	})
	if err != nil {
		log.Println("error updating user role in group:", err)
		return err
	}

	// Update the group cache with the new data
	GroupCache[groupID] = CacheData{groupData, time.Now()}

	return nil
}
