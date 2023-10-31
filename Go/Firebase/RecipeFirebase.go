package Firebase

import (
	"context"
	"log"
)

func AddRecipe(recipe Recipe) (string, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return "", err
	}
	//Add recipe to database
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

	//Add recipe to recipes
	doc, _, err := client.Collection("recipes").Add(ctx, data)
	if err != nil {
		log.Println("Error adding recipe:", err)
		return "", err
	}

	return doc.ID, nil
}

func GetRecipeData(recipeID string) (Recipe, error) {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return Recipe{}, err
	}
	var recipe Recipe
	doc, err := client.Collection("recipes").Doc(recipeID).Get(ctx)
	if err != nil {
		log.Println("Error getting recipe:", err)
		return Recipe{}, err
	}
	err = doc.DataTo(&recipe)
	recipe.DocumentID = doc.Ref.ID
	if err != nil {
		log.Println("Error converting document:", err)
		return Recipe{}, err
	}
	return recipe, nil
}

func PatchRecipe(recipe Recipe) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
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
	_, err = client.Collection("recipes").Doc(recipe.DocumentID).Set(ctx, data)
	if err != nil {
		log.Println("Error patching recipe:", err)
		return err
	}
	return nil
}

func DeleteRecipe(recipeID string) error {
	ctx := context.Background()
	client, err := GetFirestoreClient(ctx)
	if err != nil {
		log.Println("error getting Firebase client:", err)
		return err
	}
	_, err = client.Collection("recipes").Doc(recipeID).Delete(ctx)
	if err != nil {
		log.Println("Error deleting recipe:", err)
		return err
	}
	return nil
}
