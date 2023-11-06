package API

import (
	"fmt"
	"net/http"
	"prog-2052/Firebase"
	"strings"
	"time"
)

func SetCORSHeaders(w http.ResponseWriter) {
	// Allow requests from any origin
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Allow the GET, POST, PUT, DELETE, OPTIONS methods
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")

	// Allow the "Content-Type" and "username" header
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, username")
}

func RecipeBaseHandler(w http.ResponseWriter, r *http.Request) {

	parts := strings.Split(r.URL.Path, "/")
	SetCORSHeaders(w)
	if len(parts) >= 2 {
		switch r.Method {
		case http.MethodPost:
			RecipePostHandler(w, r)
		case http.MethodGet:
			RecipeGetHandler(w, r)
			break
		case http.MethodPatch:
			RecipePatchHandler(w, r)
			break
		case http.MethodDelete:
			RecipeDeleteHandler(w, r)
		case http.MethodOptions: // For CORS
			return
		default:
			http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		}
	} else {
		http.Error(w, "Error; Invalid URL", http.StatusBadRequest)
	}
}

func RecipeDeleteHandler(w http.ResponseWriter, r *http.Request) {
	type input struct {
		RecipeID string   `json:"recipeID"`
		Owner    string   `json:"owner"`
		Groups   []string `json:"groups"`
	}
	var data input
	err := DecodeJSONBody(w, r, &data)
	if err != nil {
		http.Error(w, "Error when decoding request DELETE: "+err.Error(), http.StatusBadRequest)
		return
	}
	user, err := Firebase.ReturnCacheUser(data.Owner)
	if err != nil {
		http.Error(w, "Error when fetching user: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Search for recipe in user
	index := -1
	for i, recipeID := range user.Recipes {
		if recipeID == data.RecipeID {
			index = i
			break
		}
	}
	//If recipe is found, remove it from user
	if index != -1 {
		user.Recipes = append(user.Recipes[:index], user.Recipes[index+1:]...)
		err = Firebase.PatchCacheUser(user)
		if err != nil {
			http.Error(w, "Error when patching user: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
	//Remove recipe from groups
	for _, groupID := range data.Groups {
		group, err := Firebase.ReturnCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Error when fetching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
		delete(group.Recipes, data.RecipeID)
		err = Firebase.PatchCacheGroup(group)
		if err != nil {
			http.Error(w, "Error when patching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
	//Remove recipe from firebase
	err = Firebase.DeleteRecipe(data.RecipeID)
	if err != nil {
		http.Error(w, "Error when deleting recipe: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipePatchHandler(w http.ResponseWriter, r *http.Request) {
	var recipe Firebase.Recipe

	docID := strings.Split(r.URL.Path, "/")[len(strings.Split(r.URL.Path, "/"))-1]

	err := DecodeJSONBody(w, r, &recipe)
	recipe.DocumentID = docID
	if err != nil {
		fmt.Println("Error when decoding request PATCH: "+err.Error(), http.StatusBadRequest)
		http.Error(w, "Error when decoding request PATCH: "+err.Error(), http.StatusBadRequest)
		return
	}
	err = Firebase.PatchCacheRecipe(recipe)
	if err != nil {
		http.Error(w, "Error when patching DB: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipeGetHandler(w http.ResponseWriter, r *http.Request) {
	groupQ := r.URL.Query().Get("group")
	single := r.URL.Query().Get("single")
	parts := strings.Split(r.URL.Path, "/")
	storedIn := parts[len(parts)-1]
	if storedIn == "" {
		http.Error(w, "Error; No id provided", http.StatusBadRequest)
		return
	}

	//If only a single recipe is requested, return it
	if single == "true" {
		recipe, err := Firebase.ReturnCacheRecipe(storedIn)
		if err != nil {
			http.Error(w, "Error when fetching recipe: "+err.Error(), http.StatusInternalServerError)
			return
		}
		err = EncodeJSONBody(w, r, recipe)
		if err != nil {
			http.Error(w, "Error when encoding response: "+err.Error(), http.StatusInternalServerError)
			return
		}
		return
	}

	type outuput struct {
		UserRecipes    []Firebase.Recipe `json:"userRecipes"`
		GroupRecipes   []Firebase.Recipe `json:"groupRecipes"`
		ExampleRecipes []Firebase.Recipe `json:"exampleRecipes"`
	}

	var recipes outuput

	user, err := Firebase.ReturnCacheUser(storedIn)
	if err != nil {
		http.Error(w, "Error when fetching user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, recipeID := range user.Recipes {
		recipe, err := Firebase.ReturnCacheRecipe(recipeID)
		if err != nil {
			http.Error(w, "Error when fetching recipe: "+err.Error(), http.StatusInternalServerError)
			return
		}
		recipes.UserRecipes = append(recipes.UserRecipes, recipe)
	}

	if groupQ == "true" {
		g, err := Firebase.ReturnCacheGroup(storedIn)
		if err != nil {
			http.Error(w, "Error when fetching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
		for recipeID := range g.Recipes {
			recipe, err := Firebase.ReturnCacheRecipe(recipeID)
			if err != nil {
				http.Error(w, "Error when fetching recipe: "+err.Error(), http.StatusInternalServerError)
				return
			}
			recipes.GroupRecipes = append(recipes.GroupRecipes, recipe)
		}
	}
	//Add example recipes to the response
	recipes.ExampleRecipes = ExampleRecipes

	err = EncodeJSONBody(w, r, recipes)
	if err != nil {
		http.Error(w, "Error when encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipePostHandler(w http.ResponseWriter, r *http.Request) {
	type Input struct {
		Recipe Firebase.Recipe `json:"recipe"`
		Groups []string        `json:"groups"`
		Owner  string          `json:"owner"`
	}
	var data Input
	err := DecodeJSONBody(w, r, &data)
	if err != nil {
		http.Error(w, "Error when decoding POST: "+err.Error(), http.StatusBadRequest)
		return
	}
	id, err := Firebase.AddRecipe(data.Recipe)
	if err != nil {
		http.Error(w, "Error when adding recipe to firebase: "+err.Error(), http.StatusInternalServerError)
		return
	}
	user, err := Firebase.GetUserData(data.Owner)
	if err != nil {
		http.Error(w, "Error when fetching user data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	duplicate := false
	for _, recipeID := range user.Recipes {
		if recipeID == id {
			duplicate = true
		}
	}
	if duplicate {
		http.Error(w, "Error; Recipe already exists", http.StatusBadRequest)
		return
	}
	user.Recipes = append(user.Recipes, id)
	err = Firebase.PatchCacheUser(user)
	if err != nil {
		http.Error(w, "Error when patching user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, groupID := range data.Groups {
		group, err := Firebase.ReturnCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Error when getting group: "+err.Error(), http.StatusInternalServerError)
			return
		}
		recipe := Firebase.GroupRecipe{
			Owner:     user.Username,
			LastEaten: time.Now(),
		}
		if group.Recipes == nil {
			group.Recipes = make(map[string]Firebase.GroupRecipe)
		}
		group.Recipes[id] = recipe
		err = Firebase.PatchCacheGroup(group)
		if err != nil {
			http.Error(w, "Error when adding recipe to group: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	err = EncodeJSONBody(w, r, id)
	if err != nil {
		http.Error(w, "Error when encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

var ExampleRecipes = []Firebase.Recipe{
	{
		Name:        "Pasta",
		Description: "Pasta med tomat saus",
		URL:         "https://trinesmatblogg.no/recipe/spagetti-med-tomatsaus/",
		Time:        15,
		Difficulty:  2,
	},
	{
		Name:        "Lasagne",
		Description: "Lasagne med kjøttdeig",
		URL:         "https://meny.no/oppskrifter/Pasta/Lasagne/hjemmelaget-lasagne/",
		Time:        65,
		Difficulty:  2,
	},
	{
		Name:        "Pizza",
		Description: "Pizza med kjøttdeig",
		URL:         "https://www.tine.no/oppskrifter/middag-og-hovedretter/pizza-og-pai/pizza-med-kj%C3%B8ttdeig",
		Time:        45,
		Difficulty:  2,
	},
}
