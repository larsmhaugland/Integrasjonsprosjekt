package API

import (
	"net/http"
	"strings"
)

func GroupBaseHandler(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) != 4 {
		http.Error(w, "Error; Incorrect usage of URL.", http.StatusBadRequest)
		return
	}
	switch parts[3] {
	case "members":
		GroupMemberBaseHandler(w, r)
		break
	case "recipes":
		GroupRecipeBaseHandler(w, r)
		break
	case "schedule":
		GroupScheduleBaseHandler(w, r)
		break
	case "shopping":
		GroupShoppingBaseHandler(w, r)
		break
	case "new":
		GroupNewHandler(w, r)
		break
	default:
		http.Error(w, "Error; Endpoint not supported", http.StatusBadRequest)
		return
	}
}

func GroupNewHandler(w http.ResponseWriter, r *http.Request) {
	//Return if CORS preflight
	if r.Method == http.MethodOptions {
		return
	}
	//Check if user is logged in
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupMemberBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupMemberGetHandler(w, r)
		break
	case http.MethodPost:
		GroupMemberPostHandler(w, r)
		break
	case http.MethodDelete:
		GroupMemberDeleteHandler(w, r)
		break
	case http.MethodPatch:
		GroupMemberPatchHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func GroupMemberPatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupMemberDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupMemberPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupMemberGetHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupRecipeBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupRecipeGetHandler(w, r)
		break
	case http.MethodPost:
		GroupRecipePostHandler(w, r)
		break
	case http.MethodDelete:
		GroupRecipeDeleteHandler(w, r)
		break
	case http.MethodPatch:
		GroupRecipePatchHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func GroupRecipeGetHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupRecipePostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupRecipeDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupRecipePatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupScheduleBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupScheduleGetHandler(w, r)
		break
	case http.MethodPost:
		GroupSchedulePostHandler(w, r)
		break
	case http.MethodDelete:
		GroupScheduleDeleteHandler(w, r)
		break
	case http.MethodPatch:
		GroupSchedulePatchHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func GroupScheduleGetHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupSchedulePostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupScheduleDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupSchedulePatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupShoppingBaseHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GroupShoppingGetHandler(w, r)
		break
	case http.MethodPost:
		GroupShoppingPostHandler(w, r)
		break
	case http.MethodDelete:
		GroupShoppingDeleteHandler(w, r)
		break
	case http.MethodPatch:
		GroupShoppingPatchHandler(w, r)
		break
	case http.MethodOptions: // For CORS
		return
	default:
		http.Error(w, "Error; Method not supported", http.StatusBadRequest)
		return
	}
}

func GroupShoppingGetHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupShoppingPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupShoppingDeleteHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

func GroupShoppingPatchHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}
