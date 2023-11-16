package Tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"prog-2052/API"
	"prog-2052/Firebase"
	"strings"
	"testing"
)

func TestShoppingHandler(t *testing.T) {
	os.Chdir("../")
	wd, _ := os.Getwd()
	fmt.Println("Working directory: " + wd)
	var shoppingListID string
	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)

	t.Run("TestShoppingPost", func(t *testing.T) {
		testShoppingList := Firebase.ShoppingList{
			Assignees: []string{"testuser"},
			List:      make(map[string]Firebase.ShoppingListItem),
		}
		testShoppingList.List["Iste Rema"] = Firebase.ShoppingListItem{
			Quantity: "1",
			Category: "necessity",
		}
		testShoppingList.List["Kjøttdeig"] = Firebase.ShoppingListItem{
			Quantity: "1",
			Category: "Amundfôr",
		}
		// Marshal the testShoppingList to JSON
		jsonShoppingList, err := json.Marshal(testShoppingList)
		if err != nil {
			t.Errorf("Error when marshalling testShoppingList: %v", err)
			t.Fatal(err)
		}

		// Prepare a request to pass to our handler.
		req, err := http.NewRequest(http.MethodPost, "testuser", bytes.NewReader(jsonShoppingList))
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Content-Type", "application/json")

		// We create a ResponseRecorder (which satisfies http.ResponseWriter) to record the response.
		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(API.ShoppingBaseHandler)

		// Our handlers satisfy http.Handler, so we can call their ServeHTTP method directly and pass in our Request and ResponseRecorder.
		handler.ServeHTTP(rr, req)

		err = json.Unmarshal(rr.Body.Bytes(), &shoppingListID)
		if err != nil {
			t.Errorf("Error when unmarshalling response body: %v", err)
		}
		// Check the status code is what we expect.
		if status := rr.Code; status != http.StatusCreated {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusCreated)
		}
	})

	t.Run("TestShoppingGet", func(t *testing.T) {
		// Prepare a request to pass to our handler. We don't have any query parameters for now, so we'll pass 'nil' as the third parameter.
		req, err := http.NewRequest(http.MethodGet, "testuser", nil)
		if err != nil {
			t.Fatal(err)
		}

		// We create a ResponseRecorder (which satisfies http.ResponseWriter) to record the response.
		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(API.ShoppingBaseHandler)

		// Our handlers satisfy http.Handler, so we can call their ServeHTTP method directly and pass in our Request and ResponseRecorder.
		handler.ServeHTTP(rr, req)

		// Check the status code is what we expect.
		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusOK)
		}

		expected := `[{"documentID":"testlist","assignees":["testuser"],"list":{"itemID2":{"complete":false,"quantity":"1","category":"test-category"}}},{"documentID":"","assignees":["testuser"],"list":{"Iste Rema":{"complete":false,"quantity":"1","category":"necessity"},"Kjøttdeig":{"complete":false,"quantity":"1","category":"Amundfôr"}}}]`
		var actual []Firebase.ShoppingList
		err = json.Unmarshal(rr.Body.Bytes(), &actual)
		if err != nil {
			t.Errorf("Error when unmarshalling response body: %v", err)
		}
		if len(actual) != 2 {
			t.Errorf("handler returned wrong number of shopping lists: got %v want %v",
				len(actual), 1)
		} else {
			if strings.TrimSuffix(rr.Body.String(), "\n") != expected {
				t.Errorf("handler returned unexpected body: got %v want %v",
					rr.Body.String(), expected)
			}
		}
	})

	t.Run("TestShoppingDelete", func(t *testing.T) {
		fmt.Println("Shopping list DocumentID: " + shoppingListID)
		err := Firebase.DeleteCacheShoppingList(shoppingListID)
		if err != nil {
			t.Errorf("Error when deleting shopping list: %v", err)
		}
		user, err := Firebase.ReturnCacheUser("testuser")
		if err != nil {
			t.Errorf("Error when fetching user: %v", err)
		}
		user.ShoppingLists = []string{}
		user.Groups = []string{}
		err = Firebase.PatchCacheUser(user)
		if err != nil {
			t.Errorf("Error when patching user: %v", err)
		}
		shoppingList, err := Firebase.ReturnCacheShoppingList(shoppingListID)
		if err == nil {
			t.Errorf("Shopping list was not deleted: %v", shoppingList)
		}
	})
}
