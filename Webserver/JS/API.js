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
            console.log("SUCCESS");
            const data = await response.json();

            for (let i = 0; i < data.length; i++) {
                Recipes.push(data[i]);
            }
            console.log(Recipes);
        } else {
            console.log("Error when fetching recipes");
        }
    } catch (error) {
        console.log("Error when fetching recipes");
        console.log(error);
    }
    console.log("FERDIG");
}

function retrieveGroups(){

    //if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");


    fetch(API_IP + `/user/groups?username=${userName}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        if (response.status === 200){
            console.log("Groups retrieved");
            return response.json();
        } else {
            console.log("Error retrieving groups");
            throw new Error("Failed to retrieve groups");
        }
    }).then(data=>{
        sessionStorage.setItem("groups", JSON.stringify(data));
    })
    .catch(error => {
        console.log("Error retrieving groups: " + error);
    });

}



