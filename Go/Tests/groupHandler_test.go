package Tests

import (
	"fmt"
	"prog-2052/Firebase"
	"testing"
	"time"
)

func ResetGroupData() {
	group, err := Firebase.ReturnCacheGroup("testgroup")
	if err != nil {
		fmt.Println("Error when fetching user: " + err.Error())
	}
	group.Name = "testuser"
	group.Members = map[string]string{"testuser": "owner"}
	group.Recipes = map[string]Firebase.GroupRecipe{}
	group.Recipes = make(map[string]Firebase.GroupRecipe)
	group.Recipes["testrecipe"] = Firebase.GroupRecipe{LastEaten: time.Now(), Owner: "testuser", Stored: true}
	group.ShoppingLists = []string{"testshoppinglistgroup"}
	group.Schedule = map[string]Firebase.Dinner{}
	group.Schedule = make(map[string]Firebase.Dinner)
	group.Schedule["2020-01-01"] = Firebase.Dinner{Recipe: "testrecipe", Responsible: []string{"testuser"}}
	err = Firebase.PatchCacheGroup(group)
	if err != nil {
		fmt.Println("Error when patching group: " + err.Error())
	}
}

func TestGroupHandler(t *testing.T) {
	Firebase.InitCache()
	ResetGroupData()
	ResetUserData()

	t.Run("TestGroupPost", func(t *testing.T) {
		t.Skip("Not implemented")
	})

	t.Run("TestGroupGet", func(t *testing.T) {
		t.Skip("Not implemented")
	})

	t.Run("TestGroupPatch", func(t *testing.T) {
		t.Skip("Not implemented")
	})

	t.Run("TestGroupDelete", func(t *testing.T) {
		t.Skip("Not implemented")
	})
}
