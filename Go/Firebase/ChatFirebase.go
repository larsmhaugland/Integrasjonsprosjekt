package Firebase

import (
	"context"
	"log"
	"time"

	"cloud.google.com/go/firestore"
)

func GetAllChats() ([]Chat, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return nil, err
	}

	iter := client.Collection("chat").Documents(ctx)
	defer iter.Stop()

	var chats []Chat
	for {
		var chat Chat
		doc, err := iter.Next()
		if err != nil {
			break
		}
		err = doc.DataTo(&chat)
		chat.DocumentID = doc.Ref.ID
		if err != nil {
			log.Println("Error converting firebase document to chat struct", err)
			return nil, err
		}
		chats = append(chats, chat)
	}

	return chats, nil
}

// PatchChat updates the chat data in the firestore database with the specified chatID
func PatchChat(chat Chat) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Set the data members of the chat that potentially need to be updated
	data := map[string]interface{}{
		"name":      chat.Name,
		"messages":  chat.Messages,
		"members":   chat.Members,
		"chatOwner": chat.ChatOwner,
	}

	// Update the chat document with the new data
	_, err = client.Collection("chat").Doc(chat.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching chat:", err)
		return err
	}
	return nil
}

// GetChatData returns the chat data from the firestore database for the chat with the specified chatID
func GetChatData(chatID string) (Chat, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Chat{}, err
	}

	// Declare the chat struct and get the document from the database
	var chat Chat
	doc, err := client.Collection("chat").Doc(chatID).Get(ctx)
	if err != nil {
		log.Println("Error getting chat document", err)
		return Chat{}, err
	}

	// Initialize the chat struct with the data from the database
	err = doc.DataTo(&chat)
	chat.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting firebase document to chat struct", err)
		return Chat{}, err
	}

	return chat, nil
}

// AddMessageToChat adds a new message to the chat in firestore database
// with the specified chatID.
func AddMessageToChat(message Message, chatID string) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Get the chat data from the cache/database
	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}

	// Create the array if there are no messages already, otherwise append the new message
	if chatData.Messages == nil {
		chatData.Messages = append(make([]Message, 0), message)
	} else {
		chatData.Messages = append(chatData.Messages, message)
	}

	// Update the cache with the modified chat data
	ChatCache[chatID] = CacheData{chatData, time.Now()}

	chatDocRef := client.Collection("chat").Doc(chatID)

	// Update the firestore documents messages path with the new data
	_, err = chatDocRef.Update(ctx, []firestore.Update{
		{Path: "messages", Value: chatData.Messages},
	})
	if err != nil {
		log.Println("error updating chat document with new message", err)
		return err
	}

	return nil
}

// AddNewChat Adds a new chat document to the firestore chat collection
func AddNewChat(chat Chat) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}

	// Get the reference to the new chat document added to the firestore database
	docRefNewChat := client.Collection("chat").Doc(chat.DocumentID)

	// Set the data for the new chat document
	_, err = docRefNewChat.Set(ctx, map[string]interface{}{
		"members":   chat.Members,
		"chatOwner": chat.ChatOwner,
		"name":      chat.Name,
	})
	if err != nil {
		log.Println("error adding new chat document to the firestore database", err)
		return err
	}

	// For each member in the chat add the chat to their chats list
	for _, member := range chat.Members {
		err = AddChatToUser(member, chat.DocumentID)
		if err != nil {
			log.Println("error adding chat to user", err)
			return err
		}
	}

	chat.DocumentID = docRefNewChat.ID

	// Update the cache with the new chat data
	ChatCache[chat.DocumentID] = CacheData{chat, time.Now()}

	return nil
}

// RemoveMemberFromChat removes the member with the specified username from the chat with the specified chatID
func RemoveMemberFromChat(chatID string, usernames []string) error {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}

	// Get the chat data from the cache/database
	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}

	// Map with users and if they should be deleted
	usernameMap := make(map[string]bool)
	for _, username := range usernames {
		usernameMap[username] = true
	}

	// Filter out usernames to keep
	var currentMembers []string
	for _, member := range chatData.Members {
		log.Println("usernameMap:", usernameMap[member])
		if !usernameMap[member] {
			log.Println("member: ", member)
			currentMembers = append(currentMembers, member)
		} else {
			// Remove the chat from the members document
			RemoveChatFromMember(member, chatID)
		}
	}

	if len(currentMembers) == 0 {
		return DeleteChat(chatID) // If there are no members left in the chat, delete the chat
	}
	chatData.Members = currentMembers

	log.Println("currentMembers Before firestore update:", currentMembers)
	// Update the firestore document with the modified members list
	_, err = client.Collection("chat").Doc(chatID).Update(ctx, []firestore.Update{
		{Path: "members", Value: currentMembers},
	})
	if err != nil {
		log.Println("error updating chat document with members after removal", err)
		return err
	}

	// Update the cache with the new data
	ChatCache[chatData.DocumentID] = CacheData{chatData, time.Now()}

	return nil
}

// AddMemberToChat adds the specified username to the chat with the specified chatID
// It returns the updated members list and potential error
func AddMemberToChat(chatID string, username string) ([]string, error) {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return nil, err
	}

	// Get the chat data from the cache/database
	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return nil, err
	}

	// Add the new member to the chats members list
	chatData.Members = append(chatData.Members, username)

	// Update the firestore document with the modified members list
	_, err = client.Collection("chat").Doc(chatID).Update(ctx, []firestore.Update{
		{Path: "members", Value: chatData.Members},
	})
	if err != nil {
		log.Println("error updating chat document with members after removal", err)
		return nil, err
	}

	// Add the chat to the members document
	AddChatToUser(username, chatID)

	// Update the cache with the new data
	ChatCache[chatData.DocumentID] = CacheData{chatData, time.Now()}

	return chatData.Members, nil
}

// DeleteChat deletes the chat with the specified chatID from the firestore database
func DeleteChat(chatID string) error {

	// Get the chat data from the cache/database
	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}

	// Check if the chat data exists in the cache
	_, ok := ChatCache[chatID]
	if ok {
		// If it is in the cache remove it
		delete(ChatCache, chatID)
	} else {
		log.Println("error getting chat data from cache:")
	}

	// Get the client and context for the firestore database
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}

	// Reference to the specififed chat document
	chatRef := client.Collection("chat").Doc(chatID)

	// Delete the document
	_, err = chatRef.Delete(ctx)
	if err != nil {
		log.Println("Error deleting chat document:", err)
		return err
	}

	// Remove the chat from the members chat list
	for _, member := range chatData.Members {
		err = RemoveChatFromMember(member, chatID)
		if err != nil {
			log.Println("error removing chat from user", err)
			return err
		}
	}

	return nil
}

// GetGroupChat gets teh data for the group chat with the specified groupID
func GetGroupChat(groupID string) (Chat, error) {
	groupData, err := ReturnCacheGroup(groupID)
	if err != nil {
		log.Println("error getting group data from cache:", err)
		return Chat{}, err
	}

	chatData, err := ReturnCacheChat(groupData.Chat)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return Chat{}, err
	}

	return chatData, nil
}
