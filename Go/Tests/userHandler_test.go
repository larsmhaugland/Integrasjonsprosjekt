package Tests

import (
	"fmt"
	"prog-2052/Firebase"
)

func ResetUserData() {
	user, err := Firebase.ReturnCacheUser("testuser")
	if err != nil {
		fmt.Println("Error when fetching user: %v", err)
	}
	user.Username = "testuser"
	user.Password = "testpassword"
	user.Name = "Test User"
	user.Recipes = []string{"testrecipe"}
	user.ShoppingLists = []string{"testshoppinglistuser"}
	user.Groups = []string{"testgroup"}
	err = Firebase.PatchCacheUser(user)
	if err != nil {
		fmt.Println("Error when patching user: %v", err)
	}
}
