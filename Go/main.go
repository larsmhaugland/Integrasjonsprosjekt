package main

import (
	"crypto/tls"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/google/uuid"
	"io"
	"log"
	"net/http"
	"os"
	"prog-2052/API"
	"prog-2052/Firebase"
)

func main() {

	httpsFlag := flag.Bool("https", false, "Enable HTTPS")
	flag.Parse()
	if *httpsFlag {
		startHTTPSserver()
	} else {
		startHTTPserver()
	}

}

func startHTTPserver() {
	server := &http.Server{
		Addr: ":8080",
	}

	Firebase.InitCache()
	http.HandleFunc("/stats/", statsHandler)
	http.HandleFunc("/group/", API.GroupBaseHandler)
	http.HandleFunc("/user/", API.UserBaseHandler)
	http.HandleFunc("/recipe/", API.RecipeBaseHandler)
	http.HandleFunc("/shopping/", API.ShoppingBaseHandler)

	// Start HTTP server
	log.Println("Starting HTTP server on port 8080 ...")
	log.Fatal(server.ListenAndServe())
}

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
	http.HandleFunc("/stats/", statsHandler)
	http.HandleFunc("/image/", ImageHandler)
	http.HandleFunc("/group/", API.GroupBaseHandler)
	http.HandleFunc("/user/", API.UserBaseHandler)
	http.HandleFunc("/recipe/", API.RecipeBaseHandler)
	http.HandleFunc("/shopping/", API.ShoppingBaseHandler)

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
		"numShopping":  0,
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
	if r.Method != http.MethodPost {
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
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

	err = API.EncodeJSONBody(w, r, id)
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
