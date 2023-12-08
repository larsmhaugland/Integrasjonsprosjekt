package Firebase

import (
	"time"
)

// Recipe is a struct that represents a recipe in the database with all it's data fields.
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

// User is a struct that represents a user in the database with all it's data fields.
type User struct {
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	Groups        []string `json:"groups"`
	ShoppingLists []string `json:"shopping-lists"`
	Recipes       []string `json:"recipes"`
	Chats         []string `json:"chats"`
	Name          string   `json:"name"`
	DocumentID    string   `json:"documentID"`
}

// Dinner is a struct that represents a dinner in the database with all it's data fields.
type Dinner struct {
	CustomRecipe string   `json:"customRecipe"`
	Recipe       string   `json:"recipe"`
	Responsible  []string `json:"responsible"`
}

// GroupRecipe is a struct that represents a recipe in a group in the database with all it's data fields.
type GroupRecipe struct {
	LastEaten time.Time `json:"lastEaten"`
	Owner     string    `json:"owner"`
}

// Group is a struct that represents a group in the database with all it's data fields.
type Group struct {
	DocumentID    string                 `json:"documentID"`
	Members       map[string]string      `json:"members"`
	Owner         string                 `json:"owner"`
	Name          string                 `json:"name"`
	Recipes       map[string]GroupRecipe `json:"recipes"`
	Schedule      map[string]Dinner      `json:"schedule"`
	ShoppingLists []string               `json:"shopping-lists"`
	Chat          string                 `json:"chat"`
	Image         string                 `json:"image"`
}

// TODO comment this
type ShoppingListItem struct {
	Complete bool   `json:"complete"`
	Quantity string `json:"quantity"`
	Category string `json:"category"` //Kun hvis vi vil gjøre kategoriseringen i backend
}

// TODO comment this
type ShoppingList struct {
	DocumentID string                      `json:"documentID"`
	Assignees  []string                    `json:"assignees"`
	List       map[string]ShoppingListItem `json:"list"`
}

// CacheData is a struct for the data in cache
type CacheData struct {
	Data     interface{}
	cachedAt time.Time
}

// AddGroupMember is used when adding members to a group.
type AddGroupMember struct {
	Username string `json:"username"`
	GroupID  string `json:"groupID"`
}

// GroupMemberNameRole is used when getting members of a group,
// to get both the username and rolename as individual strings
type GroupMemberNameRole struct {
	Username string `json:"username"`
	Rolename string `json:"roleName"`
}

// Message is a struct that represents a message in a chat.
type Message struct {
	Content   string    `json:"content"`
	Sender    string    `json:"sender"`
	Timestamp time.Time `json:"timestamp"`
}

// NewMemberChat is a struct that represents a new member in a chat.
type NewMemberChat struct {
	Username string `json:"username"`
}

// Chat is a struct that represents a chat in the database with all it's data fields.
type Chat struct {
	Name       string    `json:"name"`
	Messages   []Message `json:"messages"`
	Members    []string  `json:"members"`
	ChatOwner  string    `json:"chatOwner"`
	DocumentID string    `json:"documentID"`
}

type RemoveMembersFromChat struct {
	ChatID    string   `json:"chatID"`
	Usernames []string `json:"usernames"`
}
