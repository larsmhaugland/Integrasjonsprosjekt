package Tests

import (
	"os"
	"prog-2052/Firebase"
	"testing"
)

func TestRecipeHandler(t *testing.T) {
	os.Chdir("../")
	Firebase.InitCache()
	ResetUserData()
	ResetGroupData()

	t.Run("TestRecipePost", func(t *testing.T) {
		t.Skip("Not implemented")
	})

	t.Run("TestRecipeGet", func(t *testing.T) {
		t.Skip("Not implemented")
	})

	t.Run("TestRecipeDelete", func(t *testing.T) {
		t.Skip("Not implemented")
	})

	t.Run("TestRecipePatch", func(t *testing.T) {
		t.Skip("Not implemented")
	})

}
