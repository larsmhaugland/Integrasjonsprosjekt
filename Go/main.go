// Description: This file is the main entry point for our application.
// It is resposnible for starting the HTTPS or HTTP sever and setting up the endpoints.
package main

import (
	"crypto/tls"
	"encoding/json"

	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"prog-2052/API"
	"prog-2052/Firebase"
	"prog-2052/Socket"

	"github.com/google/uuid"
)

// Main function
func main() {

	// Start either the HTTP or HTTPS sever based on the flag
	httpsFlag := flag.Bool("https", false, "Enable HTTPS")
	flag.Parse()
	if *httpsFlag {
		startHTTPSserver()
	} else {
		startHTTPserver()
	}
}

// StartHTTPserver initializes the chache, sets up the endpoints and starts the server.
func startHTTPserver() {
	server := &http.Server{
		Addr: ":8080",
	}

	Firebase.InitCache()

	// Set up endpoints
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { return })
	http.HandleFunc("/stats/", statsHandler)
	http.HandleFunc("/image/", ImageHandler)
	http.HandleFunc("/group/", API.GroupBaseHandler)
	http.HandleFunc("/user/", API.UserBaseHandler)
	http.HandleFunc("/recipe/", API.RecipeBaseHandler)
	http.HandleFunc("/shopping/", API.ShoppingBaseHandler)
	http.HandleFunc("/chat/", API.ChatBaseHandler)
	http.HandleFunc("/ws", Socket.WebSocketHandler)
	log.Println("Websocket endpoint set up")
	http.HandleFunc("/clear/", clearCacheHandler)

	// Start HTTP server
	log.Println("Starting HTTP server on port 8080 ...")
	log.Fatal(server.ListenAndServe())
}

// startHTTPSserver initializes the chache, sets up the endpoints and starts the server.
// It also sets up the HTTPS certificates.
func startHTTPSserver() {
	certFile := "HTTPS/server.crt"
	keyFile := "HTTPS/server.key"

	server := &http.Server{
		Addr: ":8080",
		TLSConfig: &tls.Config{
			Certificates: []tls.Certificate{},
		},
	}

	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		log.Fatal(err)
	}

	server.TLSConfig.Certificates = []tls.Certificate{cert}

	Firebase.InitCache()

	// Set up endpoints
	http.HandleFunc("/stats/", statsHandler)
	http.HandleFunc("/image/", ImageHandler)
	http.HandleFunc("/group/", API.GroupBaseHandler)
	http.HandleFunc("/user/", API.UserBaseHandler)
	http.HandleFunc("/recipe/", API.RecipeBaseHandler)
	http.HandleFunc("/shopping/", API.ShoppingBaseHandler)
	http.HandleFunc("/chat/", API.ChatBaseHandler)
	http.HandleFunc("/ws", Socket.WebSocketHandler)
	log.Println("Websocket endpoint set up")
	http.HandleFunc("/clear/", clearCacheHandler)

	// coroutine that runs the chat room cleanup function every 10 minutes
	const timeInterval = 10 // minutes
	go Socket.RunChatRoomCleanup(timeInterval)

	// Start HTTP server
	log.Println("Starting HTTPS server on port 8080 ...")
	log.Fatal(server.ListenAndServeTLS("", ""))
}

// clearCacheHandler clears the cache and returns a 200 OK response
func clearCacheHandler(w http.ResponseWriter, r *http.Request) {
	API.SetCORSHeaders(w)
	Firebase.InitCache()
	w.WriteHeader(http.StatusOK)
	log.Println("Cache cleared")
}

// statsHandler returns a JSON object with the current cache statistics
func statsHandler(w http.ResponseWriter, r *http.Request) {
	API.SetCORSHeaders(w)
	stats := map[string]interface{}{
		"numGroups":    len(Firebase.GroupCache),
		"numUsers":     len(Firebase.UserCache),
		"numRecipes":   len(Firebase.RecipeCache),
		"numShopping":  len(Firebase.ShoppingCache),
		"numCacheHits": Firebase.CacheHits,
		"numCacheMiss": Firebase.CacheMisses,
	}
	//Formats in a pretty format
	output, err := json.MarshalIndent(stats, "", " ")
	if err != nil {
		http.Error(w, "Error during pretty printing", http.StatusInternalServerError)
		return
	}
	_, err = fmt.Fprintf(w, "%v", string(output))
	if err != nil {
		http.Error(w, "Error during writing output", http.StatusInternalServerError)
		return
	}
}

// ImageHandler handles the image upload and returns a response with the filename of the uploaded image
func ImageHandler(w http.ResponseWriter, r *http.Request) {
	API.SetCORSHeaders(w)
	//If filename is specified, it is at the end of the path
	filename := r.URL.Path[len("/image/"):]

	//Set path based on if request coming from localhost or not
	origin := r.Host
	ImagePath := "/UsrImages/"
	if origin == "localhost:8080" {
		ImagePath = "../Webserver/Images/"
	}
	// Check if the request is a POST request
	if r.Method != http.MethodPost && r.Method != http.MethodOptions && r.Method != http.MethodGet {
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	} else if r.Method == http.MethodOptions || r.Method == http.MethodGet {
		return
	}

	// Parse the uploaded file
	file, _, err := r.FormFile("file") // "file" is the name of the file input field in the request
	if err != nil {
		log.Println("Error retrieving file from form data: ", err)
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()
	// Generate a unique DocumentID for the uploaded file if name is not specified
	if filename == "" {
		filename, err = generateUniqueID()
		if err != nil {
			log.Println("Error generating unique DocumentID: ", err)
			http.Error(w, "Error generating unique DocumentID", http.StatusInternalServerError)
			return
		}
	}
	// Create a new file on the server to save the uploaded file
	uploadedFile, err := os.Create(ImagePath + filename + ".jpeg") // Specify the desired file name
	if err != nil {
		log.Println("Error creating file: ", err)
		http.Error(w, "Unable to create the file for writing", http.StatusInternalServerError)
		return
	}
	defer uploadedFile.Close()

	// Copy the uploaded file to the new file on the server
	_, err = io.Copy(uploadedFile, file)
	if err != nil {
		log.Println("Error copying file: ", err)
		http.Error(w, "Unable to copy file", http.StatusInternalServerError)
		return
	}
	//Construct response
	response := map[string]interface{}{
		"filename": filename,
	}
	w.WriteHeader(http.StatusOK)
	err = API.EncodeJSONBody(w, r, response)
	if err != nil {
		log.Println("Error encoding response: ", err)
		http.Error(w, "Error while encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}

}

// generateUniqueID generates a unique ID for the filename of the uploaded image
func generateUniqueID() (string, error) {
	// Generate a new UUID
	uniqueID, err := uuid.NewUUID()
	if err != nil {
		return "", err
	}

	// Convert the UUID to a string with a specific length (e.g., 10 characters)
	uniqueIDStr := uniqueID.String()
	if len(uniqueIDStr) < 10 {
		return "", fmt.Errorf("Generated DocumentID is too short")
	}

	// Return the first 10 characters of the UUID as the unique DocumentID
	return uniqueIDStr[:10], nil
}
