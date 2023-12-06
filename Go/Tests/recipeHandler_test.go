package Tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"prog-2052/API"
	"prog-2052/Firebase"
	"strings"
	"testing"
)

func ResetRecipeData(recipeID string) {
	recipe, err := Firebase.ReturnCacheRecipe(recipeID)
	if err != nil {
		fmt.Println("Error when fetching chat: " + err.Error())
		return
	}

	// Modify chat data as needed
	recipe.DocumentID = recipeID
	recipe.Name = recipeID
	recipe.Image = "testimage"

	// Update chat data in Firebase
	err = Firebase.PatchCacheRecipe(recipe)
	if err != nil {
		fmt.Println("Error when patching chat: " + err.Error())
	}
}
func TestRecipeDeleteHandler(t *testing.T) {
	ResetRecipeData("testrecipe2")
	ResetGroupData("testgroup", "testchat", "testuserrecipe", "testrecipe2", false)
	ResetUserData("testuserrecipe", "testrecipe2")
	user, err := Firebase.ReturnCacheUser("testuserrecipe")
	group, err := Firebase.ReturnCacheGroup("testgroup")

	// Create a new recipe to delete
	recipe := Firebase.Recipe{
		DocumentID: "testrecipe2",
		Name:       "Test Recipe",
		Image:      "test-image",
	}
	err = Firebase.PatchCacheRecipe(recipe)
	if err != nil {
		t.Fatalf("Error setting up test: %v", err)
	}

	// Create a request to delete the recipe
	reqBody := fmt.Sprintf(`{"username": "%s"}`, user.Username)
	req, err := http.NewRequest(http.MethodDelete, "/recipes/"+recipe.DocumentID, strings.NewReader(reqBody))
	if err != nil {
		t.Fatalf("Error creating request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Create a response recorder to record the response
	rr := httptest.NewRecorder()

	RecipeDeleteHandlerTest(rr, req)

	// Check the response status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check that the recipe was deleted from cache
	_, err = Firebase.ReturnCacheRecipe(recipe.DocumentID)
	if err == nil {
		t.Errorf("Recipe was not deleted from cache")
	}

	// Check that the recipe was deleted from user
	user, err = Firebase.ReturnCacheUser(user.Username)
	if err != nil {
		t.Fatalf("Error fetching user from cache: %v", err)
	}
	for _, rID := range user.Recipes {
		if rID == recipe.DocumentID {
			t.Errorf("Recipe was not deleted from user")
		}
	}

	// Check that the recipe was deleted from group
	group, err = Firebase.ReturnCacheGroup(group.DocumentID)
	if err != nil {
		t.Fatalf("Error fetching group from cache: %v", err)
	}
	if _, ok := group.Recipes[recipe.DocumentID]; ok {
		t.Errorf("Recipe was not deleted from group")
	}
}

func TestRecipePatchHandler(t *testing.T) {
	ResetRecipeData("testrecipe3")
	recipe, err := Firebase.ReturnCacheRecipe("testrecipe3")

	// Create a request to patch the recipe
	recipe.Name = "New Title"
	reqBody, err := json.Marshal(recipe)
	if err != nil {
		t.Fatalf("Error marshaling request body: %v", err)
	}
	req, err := http.NewRequest(http.MethodPatch, "/recipes/"+recipe.DocumentID, bytes.NewBuffer(reqBody))
	if err != nil {
		t.Fatalf("Error creating request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Create a response recorder to record the response
	rr := httptest.NewRecorder()

	API.RecipePatchHandler(rr, req)

	// Check the response status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check that the recipe was patched in cache
	patchedRecipe, err := Firebase.ReturnCacheRecipe(recipe.DocumentID)
	if err != nil {
		t.Fatalf("Error fetching recipe from cache: %v", err)
	}
	if patchedRecipe.Name != recipe.Name {
		t.Errorf("Recipe was not patched in cache")
	}
}

func TestRecipeGetHandler(t *testing.T) {

	ResetGroupData("testgroup", "testchat", "testuser", "testrecipe", false)
	// Create a new recipe
	recipe := Firebase.Recipe{
		DocumentID:  "test-recipe-id",
		Name:        "Test Recipe",
		Description: "Test Description",
		Image:       "test-image",
		Ingredients: map[string]string{
			"ingredient1": "Test Ingredient 1",
			"ingredient2": "Test Ingredient 2",
			"ingredient3": "Test Ingredient 3",
		},
		Instructions: []string{
			"Test Step 1",
			"Test Step 2",
			"Test Step 3",
		},
		Categories: []string{"category1", "category2"},
		Portions:   4,
		Group:      "test-group-id",
	}
	err := Firebase.PatchCacheRecipe(recipe)
	if err != nil {
		t.Fatalf("Error setting up test: %v", err)
	}

	// Create a new user with the recipe
	user := Firebase.User{
		Username:   "test-user",
		Recipes:    []string{recipe.DocumentID},
		DocumentID: "test-user",
	}

	err = Firebase.PatchCacheUser(user)
	if err != nil {
		t.Fatalf("Error setting up test: %v", err)
	}

	// Create a new group with the recipe
	group := Firebase.Group{
		DocumentID: "test-group-id",
		Name:       "Test Group",
		Recipes: map[string]Firebase.GroupRecipe{recipe.DocumentID: {
			Owner: "test-user",
		}},
	}
	err = Firebase.PatchCacheGroup(group)
	if err != nil {
		t.Fatalf("Error setting up test: %v", err)
	}

	// Create a request to get the user's recipes
	req, err := http.NewRequest(http.MethodGet, "/recipes/"+user.Username, nil)
	if err != nil {
		t.Fatalf("Error creating request: %v", err)
	}

	// Create a response recorder to record the response
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(API.RecipeGetHandler)
	handler.ServeHTTP(rr, req)

	// Check the response status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Check the response body
	var respBody struct {
		UserRecipes    []Firebase.Recipe `json:"userRecipes"`
		GroupRecipes   []Firebase.Recipe `json:"groupRecipes"`
		ExampleRecipes []Firebase.Recipe `json:"exampleRecipes"`
	}
	err = json.Unmarshal(rr.Body.Bytes(), &respBody)
	if err != nil {
		t.Fatalf("Error decoding response body: %v", err)
	}
	if len(respBody.UserRecipes) != 1 || respBody.UserRecipes[0].DocumentID != recipe.DocumentID {
		t.Errorf("Handler returned wrong user recipes: got %v, want %v", respBody.UserRecipes, []Firebase.Recipe{recipe})
	} /*
		if len(respBody.GroupRecipes) != 1 || respBody.GroupRecipes[0].DocumentID != recipe.DocumentID {
			t.Errorf("Handler returned wrong group recipes: got %v, want %v", respBody.GroupRecipes, []Firebase.Recipe{recipe})
		}*/
	if len(respBody.ExampleRecipes) != len(API.ExampleRecipes) {
		t.Errorf("Handler returned wrong example recipes: got %v, want %v", respBody.ExampleRecipes, API.ExampleRecipes)
	}
}

func TestRecipePostHandler(t *testing.T) {

	// Create a request body with a new recipe
	recipe := Firebase.Recipe{
		Name:        "Test Recipe",
		Description: "Test Description",
		Image:       "test-image",
		Ingredients: map[string]string{
			"ingredient1": "Test Ingredient 1",
			"ingredient2": "Test Ingredient 2",
			"ingredient3": "Test Ingredient 3",
		},
		Instructions: []string{
			"Test Step 1",
			"Test Step 2",
			"Test Step 3",
		},
		Categories: []string{"category1", "category2"},
		Portions:   4,
	}

	groups := []string{"testgroup2"}
	groupsJSON, _ := json.Marshal(groups)
	groupsJSONString := string(groupsJSON)
	json, _ := json.Marshal(recipe)
	recipeJSON := string(json)

	reqBody := fmt.Sprintf(`{"recipe": %s, "groups": %s, "owner": "testuser3"}`, recipeJSON, groupsJSONString)
	req, err := http.NewRequest(http.MethodPost, "/recipes", strings.NewReader(reqBody))
	if err != nil {
		t.Fatalf("Error creating request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Create a response recorder to record the response
	rr := httptest.NewRecorder()

	// Call the handler function
	handler := http.HandlerFunc(API.RecipePostHandler)
	handler.ServeHTTP(rr, req)

	// Check the response status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v, want %v", status, http.StatusOK)
	}

	// Get the string of the response body
	bodyString := rr.Body.String()

	// Remove trailing newline
	bodyString = strings.TrimSuffix(bodyString, "\n")

	// Remove leading and trailing \" characters
	bodyString = strings.Trim(bodyString, `\"`)

	// Remove leading and trailing \" characters if they exist after the previous trimming
	bodyString = strings.TrimPrefix(bodyString, `\"`)
	bodyString = strings.TrimSuffix(bodyString, `\"`)

	addedRecipe, err := Firebase.ReturnCacheRecipe(bodyString)
	if err != nil {
		t.Fatalf("Error fetching recipe from cache: %v", err)
	}
	if addedRecipe.Name != recipe.Name {
		t.Errorf("Recipe was not added to cache")
	}

	// Check that the recipe was added to user
	user, err := Firebase.ReturnCacheUser("testuser3")
	if err != nil {
		t.Fatalf("Error fetching user from cache: %v", err)
	}
	t.Logf("User recipe: %q", user.Recipes[len(user.Recipes)-1])
	t.Logf("Body string: %q", bodyString)
	if len(user.Recipes) == 0 || user.Recipes[len(user.Recipes)-1] != bodyString {
		t.Errorf("Recipe was not added to user. Want: %v, got: %v", bodyString, user.Recipes[len(user.Recipes)-1])
	}

	// Check that the recipe was added to group
	group, err := Firebase.ReturnCacheGroup("testgroup2")
	if err != nil {
		t.Fatalf("Error fetching group from cache: %v", err)
	}
	if _, ok := group.Recipes[bodyString]; !ok {
		t.Errorf("Recipe was not added to group")
	}
}

func toJSON(recipe Firebase.Recipe) string {
	// implementation to convert Recipe to JSON
	jsonBytes, _ := json.Marshal(recipe)
	return string(jsonBytes)
}
