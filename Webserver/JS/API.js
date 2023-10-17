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
            if (data["userRecipes"] !== null) {
                for (let i = 0; i < data["userRecipes"].length; i++) {
                    Recipes.push(data["userRecipes"][i]);
                }
            }
            if (data["groupRecipes"] !== null) {
                for (let i = 0; i < data["groupRecipes"].length; i++) {
                    Recipes.push(data["groupRecipes"][i]);
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



