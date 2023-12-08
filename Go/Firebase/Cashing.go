// Description: This file contains all the functions for the cache. 
// It also contains the cache maps and the cache timeout.
package Firebase

import (
	"errors"
	"log"
	"time"
)

var UserCache map[string]CacheData
var RecipeCache map[string]CacheData
var GroupCache map[string]CacheData
var ShoppingCache map[string]CacheData
var ChatCache map[string]CacheData

var CacheHits int
var CacheMisses int

const CACHE_TIMEOUT = 48

// InitCache initializes the cache maps and loads all data into the cache
func InitCache() {
	//Initialize maps
	UserCache = make(map[string]CacheData)
	RecipeCache = make(map[string]CacheData)
	GroupCache = make(map[string]CacheData)
	ShoppingCache = make(map[string]CacheData)
	ChatCache = make(map[string]CacheData)

	//Load all data into cache
	users, err := GetAllUsers()
	if err != nil {
		log.Println("Error when warming cache users: ", err)
	}
	for _, user := range users {
		UserCache[user.Username] = CacheData{user, time.Now()}
	}

	recipes, err := GetAllRecipes()
	if err != nil {
		log.Println("Error when warming cache recipes: ", err)
	}
	for _, recipe := range recipes {
		RecipeCache[recipe.DocumentID] = CacheData{recipe, time.Now()}
	}

	groups, err := GetAllGroups()
	if err != nil {
		log.Println("Error when warming cache groups: ", err)
	}
	for _, group := range groups {
		GroupCache[group.DocumentID] = CacheData{group, time.Now()}
	}

	shoppingLists, err := GetAllShoppingLists()
	if err != nil {
		log.Println("Error when warming cache shopping lists: ", err)
	}
	for _, list := range shoppingLists {
		ShoppingCache[list.DocumentID] = CacheData{list, time.Now()}
	}

	chats, err := GetAllChats()
	if err != nil {
		log.Println("Error when warming cache chats: ", err)
	}
	for _, chat := range chats {
		ChatCache[chat.DocumentID] = CacheData{chat, time.Now()}
	}

	log.Println("Cache warmed")
}

// GetCacheData returns the data from the cache with the specified key, and a bool indicating if the data was found in the
func GetCacheData(cache map[string]CacheData, key string) (CacheData, bool) {
	//Check if the data is in the cache
	val, ok := cache[key]
	if ok {
		//Check if the data is too old
		if time.Since(val.cachedAt).Hours() > CACHE_TIMEOUT {
			delete(cache, key)
			return CacheData{}, false
		}
		CacheHits++
	} else {
		CacheMisses++
	}
	return val, ok
}

/*****************				USER FUNCTIONS				*****************/

// ReturnCacheUser returns the user with the specified username. It first checks if the user exists in the cache,
// otherwise it gets the user from the database and adds it to the cache
func ReturnCacheUser(username string) (User, error) {
	user, ok := GetCacheData(UserCache, username)
	if ok {
		return user.Data.(User), nil
	}
	retUser, err := GetUserData(username)
	if err != nil {
		return User{}, err
	}
	UserCache[username] = CacheData{retUser, time.Now()}
	return retUser, nil
}

// PatchCacheUser updates the user from the cache and also updates the user in the database
func PatchCacheUser(user User) error {
	err := PatchUser(user)
	if err != nil {
		return err
	}
	UserCache[user.Username] = CacheData{user, time.Now()}
	return nil
}

// DeleteCacheUser deletes the user from the cache and also deletes the user from the database
func DeleteCacheUser(userID string) error {
	err := DeleteUser(userID)
	if err != nil {
		return err
	}
	delete(UserCache, userID)
	return nil
}

/*****************				GROUP FUNCTIONS				*****************/

// ReturnCacheGroup returns the group with the specified groupID. It first checks if the group exists in the cache,
// otherwise it gets the group from the database and adds it to the cache
func ReturnCacheGroup(groupID string) (Group, error) {
	group, ok := GetCacheData(GroupCache, groupID)
	if ok {
		return group.Data.(Group), nil
	}
	groupData, err := GetGroupData(groupID)
	if err != nil {
		return Group{}, err
	}
	GroupCache[groupID] = CacheData{groupData, time.Now()}
	return groupData, nil
}

// PatchCacheGroup updates the group from the cache and also updates the group in the database
func PatchCacheGroup(group Group) error {
	err := PatchGroup(group)
	if err != nil {
		return err
	}
	GroupCache[group.DocumentID] = CacheData{group, time.Now()}
	return nil
}

// DeleteCacheGroup deletes the group from the cache and also deletes the group from the database
func DeleteCacheGroup(groupID string) error {
	err := DeleteGroup(groupID)
	if err != nil {
		return err
	}
	delete(GroupCache, groupID)
	return nil
}

/*****************				RECIPE FUNCTIONS				*****************/

// ReturnCacheRecipe returns the recipe with the specified recipeID. It first checks if the recipe exists in the cache,
// otherwise it gets the recipe from the database and adds it to the cache
func ReturnCacheRecipe(recipeID string) (Recipe, error) {
	recipe, ok := GetCacheData(RecipeCache, recipeID)
	if ok {
		return recipe.Data.(Recipe), nil
	}
	retRecipe, err := GetRecipeData(recipeID)
	if err != nil {
		return Recipe{}, err
	}
	RecipeCache[recipeID] = CacheData{retRecipe, time.Now()}
	return retRecipe, nil
}

// PatchCacheRecipe updates the recipe from the cache and also updates the recipe in the database
func PatchCacheRecipe(recipe Recipe) error {
	err := PatchRecipe(recipe)
	if err != nil {
		return err
	}
	RecipeCache[recipe.DocumentID] = CacheData{recipe, time.Now()}
	return nil
}

// DeleteCacheRecipe deletes the recipe from the cache and also deletes the recipe from the database
func DeleteCacheRecipe(recipeID string) error {
	err := DeleteRecipe(recipeID)
	if err != nil {
		return err
	}
	delete(RecipeCache, recipeID)
	return nil
}

/*****************				SHOPPING FUNCTIONS				*****************/

// ReturnCacheShoppingList returns the shopping list with the specified listID. It first checks if the
// shopping list exists in the cache, otherwise it gets the shopping list from the database and adds it to the cache
func ReturnCacheShoppingList(listID string) (ShoppingList, error) {
	list, ok := GetCacheData(ShoppingCache, listID)
	if ok {
		return list.Data.(ShoppingList), nil
	}
	retList, err := GetShoppingListData(listID)
	if err != nil {
		return ShoppingList{}, err
	}
	ShoppingCache[listID] = CacheData{retList, time.Now()}
	return retList, nil
}

// PatchCacheShoppingList updates the shopping list from the cache and also updates the shopping list in the database
func PatchCacheShoppingList(list ShoppingList) error {
	err := PatchShoppingList(list)
	if err != nil {
		return err
	}
	ShoppingCache[list.DocumentID] = CacheData{list, time.Now()}
	return nil
}

// DeleteCacheShoppingList deletes the shopping list from the cache and also deletes the shopping list from the database
func DeleteCacheShoppingList(listID string) error {
	if listID == "" {
		return errors.New("listID cannot be empty")
	}
	err := DeleteShoppingList(listID)
	if err != nil {
		return err
	}
	delete(ShoppingCache, listID)
	return nil
}

//NOTE: Not removing from cache if recipe is deleted, will time out after 24 hours

/*****************				CHAT FUNCTIONS				*****************/

// ReturnCacheChat returns the chat with the specified chatID. It first checks if the chat exists in the cache,
// otherwise it gets the chat from the database and adds it to the cache
func ReturnCacheChat(chatID string) (Chat, error) {
	chat, ok := GetCacheData(ChatCache, chatID)
	if ok {
		return chat.Data.(Chat), nil
	}
	chatData, err := GetChatData(chatID)
	if err != nil {
		return Chat{}, err
	}
	ChatCache[chatID] = CacheData{chatData, time.Now()}
	return chatData, nil
}

// PatchCacheChat updates the chat from the cache and also updates the chat in the database
func PatchCacheChat(chat Chat) error {
	err := PatchChat(chat)
	if err != nil {
		return err
	}
	ChatCache[chat.DocumentID] = CacheData{chat, time.Now()}
	return nil
}

// DeleteCacheChat deletes the chat from the cache and also deletes the chat from the database
func DeleteCacheChat(chatID string) error {
	err := DeleteChat(chatID)
	if err != nil {
		return err
	}
	delete(ChatCache, chatID)
	return nil
}
