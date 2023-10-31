package Firebase

import (
	"cloud.google.com/go/firestore"
	"context"
	"log"
	"time"
)

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
