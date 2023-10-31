package Firebase

import (
	"cloud.google.com/go/firestore"
	"context"
	"log"
	"time"
)

func GetChatData(chatID string) (Chat, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Chat{}, err
	}

	var chat Chat
	doc, err := client.Collection("chat").Doc(chatID).Get(ctx)
	if err != nil {
		log.Println("Error getting chat document", err)
		return Chat{}, err
	}

	err = doc.DataTo(&chat)
	chat.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting firebase document to chat struct", err)
		return Chat{}, err
	}

	return chat, nil
}

func AddMessageToChat(message Message, chatID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)

	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}
	// In case there are no messages already in the chat
	if chatData.Messages == nil {
		chatData.Messages = append(make([]Message, 0), message)
	} else {
		chatData.Messages = append(chatData.Messages, message)
	}

	ChatCache[chatID] = CacheData{chatData, time.Now()}

	chatDocRef := client.Collection("chat").Doc(chatID)

	_, err = chatDocRef.Update(ctx, []firestore.Update{
		{Path: "messages", Value: chatData.Messages},
	})

	if err != nil {
		log.Println("error updating chat document with new message", err)
		return err
	}

	return nil

}

// Adds a new chat document to the firestore chat collection
// parameters chat: the chat struct to be added to the database
// parameters newGroup: bool to check if chat is created because a new group was created on the homepage
func AddNewChat(chat Chat) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}
	docRefNewChat := client.Collection("chat").Doc(chat.DocumentID)

	_, err = docRefNewChat.Set(ctx, map[string]interface{}{
		"members":   chat.Members,
		"chatOwner": chat.ChatOwner,
		"name":      chat.Name,
	})
	if err != nil {
		log.Println("error adding new chat document to the firestore database", err)
		return err
	}

	for _, member := range chat.Members {
		err = AddChatToUser(member, chat.DocumentID)
		if err != nil {
			log.Println("error adding chat to user", err)
			return err
		}
	}
	// Pretty sure this line is not needed as they should be the same
	chat.DocumentID = docRefNewChat.ID

	ChatCache[chat.DocumentID] = CacheData{chat, time.Now()}

	return nil
}

func RemoveMemberFromChat(chatID string, username string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}

	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return err
	}

	currentMembers := make([]string, 0)

	for _, memberName := range chatData.Members {
		if memberName != username {
			currentMembers = append(currentMembers, memberName)
		}
	}

	chatData.Members = currentMembers

	_, err = client.Collection("chat").Doc(chatID).Update(ctx, []firestore.Update{
		{Path: "members", Value: currentMembers},
	})
	if err != nil {
		log.Println("error updating chat document with members after removal", err)
		return err
	}

	RemoveChatFromMember(username, chatID)

	ChatCache[chatData.DocumentID] = CacheData{chatData, time.Now()}

	return nil
}

func AddMemberToChat(chatID string, username string) ([]string, error) {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return nil, err
	}

	chatData, err := ReturnCacheChat(chatID)
	if err != nil {
		log.Println("error getting chat data from cache:", err)
		return nil, err
	}

	chatData.Members = append(chatData.Members, username)

	_, err = client.Collection("chat").Doc(chatID).Update(ctx, []firestore.Update{
		{Path: "members", Value: chatData.Members},
	})
	if err != nil {
		log.Println("error updating chat document with members after removal", err)
		return nil, err
	}

	AddChatToUser(username, chatID)

	ChatCache[chatData.DocumentID] = CacheData{chatData, time.Now()}

	return chatData.Members, nil
}

func DeleteChat(chatID string) error {

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

	// Update the Firestore document with the modified groups list
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client", err)
		return err
	}

	// Reference to the specific document
	chatRef := client.Collection("chat").Doc(chatID)

	// Delete the document
	_, err = chatRef.Delete(ctx)
	if err != nil {
		log.Println("Error deleting chat document:", err)
		return err
	}

	for _, member := range chatData.Members {
		err = RemoveChatFromMember(member, chatID)
		if err != nil {
			log.Println("error removing chat from user", err)
			return err
		}
	}

	return nil
}

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
