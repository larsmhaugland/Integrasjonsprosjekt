package Firebase

import (
	"time"
)

type Recipe struct {
	DocumentID   string            `json:"documentID"`
	Name         string            `json:"name"`
	Time         int               `json:"time"`
	Description  string            `json:"description"`
	Difficulty   int               `json:"difficulty"`
	URL          string            `json:"URL"`
	Ingredients  map[string]string `json:"ingredients"`
	Instructions []string          `json:"instructions"`
	Categories   []string          `json:"categories"`
	Portions     int               `json:"portions"`
	Group        string            `json:"group"`
	Image        string            `json:"image"`
}

type User struct {
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	Groups        []string `json:"groups"`
	ShoppingLists []string `json:"shopping-lists"`
	Recipes       []string `json:"recipes"`
	Name          string   `json:"name"`
	DocumentID    string   `json:"documentID"`
}

type Dinner struct {
	Recipe      string   `json:"recipe"`
	Responsible []string `json:"responsible"`
}

type GroupRecipe struct {
	LastEaten time.Time `json:"lastEaten"`
	Owner     string    `json:"owner"`
}

type Group struct {
	DocumentID    string                 `json:"documentID"`
	Members       map[string]string      `json:"members"`
	Owner         string                 `json:"owner"`
	Name          string                 `json:"name"`
	Recipes       map[string]GroupRecipe `json:"recipes"`
	Schedule      map[string]Dinner      `json:"schedule"`
	ShoppingLists []string               `json:"shopping-lists"`
}

type ShoppingListItem struct {
	Complete bool   `json:"complete"`
	Quantity string `json:"quantity"`
	Category string `json:"category"` //Kun hvis vi vil gjøre kategoriseringen i backend
}

type ShoppingList struct {
	DocumentID string                      `json:"documentID"`
	Assignees  []string                    `json:"assignees"`
	List       map[string]ShoppingListItem `json:"list"`
}

type CacheData struct {
	Data     interface{}
	cachedAt time.Time
}

type AddGroupMember struct {
	Username string `json:"username"`
	GroupID  string `json:"groupID"`
}

type GroupMemberNameRole struct {
	Username string `json:"username"`
	Rolename string `json:"roleName"`
}
