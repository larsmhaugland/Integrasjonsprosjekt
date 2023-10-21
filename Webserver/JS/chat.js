document.addEventListener("DOMContentLoaded", function () {

    const createChatCloseButton = document.querySelector("#close-chat-popup");
    const createChatOpenButton = document.querySelector("#create-chat-button");
    const createChatPopup = document.querySelector("#chat-popup");

    createChatOpenButton.addEventListener("click", function () {
        createChatPopup.style.display = "block";
    });

    createChatCloseButton.addEventListener("click", function () {
        createChatPopup.style.display = "none";
    });

});