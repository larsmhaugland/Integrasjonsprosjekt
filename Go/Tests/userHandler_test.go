package Tests

import (
	"fmt"
	"prog-2052/Firebase"
)

func ResetUserData() {
	user, err := Firebase.ReturnCacheUser("testuser")
	if err != nil {
		fmt.Println("Error when fetching user: " + err.Error())
	}
	user.Username = "testuser"
	user.Password = "testpassword"
	user.Name = "Test User"
	user.Recipes = []string{}
	user.ShoppingLists = []string{}
	user.Groups = []string{}
	err = Firebase.PatchCacheUser(user)
	if err != nil {
		fmt.Println("Error when patching user: " + err.Error())
	}
}
