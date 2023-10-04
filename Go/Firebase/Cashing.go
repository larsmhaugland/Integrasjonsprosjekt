package Firebase

import (
	"errors"
	"time"
)

var UserCache map[string]CacheData
var RecipeCache map[string]CacheData
var GroupCache map[string]CacheData
var ShoppingCache map[string]CacheData

var CacheHits int
var CacheMisses int

const CACHE_TIMEOUT = 48

func InitCache() {
	UserCache = make(map[string]CacheData)
	RecipeCache = make(map[string]CacheData)
	GroupCache = make(map[string]CacheData)
	ShoppingCache = make(map[string]CacheData)
}

func GetCacheData(cache map[string]CacheData, key string) (CacheData, bool) {
	val, ok := cache[key]
	if ok {
		if time.Since(val.cachedAt).Hours() > CACHE_TIMEOUT {
			delete(cache, key)
			return CacheData{}, false
		}
		CacheHits++
	}
	CacheMisses++
	return val, ok
}

/*****************				USER FUNCTIONS				*****************/

func ReturnCacheUser(userID string) (User, error) {
	user, ok := GetCacheData(UserCache, userID)
	if ok {
		return user.Data.(User), nil
	}
	retUser, err := GetUserData(userID)
	if err != nil {
		return User{}, err
	}
	UserCache[userID] = CacheData{retUser, time.Now()}
	return retUser, nil
}

func PatchCacheUser(user User) error {
	err := PatchUser(user)
	if err != nil {
		return err
	}
	UserCache[user.Username] = CacheData{user, time.Now()}
	return nil
}

func DeleteCacheUser(userID string) error {
	err := DeleteUser(userID)
	if err != nil {
		return err
	}
	delete(UserCache, userID)
	return nil
}

/*****************				GROUP FUNCTIONS				*****************/

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

func PatchCacheGroup(group Group) error {
	err := PatchGroup(group)
	if err != nil {
		return err
	}
	GroupCache[group.ID] = CacheData{group, time.Now()}
	return nil
}

func DeleteCacheGroup(groupID string) error {
	err := DeleteGroup(groupID)
	if err != nil {
		return err
	}
	delete(GroupCache, groupID)
	return nil
}

/*****************				RECIPE FUNCTIONS				*****************/

func ReturnCacheRecipe(recipeID string) (Recipe, error) {
	user, ok := GetCacheData(UserCache, recipeID)
	if ok {
		return user.Data.(Recipe), nil
	}
	retRecipe, err := GetRecipeData(recipeID)
	if err != nil {
		return Recipe{}, err
	}
	UserCache[recipeID] = CacheData{retRecipe, time.Now()}
	return retRecipe, nil
}

func PatchCacheRecipe(recipe Recipe) error {
	err := PatchRecipe(recipe)
	if err != nil {
		return err
	}
	RecipeCache[recipe.ID] = CacheData{recipe, time.Now()}
	return nil
}

func DeleteCacheRecipe(recipeID string) error {
	err := DeleteRecipe(recipeID)
	if err != nil {
		return err
	}
	delete(RecipeCache, recipeID)
	return nil
}

/*****************				SHOPPING FUNCTIONS				*****************/

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

func PatchCacheShoppingList(list ShoppingList) error {
	err := PatchShoppingList(list)
	if err != nil {
		return err
	}
	ShoppingCache[list.ID] = CacheData{list, time.Now()}
	return nil
}

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
