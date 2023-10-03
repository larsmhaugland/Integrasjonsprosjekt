package main

import (
	"crypto/tls"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
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
