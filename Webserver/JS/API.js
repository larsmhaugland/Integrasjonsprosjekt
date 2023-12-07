/* jshint esversion: 8 */

async function getRecipes(Recipes) {
    let username = sessionStorage.getItem("username");
    //if(!checkAuthToken()) return;
    try {
        const response = await fetch(API_IP + "/recipe/" + username + "?groups=true", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 200) {
            const data = await response.json();
            if (data.userRecipes  !== null) {
                for (let i = 0; i < data.userRecipes.length; i++) {
                    //Recipes.push(data["userRecipes"][i]);
                    Recipes.push(data.userRecipes[i]);
                }
            }
            if (data.groupRecipes !== null) {
                for (let i = 0; i < data.groupRecipes.length; i++) {
                    //Recipes.push(data["groupRecipes"][i]);
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

async function retrieveGroups(){

    //if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");


    const response = await fetch(API_IP + `/user/groups?username=${userName}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.status === 200){
        const data = await response.json();
        sessionStorage.setItem("groups", JSON.stringify(data));
        console.log("Groups retrieved");
    } else {
        console.log("Error retrieving groups");
        throw new Error("Failed to retrieve groups");
    }
}


async function uploadImage(file) {
    //Create formdata object
    let formData = new FormData();
    formData.append("file", file);

    const response_remote = await fetch(API_REMOTE + "/image/" , {
        method: "POST",
        body: formData
    }).then(response => {
        if (response.status === 200) {
            console.log("Image uploaded");
        } else {
            console.log("Error uploading image");
        }
        console.log(response);
        return response.json();
    }).catch(error => {
        console.log(error);
    });

    if (!response_remote.filename) {
        return null;
    }

    if(API_IP !== API_REMOTE) {
        await fetch(API_LOCAL + "/image/" + response_remote.filename, {
            method: "POST",
            body: formData
        }).then(response => {
            if (response.status === 200) {
                console.log("Image uploaded");
            } else {
                console.log("Error uploading image");
            }
            console.log(response);
            return response.json();
        }).catch(error => {
            console.log(error);
        });
    }


    return response_remote.filename;
}