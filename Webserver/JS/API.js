/**
 * @file API.js
 * @brief API.js contains some of the functions that send requests to the backend API.
 */

/* jshint esversion: 8 */
/* jshint loopfunc: true */

/**
 * getRecipes - Fetches all the recipes that the user has access to.
 * @param {*} Recipes - Array to store the recipes in
 * @returns {void}
 */
async function getRecipes(Recipes) {
    let username = sessionStorage.getItem("username");
    try {
        // API call to get all the recipes that the user has access to
        const response = await fetch(API_IP + "/recipe/" + username + "?groups=true", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        // If the response is OK, add the recipes to the Recipes array
        if (response.status === 200) {
            const data = await response.json();
            // If the user has any personal recipes, add them to the Recipes array
            if (data.userRecipes  !== null) {
                for (let i = 0; i < data.userRecipes.length; i++) {
                    Recipes.push(data.userRecipes[i]);
                }
            }
            // If the user is a member of any groups, add the group recipes to the Recipes array
            if (data.groupRecipes !== null) {
                for (let i = 0; i < data.groupRecipes.length; i++) {
                    Recipes.push(data.groupRecipes[i]);
                }
            }
        } else {
            console.log("Error when fetching recipes");
        }
    } catch (error) {
        console.log("Error when fetching recipes");
        console.log(error);
    }
}

/**
 * retreiveGroups - Fetches all the groups that the user is a member of.
 * @returns {void}
 */
async function retrieveGroups(){

    let userName = sessionStorage.getItem("username");

    // API call to get all the groups that the user is a member of
    const response = await fetch(API_IP + `/user/groups?username=${userName}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    // If the response is OK, add the groups to the sessionStorage
    if (response.status === 200){
        const data = await response.json();
        sessionStorage.setItem("groups", JSON.stringify(data));
    } else {
        console.log("Error retrieving groups");
        throw new Error("Failed to retrieve groups");
    }
}

/**
 * uploadImage - uploads a image to the backend
 * @param {*} file - ID of the file to upload
 * @returns {string} - filename of the uploaded image
 */
async function uploadImage(file) {
    // Create formdata object
    let formData = new FormData();
    formData.append("file", file);

    // API call to upload the image
    const response_remote = await fetch(API_REMOTE + "/image/" , {
        method: "POST",
        body: formData
    }).then(response => {
        if (response.status === 200) {
        } else {
            console.log("Error uploading image");
        }
        return response.json();
    }).catch(error => {
        console.log(error);
    });

    // If the the response from the remote API is null, return null
    if (!response_remote.filename) {
        return null;
    }

    // If the API_IP is not the same as the API_REMOTE, upload the image to the local API as well
    if(API_IP !== API_REMOTE) {
        await fetch(API_LOCAL + "/image/" + response_remote.filename, {
            method: "POST",
            body: formData
        }).then(response => {
            if (response.status === 200) {
            } else {
                console.log("Error uploading image");
            }
            return response.json();
        }).catch(error => {
            console.log(error);
        });
    }


    return response_remote.filename;
}