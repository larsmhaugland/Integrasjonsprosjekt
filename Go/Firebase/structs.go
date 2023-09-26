package Firebase

import (
	"time"
)

type Recipe struct {
	ID           string                       `json:"id"`
	Name         string                       `json:"name"`
	Time         int                          `json:"time"`
	Picture      string                       `json:"picture"`
	Description  string                       `json:"description"`
	URL          string                       `json:"URL"`
	Ingredients  map[string]map[string]string `json:"ingredients"`
	Instructions []string                     `json:"instructions"`
	Categories   []string                     `json:"categories"`
	Portions     int                          `json:"portions"`
}

type User struct {
	ID            string   `json:"id"`
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	Groups        []string `json:"groups"`
	ShoppingLists []string `json:"shoppingLists"`
	Recipes       []string `json:"recipes"`
}

type Dinner struct {
	Recipe      string   `json:"recipe"`
	Responsible []string `json:"responsible"`
}

type Group struct {
	ID           string            `json:"id"`
	Members      []string          `json:"members"`
	Owner        string            `json:"owner"`
	Name         string            `json:"name"`
	Recipes      []string          `json:"recipes"`
	Schedule     map[string]Dinner `json:"schedule"`
	ShoppingList []string          `json:"shoppingList"`
}

type ShoppingListItem struct {
	Complete bool   `json:"complete"`
	Name     string `json:"item"`
	Quantity int    `json:"quantity"`
}

type ShoppingList struct {
	ID        string                      `json:"id"`
	Assignees []string                    `json:"assignees"`
	Items     map[string]ShoppingListItem `json:"items"`
	Shop      string                      `json:"shop"`
}

type CacheData struct {
	Data     interface{}
	cachedAt time.Time
}
