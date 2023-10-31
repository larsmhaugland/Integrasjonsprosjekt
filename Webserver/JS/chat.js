document.addEventListener("DOMContentLoaded", function () {

    // DOM elements
    const createChatCloseButton = document.querySelector("#close-chat-popup");
    const createChatOpenButton = document.querySelector("#create-chat-button");
    const createChatPopup = document.querySelector("#chat-popup");
    const modal = document.querySelector("#search-member-modal");
    const openModalButton = document.querySelector("#add-member-button");
    const closeModalButton = modal.querySelector(".close-modal");
    const sendMessageButton = document.querySelector("#send-message-button");
    const messageInput = document.querySelector("#message-input");
    const memberSuggestionsList = modal.querySelector(".member-suggestions");
    const searchInput = document.querySelector("#search-input");
    const memberList = document.querySelector("#member-list");
    const chatList = document.querySelector("#list-of-chats");
    const form = document.querySelector(".chat-form");
    const chatListContainer = document.querySelector(".chat-list");
    const messageList = document.querySelector(".chat-messages");
    const chatNameElement = document.querySelector("#chat-room-name"); // Assuming chat name should go here
    const editChatOpenButton = document.querySelector("#edit-chat-button");
    const editChatCloseButton = document.querySelector("#close-edit-chat-popup");
    const editChatPopup = document.querySelector("#edit-chat-popup");
    const removeSelectedMembers = document.querySelector("#remove-members-button");
    const currentMembersList = document.querySelector("#current-members-list");
    const addMembersButton = document.querySelector("#add-members-button");
    const deleteChatButton = document.querySelector("#delete-chat-button");
    const leaveChatButton = document.querySelector("#leave-chat-button");
    


    // variables
    var username;
    let activeChatID = "";
    let chatOwner;
    let groupIDSentAsParam = "";
    let editChat;
    const socket = new WebSocket("ws://localhost:8080/ws");
    console.log("socket: " + socket);
    
    /***************** Websocket event listeners ******************/
     // Handle WebSocket open event
     /*socket.addEventListener("open", () => {
        console.log("WebSocket connected");
    });*/
    // Handle WebSocket error event
    socket.addEventListener("error", (error) => {
        console.error("WebSocket connection error:", error);
    });
    // Handle WebSocket message event
    socket.addEventListener("message", (event) => {
        console.log("Message received from server: ", event.data);
        const messageData = JSON.parse(event.data);
        const formattedMessage = {
            sender: messageData.sender,
            content: messageData.content,
            timestamp: messageData.timestamp
        };
        addMessageToList(formattedMessage);
    });
    /***************  ******************************/

    onPageRelod();

    async function onPageRelod() {
        username = sessionStorage.getItem("username");
        if (sessionStorage.getItem("loggedIn") === "true"){
            console.log("username: " + username);
            displayUserChats(username);
        } else {
            const noChatsMessage = document.createElement("span");
            noChatsMessage.textContent = "Du må være logget inn for å vise chatter";
            noChatsMessage.classList.add("no-chats-to-display");
            chatListContainer.appendChild(noChatsMessage);
        }
        console.log("User id: " + username);

        if (activeChatID === "") {
            leaveChatButton.style.display = "none";
            editChatOpenButton.style.display = "none";
        }
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams) {
            groupIDSentAsParam = urlParams.get('groupID');
            if (groupIDSentAsParam !== null) {
                getChatFromGroupAsync(groupIDSentAsParam)
                    .then(() => {
                        console.log("ActiveChatID: " + activeChatID);
                        console.log("Socket ready state: " + socket.readyState);
                        const joinMessage = {
                            event: "joinChat",
                            activeChatID: activeChatID,
                        };
                        socket.send(JSON.stringify(joinMessage));
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            }
        }
    }

    // Event listeners
    createChatOpenButton.addEventListener("click", function () {
        if (sessionStorage.getItem("loggedIn") === "false"){
            alert("You need to be logged in to create a chat");
        } else  {
            editChat = false,
            createChatPopup.style.display = "block";
        }
    });

    createChatCloseButton.addEventListener("click", function () {
        createChatPopup.style.display = "none";
    });

    editChatOpenButton.addEventListener("click", function () {
        if (activeChatID === undefined || activeChatID === null) {
            return;
        }
        else if (username !== chatOwner){
            alert("Only the chat owner can edit the chat");
        } 
         else  {
            getChatMembers(activeChatID);
            editChat = true;
            editChatPopup.style.display = "block";
        }
    });

    editChatCloseButton.addEventListener("click", function () {
        editChatPopup.style.display = "none";
    });

    // Close the modal when the close button is clicked
    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    openModalButton.addEventListener("click", function () {
        modal.style.display = "block";
    });

    sendMessageButton.addEventListener("click", function () {
        const message = messageInput.value.trim();
        messageInput.value = "";
        sendMessage(message);
        if (socket.readyState === WebSocket.OPEN){
            sendMessageSocket(message);
        } else {
            console.error("Not connected to WebSocket server");
        }
    });

    removeSelectedMembers.addEventListener("click", function () {
        const selectedMembers = document.querySelectorAll("#current-members-list input[type='checkbox']:checked");
        
        editChatPopup.style.display = "none";
        selectedMembers.forEach(member => {
            // Find the label associated with the checkbox
            const labelElement = member.nextElementSibling;

            // Get the member name from the label
            const usernameLabel = labelElement.textContent;

            // Remove the member
            removeMemberFromChat(usernameLabel, false);
        });
    });

    addMembersButton.addEventListener("click", function () {
        modal.style.display = "block";
    });

    deleteChatButton.addEventListener("click", function () {
      const confirmation = window.confirm("Are you sure you want to delete this chat?")
       if (confirmation){
           deleteChat(); 
       }
    });

    leaveChatButton.addEventListener("click", function () {
        const confirmation = window.confirm("Are you sure you want to leave this chat?")
        if (confirmation){
            removeMemberFromChat(username, true);
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent the default form submission behavior
        const URL = `${API_IP}/chat/chat`;
        const chatID = generateRandomId(20);
        // Get the form elements by their IDs
        const chatName = document.getElementById("chat-name").value;
        // Create an array of member names from the list 
        const memberList = Array.from(document.querySelectorAll(".member-list li")).map(li => li.textContent);
        memberList.push(username);
        // Prepare the data to be sent to the API endpoint
        const data = {
            name: chatName,
            members: memberList, 
            chatOwner: username,
            documentID: chatID, 
        };

        // Send a POST request to the backend API
        fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (response.status === 201) {
               location.reload();
            } else {
                window.alert("Error creating chat");
            }
        })
        .catch(error => {
            console.error("API Error:", error);
            window.alert("Error creating chat");
        });
    });


    // Handle search input changes
    searchInput.addEventListener("input", function () {
        const query = searchInput.value.trim();;
        if (query.length === 0) {
            return;
        }
        const url = `${API_IP}/user/search?partialUsername=${query}`;
        // Send a GET request to the firestore database via GO
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Update the member suggestions list with the results
                updateMemberSuggestions(data, editChat);
            })
            .catch(error => {
                console.error("Error fetching search results from database:", error);
            });
    });

    // Function to send a message through the websocket
    function sendMessageSocket(message) {
        const messageData = {
            event: "chatMessage",
            message: {
                sender: username,
                content: message,
                activeChatID: activeChatID,
            }
        };
        socket.send(JSON.stringify(messageData));
        console.log("Message sent through websocket");
    }

    /**
     * Updates the suggestions for members to add after the user have entered in partial or full
     * username of the person they wish to add to their group
     * @param {*} results - The usernames of the users that corresponded to the search
     */
    function updateMemberSuggestions(results, editChat) {

        // Clear existing suggestions
        while (memberSuggestionsList.firstChild) {
            memberSuggestionsList.removeChild(memberSuggestionsList.firstChild);
        }

        // If there were no matching members dsiplay a message to the user
        if (results.length === 0) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.textContent = "No matching results found.";
            memberSuggestionsList.appendChild(noResultsMessage);
            return;
        }
        
        // Populate the suggestions list with results
        results.forEach(function (username) {
            const listItem = document.createElement("li");

            // Create the image element
            const image = document.createElement("img");
            image.src = "../Images/person-icon-transparent.png";
            image.alt = username;

            // Create the span element for the username
            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = username;

            // Create the button for adding the member
            const addButton = document.createElement("button");
            addButton.className = "add-member-btn2";

            const addImage = document.createElement("img");
            addImage.src = "../Images/add-icon.png";
            addImage.alt = "Add member";

            addButton.appendChild(addImage);

            // Add an event listener to handle adding a member to the group when clicking the icon
            addButton.addEventListener("click", function () {
                const username = addButton.parentElement.querySelector("span").textContent;
                if (!editChat){
                    addMemberToAddList(username);
                } else {
                    addUserToChat(username);
                }
                modal.style.display = "none";
            });

            // Append the elements to the list item
            listItem.appendChild(image);
            listItem.appendChild(usernameSpan);
            listItem.appendChild(addButton);

            memberSuggestionsList.appendChild(listItem);
        });
    }

    function addMemberToAddList(username) {
        // Get the list of members
        const memberListItem = document.createElement("li");
        const memberName = document.createElement("span");
        memberName.textContent = username;
        
        const removeButton = document.createElement("button");
        removeButton.className = "remove-member-button";
        removeButton.addEventListener("click", function () {
            removeMemberFromList(username);
        });

        memberListItem.appendChild(memberName);
        memberListItem.appendChild(removeButton);
        memberList.appendChild(memberListItem);
    }

    function removeMemberFromList(username){
        var memberListItem;
        const listItems = document.querySelectorAll("#member-list li");
        for (const listItem of listItems) {
            console.log(listItem)
            const span = listItem.querySelector("span");
            if (!span){console.log("span is null");}
            if (span.textContent === username) {
                // Found the list item with the matching username
                memberListItem = listItem;
            }
        }
        memberList.removeChild(memberListItem);
    }


    function addChatToList(chat) {
        const chatList = document.querySelector("#list-of-chats");
    
        const chatItem = document.createElement("li");
        chatItem.classList.add("chat-item");
        chatItem.textContent = chat.name; // Display the chat name
        
        // Add an event listener to each chat item for handling chat selection or navigation
        chatItem.addEventListener("click", function () {
            // Leave the current chat room
            const leaveMessage = {
                event: "leaveChat",
                activeChatID: activeChatID,
            };
            socket.send(JSON.stringify(leaveMessage));
            // Join the new chat room
            const joinMessage = {
                event: "joinChat",
                activeChatID: chat.documentID,
            };
            socket.send(JSON.stringify(joinMessage));
            displayChatMessages(chat);
        });
    
        // Append the chat item to the chat list
        chatList.appendChild(chatItem);
    }

    function displayChatMessages(chat) {
        // Clear existing messages
        if (messageList) {
            while (messageList.firstChild) {
                messageList.removeChild(messageList.firstChild);
            }
        }
        activeChatID = chat.documentID;
        console.log("Active chat id set: " + activeChatID);
        chatOwner = chat.chatOwner;
  
        chatNameElement.textContent = chat.name; 
        if (username === chat.chatOwner) {
            leaveChatButton.style.display = "none";
            editChatOpenButton.style.display = "block";
        } else {
            leaveChatButton.style.display = "block";
            editChatOpenButton.style.display = "none";
        }

        // Display the messages
        const messages = chat.messages;
        if (messages) {
            messages.forEach(message => {
                addMessageToList(message);
            });
        } else {
            const noMessagesItem = document.createElement("li");

            const messageContainer = document.createElement("div");
            messageContainer.classList.add("message");

            const noMessagesMessage = document.createElement("span");
            noMessagesMessage.textContent = "No messages to display...";

            messageContainer.appendChild(noMessagesMessage);
            noMessagesItem.appendChild(messageContainer);
            if (!messageList) {
                console.error("messageList is null or doesn't exist.");
            }
            messageList.appendChild(noMessagesItem);
        }
    }

    function addMessageToList(message) {
        // Get the chat messages list
        const messageList = document.querySelector(".chat-messages");
    
        // Create the message list item
        const messageItem = document.createElement("li");
    
        // Create the message container
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message");
    
        // Create the message header
        const messageHeader = document.createElement("div");
        messageHeader.classList.add("message-header");
    
        // Create the sender span
        const senderSpan = document.createElement("span");
        senderSpan.classList.add("message-sender");
        senderSpan.textContent = message.sender + ":";
    
        // Create the timestamp span
        const timestampSpan = document.createElement("span");
        timestampSpan.classList.add("message-timestamp");
        const formattedTimestamp = formatGoTimeStamp(message.timestamp)
        timestampSpan.textContent = formattedTimestamp;
    
        // Create the message content
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = message.content;
    
        // Append elements to the appropriate parent elements
        messageHeader.appendChild(senderSpan);
        messageHeader.appendChild(timestampSpan);
        messageContainer.appendChild(messageHeader);
        messageContainer.appendChild(messageContent);
        messageItem.appendChild(messageContainer);
    
        // Append the message item to the message list
        messageList.appendChild(messageItem);
    }

    function displayUserChats(username) {
        const URL = `${API_IP}/chat/chat?username=${username}`;
        fetch(URL) 
        .then((response) => response.json())
        .then((data) => {
            const chats = data;
            // Clear existing chat list
            if (chatList) {
                while (chatList.firstChild) {
                    chatList.removeChild(chatList.firstChild);
                }
            } else {
                console.error("chatList is null or doesn't exist.");
            }

            // Iterate through the chats and add them to the chat list
            if (chats.length === 0) {
                const noChatsMessage = document.createElement("span");
                noChatsMessage.textContent = "Du er ikke medlem av noen chatter... opprett en ny chat ovenfor";
                noChatsMessage.classList.add("no-chats-to-display");
                chatListContainer.appendChild(noChatsMessage);
                return;
            }

            chats.forEach(chat => {
                addChatToList(chat);
            });
        })
        .catch((error) => {
            console.error('Error fetching chats:', error);
            alert("Server error when trying to get chats")
        });
    } 

    function sendMessage(message) {
        // Get the chat ID
        const URL = `${API_IP}/chat/messages?chatID=${activeChatID}`;

        const data = {
            sender: username,
            content: message,
        };

        fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (response.status === 201) {
                //location.reload();
            } else {
                window.alert("Error sending message");
            }
        })
        .catch(error => {
            console.error("API Error:", error);
            window.alert("Error sending message");
        });
    }

    function removeMemberFromChat(username, leave) {

        const url = `${API_IP}/chat/members?chatID=${activeChatID}&username=${username}`;
    
        // Send a DELETE request to the backend API
        fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (response.status === 204) {
                    console.log(`Member ${username} removed.`);
                    if (leave === true) { 
                        location.reload();
                    }
                } else {
                    console.error("Error removing member:", response.status);
                }
            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }

    function getChatMembers(chatID) {
        console.log("Getting chat members for chatID: " + chatID);
        const url = `${API_IP}/chat/members?chatID=${chatID}`;
    
        // Send a GET request to the backend API
        fetch(url)
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    console.error("Error fetching chat members:", response.status);
                }
            })
            .then(data => {
                if (data) {
                    updateChatMembersList(data);
                } else {
                    console.error("Invalid response data:", data);
                }
            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }

    function addUserToChat(username) {
        const url = `${API_IP}/chat/members?chatID=${activeChatID}`; // Replace with your actual API URL
        
        const data = {
            username: username,
        };
    
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then((response) => {
                return response.json(); // Always parse the response as JSON
            })
            .then((responseData) => {
                updateChatMembersList(responseData);
            })
            .catch((error) => {
                console.error('API Error:', error);
            });
    }

    function updateChatMembersList(members) {
    
        // Clear the existing list
        while (currentMembersList.firstChild) {
            currentMembersList.removeChild(currentMembersList.firstChild);
        }
    
        // Iterate through the members and add them to the list
        members.forEach(member => {
            const listItem = document.createElement("li");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `${member}`;
            const label = document.createElement("label");
            label.htmlFor = `${member}`;
            console.log("username: " + member);
            label.textContent = member;
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            currentMembersList.appendChild(listItem);
        });
    }

    function deleteChat() {
        const url = `${API_IP}/chat/chat?chatID=${activeChatID}`;
        
        // Send a DELETE request to the backend API
        fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (response.status === 204) {
                    console.log(`Chat ${activeChatID} deleted.`);
                    location.reload();
                } else {
                    // Handle errors or non-successful responses
                    console.error("Error deleting chat:", response.status);
                }
            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }

    /*
    function getChatFromGroup(groupID) {
        const url = `${API_IP}/chat/chatData?groupID=${groupID}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Update the member suggestions list with the results
                displayChatMessages(data);
            })
            .catch(error => {
                console.error("Error fetching search results from database:", error);
            });
    }*/

    async function getChatFromGroupAsync(groupID) {
        const url = `${API_IP}/chat/chatData?groupID=${groupID}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            const data = await response.json();
            // Update the member suggestions list with the results
            displayChatMessages(data);
        } catch (error) {
            console.error("Error fetching search results from database:", error);
            throw error; // Re-throw the error to handle it at the caller's level
        }
    }

    formatGoTimeStamp = (timestamp) => {
        const jsDate = new Date(timestamp);
        
        const hours = jsDate.getHours();
        const minutes = jsDate.getMinutes();
        
        // Digital format so for example 22:00 or 05:20
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}`;
    }

});