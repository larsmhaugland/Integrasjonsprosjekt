package main

import (
	"log"
	"net/http"
	"prog-2052/API"
	"prog-2052/Firebase"
)

/*
func main() {

	certFile := "HTTPS/client.crt"
	keyFile := "HTTPS/client.key"

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
	log.Println("Starting server on port 8080 ...")
	log.Fatal(server.ListenAndServeTLS("", ""))
}*/

func main() {

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
	log.Println("Starting server on port 8080 ...")
	log.Fatal(server.ListenAndServe())
}

// Tenker det hadde vært gøy å ha statistikk over hvor mye de forskjellige endpointsene blir brukt og antall cache hits/misses ellerno
func statsHandler(w http.ResponseWriter, r *http.Request) {
	API.SetCORSHeaders(w)
	type stats struct {
		numGroups   int
		numUsers    int
		numRecipes  int
		numShopping int
	}
	//cacheTest 2
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
