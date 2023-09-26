package API

import "net/http"

func ShoppingBaseHandler(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	switch r.Method {
	case http.MethodGet:
		ShoppingGetHandler(w, r)
		break
	case http.MethodPost:
		ShoppingPostHandler(w, r)
		break
	case http.MethodDelete:
		ShoppingDeleteHandler(w, r)
		break
	case http.MethodPatch:
		ShoppingPatchHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func ShoppingGetHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func ShoppingPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func ShoppingDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func ShoppingPatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
