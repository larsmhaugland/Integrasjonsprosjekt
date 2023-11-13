package Firebase

import (
	"context"
	"log"
)

// GetAllrecipes returns a slice with Recipe structs with all the recipes in the databse
func GetAllRecipes() ([]Recipe, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return nil, err
	}

	// Declare the slice of recipes and got through all the documents in the recipes collection
	// and add each of them to the recipes slice
	var recipes []Recipe
	iter := client.Collection("recipes").Documents(ctx)
	for {
		var recipe Recipe
		doc, err := iter.Next()
		if err != nil {
			log.Println("Error getting next document:", err)
			break
		}
		err = doc.DataTo(&recipe)
		recipe.DocumentID = doc.Ref.ID
		if err != nil {
			log.Printf("Error converting document {%s}: %s\n", doc.Ref.ID, err)
			break
		}
		recipes = append(recipes, recipe)
	}
	return recipes, nil
}

// AddRecipe adds the specified recipe to the database, and returns the document ID of the recipe.
func AddRecipe(recipe Recipe) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}

	// Create a map with all the necessary recipe data
	data := map[string]interface{}{
		"name":         recipe.Name,
		"time":         recipe.Time,
		"image":        recipe.Image,
		"description":  recipe.Description,
		"difficulty":   recipe.Difficulty,
		"URL":          recipe.URL,
		"ingredients":  recipe.Ingredients,
		"instructions": recipe.Instructions,
		"categories":   recipe.Categories,
		"portions":     recipe.Portions,
	}

	// Add the recipe to the 'recipes' collection in the firestore database
	doc, _, err := client.Collection("recipes").Add(ctx, data)
	if err != nil {
		log.Println("Error adding recipe:", err)
		return "", err
	}

	// return the document ID of the recipe
	return doc.ID, nil
}

// GetRecipeData returns a Recipe struct with the data of the recipe with the specified ID
func GetRecipeData(recipeID string) (Recipe, error) {

	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Recipe{}, err
	}

	// Get the recipe with the specified ID from the firestore database
	var recipe Recipe
	doc, err := client.Collection("recipes").Doc(recipeID).Get(ctx)
	if err != nil {
		log.Println("Error getting recipe:", err)
		return Recipe{}, err
	}

	// Convert the data in the document to a Recipe struct and set the recipe's ID
	err = doc.DataTo(&recipe)
	recipe.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting document:", err)
		return Recipe{}, err
	}

	return recipe, nil
}

// PatchRecipe updates the document in the firestore databse with the new data of the recipe
func PatchRecipe(recipe Recipe) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Create a map with all the necessary recipe data
	data := map[string]interface{}{
		"name":         recipe.Name,
		"time":         recipe.Time,
		"image":        recipe.Image,
		"description":  recipe.Description,
		"difficulty":   recipe.Difficulty,
		"URL":          recipe.URL,
		"ingredients":  recipe.Ingredients,
		"instructions": recipe.Instructions,
		"categories":   recipe.Categories,
		"portions":     recipe.Portions,
	}

	// Set the new data for the specified recipe document
	_, err = client.Collection("recipes").Doc(recipe.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching recipe:", err)
		return err
	}
	return nil
}

// DeleteRecipe deletes the recipe with the specified ID from the firestore database
func DeleteRecipe(recipeID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}

	// Delete the recipe
	_, err = client.Collection("recipes").Doc(recipeID).Delete(ctx)
	if err != nil {
		log.Println("Error deleting recipe:", err)
		return err
	}
	return nil
}
