


let dinnerPopup = document.querySelector("#dinner-popup");
let newDinnerBtns = document.querySelectorAll(".dinner-btn");
let closeDinnerPopup = document.querySelector("#close-dinner-popup");
let currentDay;

newDinnerBtns.forEach (function (btn)
{
    btn.addEventListener("click", function (event){
        if(!checkAuthToken()){
            alert("Du må logge inn for å legge til i kalenderen");
            return;
        }
        let day = event.target.parentNode.id;
        console.log(day);
        currentDay = day;
        dinnerPopup.style.display = "block";
    });
});

closeDinnerPopup.addEventListener("click", function (event){
    dinnerPopup.style.display = "none";
});

function addDinnerToCalendar() {
    if(event.key === "Enter") {
        let dinnerName = document.querySelector("#dinner-name").value;
        let label = document.createElement("label");
        label.innerHTML = dinnerName;
        label.setAttribute("id", currentDay + " textbox");
        let div = document.getElementById(currentDay);
        div.appendChild(label);
        event.preventDefault();
        dinnerPopup.style.display = "none";
        document.querySelector("#dinner-name").value = "";
    }
}