
//Call addNewItemToList() when the user clicks enter in the input field
let submit = document.querySelector("#newitemtxt");
submit.addEventListener("keydown", (event)=> {
    if (event.
        key == "Enter") {
        addNewItemToList();
        event.preventDefault(); 
        submit.value = "";
    }
});

function addNewItemToList(){
    let newItem = document.querySelector("#newitemtxt").value;

    if(newItem === ""){
        return;
    }

    let list = document.querySelector("#shopping-list");
    let li = document.createElement("li");
    li.setAttribute("id", "list-item");
    li.textContent = newItem;
    list.appendChild(li);
}