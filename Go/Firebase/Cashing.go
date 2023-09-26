package Firebase

import "time"

var UserCache map[string]CacheData

func InitCache() {
	UserCache = make(map[string]CacheData)

}

func GetCacheData(cache map[string]CacheData, key string) (CacheData, bool) {
	val, ok := cache[key]
	return val, ok
}

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
