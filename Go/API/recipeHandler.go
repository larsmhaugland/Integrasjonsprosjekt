package API

import (
	"net/http"
	"prog-2052/Firebase"
	"strings"
)

func SetCORSHeaders(w http.ResponseWriter) {
	// Allow requests from any origin
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Allow the GET, POST, PUT, DELETE, OPTIONS methods
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	// Allow the "Content-Type" and "username" header
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, username")

}

func RecipeBaseHandler(w http.ResponseWriter, r *http.Request) {

	parts := strings.Split(r.URL.Path, "/")
	SetCORSHeaders(w)
	if len(parts) >= 3 {
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
			break
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
	var id string
	err := DecodeJSONBody(w, r, &id)
	if err != nil {
		http.Error(w, "Error when decoding request DELETE: "+err.Error(), http.StatusBadRequest)
		return
	}
	err = Firebase.DeleteCacheRecipe(id)
	if err != nil {
		http.Error(w, "Error when deleting recipe: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipePatchHandler(w http.ResponseWriter, r *http.Request) {
	var recipe Firebase.Recipe
	err := DecodeJSONBody(w, r, &recipe)
	if err != nil {
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
	var recipe Firebase.Recipe
	err := DecodeJSONBody(w, r, &recipe)
	if err != nil {
		http.Error(w, "Error when decoding request GET: "+err.Error(), http.StatusBadRequest)
		return
	}
	data, err := Firebase.ReturnCacheRecipe(recipe.ID)
	if err != nil {
		http.Error(w, "Error when fetching recipe from DB: "+err.Error(), http.StatusInternalServerError)
		return
	}
	err = EncodeJSONBody(w, r, data)
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
	user, err := Firebase.GetUserData(data.Owner)
	if err != nil {
		http.Error(w, "Error when fetching user data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	id, err := Firebase.AddRecipe(data.Recipe, data.Groups, user.ID)
	if err != nil {
		http.Error(w, "Error when adding recipe to firebase: "+err.Error(), http.StatusInternalServerError)
		return
	}
	err = EncodeJSONBody(w, r, id)
	if err != nil {
		http.Error(w, "Error when encodingn response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
