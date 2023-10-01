package API

import (
	"fmt"
	"github.com/google/uuid"
	"io"
	"net/http"
	"os"
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
			if len(parts) == 2 {
				RecipePostHandler(w, r)
			} else if parts[2] == "image" {
				RecipeImageHandler(w, r)
			} else {
				http.Error(w, "Error; Invalid URL", http.StatusBadRequest)
			}
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
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err = Firebase.DeleteRecipe(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipePatchHandler(w http.ResponseWriter, r *http.Request) {
	var recipe Firebase.Recipe
	err := DecodeJSONBody(w, r, &recipe)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err = Firebase.PatchCacheRecipe(recipe)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipeGetHandler(w http.ResponseWriter, r *http.Request) {
	var recipe Firebase.Recipe
	err := DecodeJSONBody(w, r, &recipe)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	data, err := Firebase.ReturnCacheRecipe(recipe.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = EncodeJSONBody(w, r, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	user, err := Firebase.GetUserData(data.Owner)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, err := Firebase.AddRecipe(data.Recipe, data.Groups, user.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = EncodeJSONBody(w, r, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func RecipeImageHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the uploaded file
	file, _, err := r.FormFile("file") // "file" is the name of the file input field in the request
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()
	id, err := generateUniqueID()
	if err != nil {
		http.Error(w, "Error generating unique ID", http.StatusInternalServerError)
		return
	}
	// Create a new file on the server to save the uploaded file
	uploadedFile, err := os.Create("/Images/" + id + ".jpeg") // Specify the desired file name
	if err != nil {
		http.Error(w, "Unable to create the file for writing", http.StatusInternalServerError)
		return
	}
	defer uploadedFile.Close()

	// Copy the uploaded file to the new file on the server
	_, err = io.Copy(uploadedFile, file)
	if err != nil {
		http.Error(w, "Unable to copy file", http.StatusInternalServerError)
		return
	}

	err = EncodeJSONBody(w, r, id)
	if err != nil {
		http.Error(w, "Error while encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func generateUniqueID() (string, error) {
	// Generate a new UUID
	uniqueID, err := uuid.NewUUID()
	if err != nil {
		return "", err
	}

	// Convert the UUID to a string with a specific length (e.g., 10 characters)
	uniqueIDStr := uniqueID.String()
	if len(uniqueIDStr) < 10 {
		return "", fmt.Errorf("Generated ID is too short")
	}

	// Return the first 10 characters of the UUID as the unique ID
	return uniqueIDStr[:10], nil
}
