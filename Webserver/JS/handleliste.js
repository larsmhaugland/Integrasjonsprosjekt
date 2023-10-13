//CALL ON START/RELOAD
retrieveGroups();
retrieveShoppingList();
//retrieveDinnerList();

//EVENT LISTENERS:
//Save the selected option in the dropdown menu to session storage for reloading the page
const dropdown = document.getElementById('group-dropdown');
const selectedOption = sessionStorage.getItem('selectedOption');
if (selectedOption) {
    dropdown.value = selectedOption;
}
dropdown.addEventListener('change', function () {
    const selectedValue = dropdown.value;
    sessionStorage.setItem('selectedOption', selectedValue);
});
window.addEventListener('load', function () {
    const selectedOption = sessionStorage.getItem('selectedOption');
    if (selectedOption) {
        const dropdown = document.getElementById('group-dropdown');
        dropdown.value = selectedOption;
        retrieveShoppingList();
    }
});

//Call addNewItemToList() when the user clicks enter in the input field
let submit = document.querySelector("#newitemtxt");
submit.addEventListener("keydown", (event)=> {
    if (event.
        key === "Enter") {
        addNewItemToList();
        event.preventDefault();
        submit.value = "";
    }
});

//Call removeItemFromList() when checkboxes for items are clicked
//Shopping list
let list = document.querySelector("#shopping-list");
list.addEventListener("click", (event) => {
    if(event.target.id === "checkbox"){
        removeItemFromList();
    }
});
//Finished list
let finishedlist = document.querySelector("#finished-list");
finishedlist.addEventListener("click", (event) => {
    if(event.target.id === "finished-checkbox"){
        removeItemFromList();
    }
});

//Hide display of finished list if checkbox is checked
let hideFinished = document.querySelector("#hide-complete-checkbox");
hideFinished.addEventListener("click", (event) => {
    if(event.target.checked){
        document.querySelector("#finished-list").style.display = "none";
    }else{
        document.querySelector("#finished-list").style.display = "block";
    }});

//FUNCTIONS:
/*
    DISPLAY GROUPS IN DROPDOWN MENU
 */
function displayGroups(groups){
    let dropdown = document.querySelector("#group-dropdown");

    for(let i = 0; i < groups.length; i++){
        let option = document.createElement("option");
        option.value = groups[i].name;
        option.textContent = groups[i].name;
        dropdown.appendChild(option);
    }

    let userName = sessionStorage.getItem("username");
    let option = document.createElement("option");
    option.value = userName;
    option.textContent = userName;
    dropdown.appendChild(option);
}

/*
    RETRIEVE SHOPPING LIST FROM DATABASE
 */
function retrieveShoppingList() {
    //if(!checkAuthToken()) return;
    removeList();
    let option = document.querySelector("#group-dropdown").value;

    if(option === "Velg gruppe..."){
        return;

    }else if(option === sessionStorage.getItem("username")){
        let userName = sessionStorage.getItem("username");
        //TODO: API fetch
        fetch(API_IP + `/shopping/${userName}?userOrGroup=user`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.status === 200){
                console.log("Shopping list retrieved");
                return response.json();
            } else {
                console.log("Error retrieving shopping list");
                throw new Error("Failed to retrieve shopping list");
            }
        }).then(data=>{
            console.log(JSON.stringify(data));
            sessionStorage.setItem("shoppinglist", JSON.stringify(data));
            console.log(sessionStorage.getItem("shoppinglist"));
            displayShoppingList(data);})
    }
    else{
        //TODO: API fetch for specific group not just group in general
        let groups = JSON.parse(sessionStorage.getItem("groups"));
        let group = groups.find(group => group.name === option);
        if (group){
            let groupId = group.documentID;
            console.log(groupId);
        fetch(API_IP + `/shopping/${groupId}?userOrGroup=group`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.status === 200){
                console.log("Shopping list retrieved");
                return response.json();
            } else {
                console.log("Error retrieving shopping list");
                throw new Error("Failed to retrieve shopping list");
            }
        }).then(data=>{
            sessionStorage.setItem("shoppinglist", JSON.stringify(data));
            if(data !== null)
                displayShoppingList(data);});
    }
    }
}

/*
    DISPLAY SHOPPING ITEMS IN ONE OF THE TWO LISTS
 */
function displayShoppingList(shoppinglist){
    let display = document.querySelector("#shopping-list");

    for (let itemName in shoppinglist[0].list) {
        let quantity = shoppinglist[0].list[itemName].quantity;
        let complete = shoppinglist[0].list[itemName].complete;
        console.log(itemName + " " + quantity + " " + complete);

        if (complete === false){
            let formattedItem = quantity + " " + itemName;
            let li = document.createElement("li");
            li.setAttribute("id", "list-item");

            let checkbox = document.createElement("input");
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("id", "checkbox");
            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(formattedItem));
            display.appendChild(li);
        }
        else if(complete == true){
            let finishedlist = document.querySelector("#finished-list");
            let formattedItem = quantity + " " + itemName;
            let li = document.createElement("li");
            li.setAttribute("id", "finished-item");

            let checkbox = document.createElement("input");
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("id", "finished-checkbox");
            checkbox.setAttribute("checked", "checked");
            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(formattedItem));
            finishedlist.appendChild(li);
        }
    }
}

/*
    ADD NEW ITEM TO LIST AND UPDATE STORAGE SESSION/DATABASE
 */
function addNewItemToList(){
    let newItem = document.querySelector("#newitemtxt").value;
    let newQuantity = document.querySelector("#newqttxt").value;
    if(newItem === ""){
        return;
    }

    let list = document.querySelector("#shopping-list");
    let li = document.createElement("li");
    li.setAttribute("id", "list-item");
    //create a checkbox for the list item
    let checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("id", "checkbox");
    li.appendChild(checkbox);

    if (newQuantity !== "") {
        li.appendChild(document.createTextNode(newQuantity + " " + newItem));
    } else {
        li.appendChild(document.createTextNode(newItem));
    }

    list.appendChild(li);
    //Add to storage session
    let shoppinglist = JSON.parse(sessionStorage.getItem("shoppinglist")) || [];
    let itemData = {};
    itemData[newItem] = {
        complete: false,
        quantity: newQuantity,
        category: "",
    };
    shoppinglist.push({
        id: shoppinglist.id,
        assignees: null,
        list: itemData,
    });

    sessionStorage.setItem("shoppinglist", JSON.stringify(shoppinglist));
    patchShoppingList();
}

/*
    REMOVE ITEM FROM LIST AND MOVE TO FINISHED LIST (OR VICE VERSA)
 */
function removeItemFromList(){
    let list = document.querySelector("#shopping-list");
    let items = list.querySelectorAll("#list-item");

    let finishedList = document.querySelector("#finished-list");
    let finishedItems = finishedList.querySelectorAll("#finished-item");

    let sessionList = JSON.parse(sessionStorage.getItem("shoppinglist"));
    items.forEach(item => {
        if(item.querySelector("#checkbox").checked){
            sessionList.forEach(sessionItem => {
                let name = item.textContent;
                console.log(name);
                for (let itemName in sessionItem.list) {
                    let itemInfo = sessionItem.list[itemName].quantity + " " + itemName;
                    if (itemInfo === name) {
                        sessionItem.list[itemName].complete = true;
                    }
                }
            });


            let newitem = item.cloneNode(true);
            newitem.id = "finished-item"
            let clonedCheckbox = newitem.querySelector("input[type='checkbox']");
            clonedCheckbox.id = "finished-checkbox";
            finishedList.appendChild(newitem);
            list.removeChild(item);
        }
    });

    finishedItems.forEach(item => {
        if(!item.querySelector("#finished-checkbox").checked){
            sessionList.forEach(sessionItem => {
                let name = item.textContent;
                console.log(name);
                for (let itemName in sessionItem.list) {
                    let itemInfo = sessionItem.list[itemName].quantity + " " + itemName;
                    console.log(itemInfo);
                    if (itemInfo === name) {
                        sessionItem.list[itemName].complete = false;
                    }
                }
            });

            let newitem = item.cloneNode(true);
            newitem.id = "list-item"
            let clonedCheckbox = newitem.querySelector("input[type='checkbox']");
            clonedCheckbox.id = "checkbox";
            list.appendChild(newitem);
            finishedList.removeChild(item);
        }
    });
    sessionStorage.setItem("shoppinglist", JSON.stringify(sessionList));
    patchShoppingList();
}

/*
    RETRIEVE GROUPS FROM DATABASE
*/
function retrieveGroups(){

    if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");
    let groups = JSON.parse(sessionStorage.getItem("groups"));

    /* if(groups && groups.length > 0){
         displayGroups(groups);
      }  else */{
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
            displayGroups(data);})
            .catch(error => {
                console.log("Error retrieving groups: " + error);
            });
    }
};
/*
    PATCH SHOPPING LIST TO DATABASE
 */
function patchShoppingList(){
    let option = document.querySelector("#group-dropdown").value;
    let userName = sessionStorage.getItem("username");
    let shoppinglist = JSON.parse(sessionStorage.getItem("shoppinglist")) || [];
    let shoppingListObject = {
        id: shoppinglist.id,
        assignees: [],
        list: {},
    };
    shoppinglist.forEach(item => {
       for(let itemName in item.list){
           shoppingListObject.list[itemName] = {
           complete: item.list[itemName].complete,
           quantity: item.list[itemName].quantity,
           category: item.list[itemName].category
           }
       }
    });
    console.log(shoppingListObject);

    let parameters = "";
    if(option === userName){
        shoppingListObject.assignees = [userName];
        fetch(API_IP + `/user/shopping?username=${userName}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(shoppingListObject)
        }).then(response => {
            if (response.status === 200){
                console.log("Shopping list updated");
            } else {
                console.log("Error updating shopping list");
                throw new Error("Failed to update shopping list");
            }
        }).catch(error => {
            console.log("Error updating shopping list: " + error);
        });
    }
    else {
        let groups = JSON.parse(sessionStorage.getItem("groups"));
        let group = groups.find(group => group.name === option);
        if (group) {
            parameters = group.id;
        }
        fetch(API_IP + `/group/shopping?groupID=${parameters}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(shoppingListObject)
        }).then(response => {
            if (response.status === 200) {
                console.log("Shopping list updated");
            } else {
                console.log("Error updating shopping list");
                throw new Error("Failed to update shopping list");
            }
        }).catch(error => {
            console.log("Error updating shopping list: " + error);
        });
    }

}
/*
    REMOVE LIST ON RELOAD (OR WHEN CHANGING GROUP)
 */
function removeList(){
    let list = document.querySelector("#shopping-list");
    let items = list.querySelectorAll("#list-item");
    items.forEach(item => {
        list.removeChild(item);
    });
    list = document.querySelector("#finished-list");
    items = list.querySelectorAll("#finished-item");
    items.forEach(item => {
        list.removeChild(item);
    });
}

//TODO: Retrieve dinner list from the database/storage session and display it
function retrieveDinnerList(){
    // if(!checkAuthToken()) return;

    let dinner = JSON.parse(sessionStorage.getItem("dinner"));  //TODO: check proper variable name

    if(dinner && dinner.length > 0){
        displayDinner(dinner);
    }else {
        //TODO: API fetch
    }
}

//TODO: Display the retrieved dinner list
function displayDinner(dinner){
    let display = document.querySelector("#middag-uke");
    dinner.forEach(dinner => {
        let block = document.createElement("div");
        block.setAttribute("id","middag-blokk");
        block.textContent = dinner.name;
        display.appendChild(block);
    });
}
