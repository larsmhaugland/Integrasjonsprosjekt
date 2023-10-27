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

	"github.com/rs/cors"

	"github.com/google/uuid"
	socketio "github.com/googollee/go-socket.io"
)

func main() {

	httpsFlag := flag.Bool("https", false, "Enable HTTPS")
	flag.Parse()
	socketServer := Socket.InitSocketIOServer()
	if *httpsFlag {
		startHTTPSserver(socketServer)
	} else {
		startHTTPserver(socketServer)
	}

}

func startHTTPserver(socketServer *socketio.Server) {
	server := &http.Server{
		Addr: ":8080",
	}

	Firebase.InitCache()
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { return })
	http.HandleFunc("/stats/", statsHandler)
	http.HandleFunc("/image/", ImageHandler)
	http.HandleFunc("/group/", API.GroupBaseHandler)
	http.HandleFunc("/user/", API.UserBaseHandler)
	http.HandleFunc("/recipe/", API.RecipeBaseHandler)
	http.HandleFunc("/shopping/", API.ShoppingBaseHandler)
	http.HandleFunc("/chat/", API.ChatBaseHandler)

	// Cors for websocket server
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"https://10.212.174.249"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	})

	// Start the socket server
	http.Handle("/socket.io/", c.Handler(socketServer))
	log.Println("Socket IO server url: ")

	// Start HTTP server
	log.Println("Starting HTTP server on port 8080 ...")
	log.Fatal(server.ListenAndServe())
}

func startHTTPSserver(socketServer *socketio.Server) {
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
	http.HandleFunc("/stats/", statsHandler)
	http.HandleFunc("/image/", ImageHandler)
	http.HandleFunc("/group/", API.GroupBaseHandler)
	http.HandleFunc("/user/", API.UserBaseHandler)
	http.HandleFunc("/recipe/", API.RecipeBaseHandler)
	http.HandleFunc("/shopping/", API.ShoppingBaseHandler)
	http.HandleFunc("/chat/", API.ChatBaseHandler)

	// Cors for websocket server
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"https://10.212.174.249"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	})
	// Start the socket server
	http.Handle("/socket.io/", c.Handler(socketServer))

	// Start HTTP server
	log.Println("Starting HTTPS server on port 8080 ...")
	log.Fatal(server.ListenAndServeTLS("", ""))
}

// Tenker det hadde vært gøy å ha statistikk over hvor mye de forskjellige endpointsene blir brukt og antall cache hits/misses ellerno
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

func ImageHandler(w http.ResponseWriter, r *http.Request) {
	API.SetCORSHeaders(w)
	origin := r.Host
	ImagePath := "/Images/"
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
	id, err := generateUniqueID()
	if err != nil {
		log.Println("Error generating unique DocumentID: ", err)
		http.Error(w, "Error generating unique DocumentID", http.StatusInternalServerError)
		return
	}

	// Create a new file on the server to save the uploaded file
	uploadedFile, err := os.Create(ImagePath + id + ".jpeg") // Specify the desired file name
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
	response := map[string]interface{}{
		"filename": id,
	}
	w.WriteHeader(http.StatusOK)
	err = API.EncodeJSONBody(w, r, response)
	if err != nil {
		log.Println("Error encoding response: ", err)
		http.Error(w, "Error while encoding response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("File uploaded successfully: ", id)
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
		return "", fmt.Errorf("Generated DocumentID is too short")
	}

	// Return the first 10 characters of the UUID as the unique DocumentID
	return uniqueIDStr[:10], nil
}
