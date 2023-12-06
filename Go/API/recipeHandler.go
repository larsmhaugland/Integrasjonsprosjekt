package API

import (
	"log"
	"net/http"
	"os"
	"prog-2052/Firebase"
	"strings"
	"time"
)

func SetCORSHeaders(w http.ResponseWriter) {
	// Allow requests from any origin
	// TODO ADD only DEV and PROD docker for use
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
			if parts[len(parts)-1] == "categories" {
				RecipeCategoriesHandler(w, r)
				break
			}
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

func RecipeCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	type Output struct {
		Exclusive map[string]map[string]string `json:"exclusive"`
		Inclusive []string                     `json:"categories"`
		Allergens []string                     `json:"allergies"`
	}
	var output Output
	output.Exclusive = make(map[string]map[string]string)
	//Add categories to response
	output.Allergens = []string{"Gluten", "Laktose", "Nøtter", "Egg", "Fisk", "Skalldyr", "Soya", "Sennep", "Selleri", "Sesamfrø", "Sulfitt", "Bløtdyr", "Peanøtter"}
	output.Inclusive = []string{"Glutenfri", "Laktosefri", "Halal", "Kosher", "Kylling", "Fisk", "Svin", "Storfekjøtt"}
	output.Exclusive["Måltid"] = map[string]string{
		"Frokost":   "Frokost",
		"Lunsj":     "Lunsj",
		"Middag":    "Middag",
		"Kveldsmat": "Kveldsmat",
	}
	output.Exclusive["Type"] = map[string]string{
		"Kjøtt":   "Kjøtt",
		"Fisk":    "Fisk",
		"Vegetar": "Vegetar",
		"Vegan":   "Vegan",
	}
	//More categories could be added here

	//Encode response
	err := EncodeJSONBody(w, r, output)
	if err != nil {
		http.Error(w, "Error when encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipeDeleteHandler(w http.ResponseWriter, r *http.Request) {

	var user Firebase.User
	err := DecodeJSONBody(w, r, &user)
	if err != nil {
		http.Error(w, "Error when decoding request DELETE: "+err.Error(), http.StatusBadRequest)
		return
	}
	recipeID := strings.Split(r.URL.Path, "/")[len(strings.Split(r.URL.Path, "/"))-1]
	if recipeID == "" {
		http.Error(w, "Error; No id provided", http.StatusBadRequest)
		return
	}
	//Get recipe from cache
	recipe, err := Firebase.ReturnCacheRecipe(recipeID)
	if err != nil {
		http.Error(w, "Error when fetching recipe: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Set path based on if request coming from localhost or not
	ImagePath := "/UsrImages/"
	if recipe.Image != "" {
		if r.Host == "localhost:8080" {
			ImagePath = "../Webserver/Images/"
		}
		//Remove recipe image from storage
		err = os.Remove(ImagePath + recipe.Image + ".jpeg")
		if err != nil {
			http.Error(w, "Error when deleting image: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
	//Get user from cache
	user, err = Firebase.ReturnCacheUser(user.Username)
	if err != nil {
		http.Error(w, "Error when fetching user: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Search for recipe in user
	index := -1
	for i, rID := range user.Recipes {
		if rID == recipeID {
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
	for _, groupID := range user.Groups {
		group, err := Firebase.ReturnCacheGroup(groupID)
		if err != nil {
			http.Error(w, "Error when fetching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
		//If recipe is found, remove it from group
		if ok := group.Recipes[recipeID]; ok != (Firebase.GroupRecipe{}) {
			delete(group.Recipes, recipeID)
			err = Firebase.PatchCacheGroup(group)
			if err != nil {
				http.Error(w, "Error when patching group: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}
	//Remove recipe from firebase
	err = Firebase.DeleteCacheRecipe(recipeID)
	if err != nil {
		http.Error(w, "Error when deleting recipe: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipePatchHandler(w http.ResponseWriter, r *http.Request) {
	var recipe Firebase.Recipe
	//Get recipe id from path
	docID := strings.Split(r.URL.Path, "/")[len(strings.Split(r.URL.Path, "/"))-1]
	//Decode request body
	err := DecodeJSONBody(w, r, &recipe)
	recipe.DocumentID = docID
	if err != nil {
		http.Error(w, "Error when decoding request PATCH: "+err.Error(), http.StatusBadRequest)
		return
	}
	//Patch recipe in firebase
	err = Firebase.PatchCacheRecipe(recipe)
	if err != nil {
		http.Error(w, "Error when patching DB: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipeGetHandler(w http.ResponseWriter, r *http.Request) {

	groupQ := r.URL.Query().Get("group")  //If recipes in a group should be returned
	single := r.URL.Query().Get("single") //If there should only be one recipe in the response
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
	//Define output struct
	type outuput struct {
		UserRecipes    []Firebase.Recipe `json:"userRecipes"`
		GroupRecipes   []Firebase.Recipe `json:"groupRecipes"`
		ExampleRecipes []Firebase.Recipe `json:"exampleRecipes"`
	}

	var recipes outuput
	//Get user from cache
	user, err := Firebase.ReturnCacheUser(storedIn)
	if err != nil {
		http.Error(w, "Error when fetching user: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Get recipes from cache
	for _, recipeID := range user.Recipes {
		recipe, err := Firebase.ReturnCacheRecipe(recipeID)
		if err != nil {
			log.Println("Error when fetching recipe: " + err.Error())
		}
		recipes.UserRecipes = append(recipes.UserRecipes, recipe)
	}
	//If a groups recipes are requested, get them from cache
	if groupQ == "true" {
		//Get group from cache
		g, err := Firebase.ReturnCacheGroup(storedIn)
		if err != nil {
			http.Error(w, "Error when fetching group: "+err.Error(), http.StatusInternalServerError)
			return
		}
		//Get recipes from cache
		for recipeID := range g.Recipes {
			recipe, err := Firebase.ReturnCacheRecipe(recipeID)
			if err != nil {
				log.Println("Error when fetching recipe: " + err.Error())
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
	//Add recipe to firebase
	id, err := Firebase.AddRecipe(data.Recipe)
	if err != nil {
		http.Error(w, "Error when adding recipe to firebase: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Get user from cache
	user, err := Firebase.GetUserData(data.Owner)
	if err != nil {
		http.Error(w, "Error when fetching user data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Check if recipe already exists in user
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
	//Update user
	user.Recipes = append(user.Recipes, id)
	err = Firebase.PatchCacheUser(user)
	if err != nil {
		http.Error(w, "Error when patching user: "+err.Error(), http.StatusInternalServerError)
		return
	}
	//Add recipe to groups
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
		//If recipes map is nil, create it
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

// ExampleRecipes is a list of recipes that are used as examples in the app
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
