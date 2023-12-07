/* jshint esversion: 8 */
document.addEventListener("DOMContentLoaded", function () {

    /****************** DOM ELEMENTS ******************/
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
    const chatNameElement = document.querySelector("#chat-room-name");
    const editChatOpenButton = document.querySelector("#edit-chat-button");
    const editChatCloseButton = document.querySelector("#close-edit-chat-popup");
    const editChatPopup = document.querySelector("#edit-chat-popup");
    const removeSelectedMembers = document.querySelector("#remove-members-button");
    const currentMembersList = document.querySelector("#current-members-list");
    const addMembersButton = document.querySelector("#add-members-button");
    const deleteChatButton = document.querySelector("#delete-chat-button");
    const leaveChatButton = document.querySelector("#leave-chat-button");
    const filterChatList = document.querySelector("#filter-chats-list");
    


    /****************** Variables ******************/
    var username;
    let activeChatID = "";
    let chatOwner;
    let groupIDSentAsParam = "";
    let editChat;
    let currentDate = null;


     // USE THIS TO CONNECT TO THE WEBSOCKET WHEN NOT ON DEV DOCKER1
    //const socket = new WebSocket("ws://localhost:8080/ws");
    const socket = new WebSocket("wss://10.212.174.249:8080/ws");
    
    // Function is called when the page is reloaded
    onPageRelod();
    

    /***************** Websocket event listeners ******************/

    // Handle WebSocket error event
    socket.addEventListener("error", (error) => {
        console.error("WebSocket connection error:", error);
    });

    // Handle WebSocket message event
    socket.addEventListener("message", (event) => {
        console.log("Message received from server: ", event.data);
        
        // Parse the message data to JSON and create variable 
        // with the fields needed for the addMessageWithDateToListfunction
        const messageData = JSON.parse(event.data);
        const formattedMessage = {
            sender: messageData.sender,
            content: messageData.content,
            timestamp: messageData.timestamp
        };
    
        addMessageWithDateToList(formattedMessage);
    });

    /****************************  Event listeners ************************************/

    // Event listener to open the create chat popup when the create chat button is clicked
    createChatOpenButton.addEventListener("click", function () {
        if (sessionStorage.getItem("loggedIn") === "false"){
            alert("You need to be logged in to create a chat");
        } else  {
            editChat = false;
            createChatPopup.style.display = "block";
        }
    });

    // Event listener to hide the create chat popup when the close button is clicked
    createChatCloseButton.addEventListener("click", function () {
        createChatPopup.style.display = "none";
    });

    // Event listener to open the edit chat popup when the edit chat button is clicked
    editChatOpenButton.addEventListener("click", function () {
        // Make sure a chat is selected
        if (activeChatID === undefined || activeChatID === null) {
            return;
        }
        // Make sure the user is the owner of the chat
        else if (username !== chatOwner){
            alert("Only the chat owner can edit the chat");
        } 
        else  {
            // Display the chat members in the edit chat popup
            getChatMembers(activeChatID);
            editChat = true;
            editChatPopup.style.display = "block";
        }
    });

    // Event listener to hide the edit chat popup when the close button is clicked
    editChatCloseButton.addEventListener("click", function () {
        editChatPopup.style.display = "none";
    });

    // Event Listener to close the modal when the close button is clicked
    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Event listener to open the modal when the openmodal button is pressed
    openModalButton.addEventListener("click", function () {
        modal.style.display = "block";
    });

    // Event listener to send the message when the send message button is clicked
    sendMessageButton.addEventListener("click", sendMessageHandler);
    
    // Event listener to send the message when the enter key is pressed
    messageInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessageHandler();
        }
    });

    // Event listener to remove the selected members from the chat when the remove members button is clicked
    removeSelectedMembers.addEventListener("click", function () {
        const selectedMembers = document.querySelectorAll("#current-members-list input[type='checkbox']:checked");
        const usernamesToRemove = [];
        selectedMembers.forEach(member => {
            // Find the label associated with the checkbox
            const labelElement = member.nextElementSibling;

            // Get the member name from the label
            const usernameLabel = labelElement.textContent;
            
            // Only owner can edit the chat so we can username, to make sure owner is not removed
            if (usernameLabel !== username) {
                // Remove the member
                usernamesToRemove.push(usernameLabel);
            }
        });
        removeMembersFromChat(usernamesToRemove, false);
    });

    // Event listener to show the addmember modal when the add members button is clicked
    addMembersButton.addEventListener("click", function () {
        modal.style.display = "block";
    });

    // Event listener to delete the chat when the delete chat button is clicked
    deleteChatButton.addEventListener("click", function () {
       if (window.confirm("Are you sure you want to delete this chat?")){
           deleteChat(); 
       }
    });

    // Event listener to leave the chat when the leave chat button is clicked
    leaveChatButton.addEventListener("click", function () {
        if (window.confirm("Are you sure you want to leave this chat?")){
            removeMembersFromChat([username], true);
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent the default form submission behavior
        
        // URL for the backend API endpoint and generate a random ID for the chat
        const URL = `${API_IP}/chat/chat`;
        const chatID = generateRandomId(20);

        const chatName = document.querySelector("#chat-name").value;

        // Create an array of member names from the list 
        const memberList = Array.from(document.querySelectorAll(".member-list li span")).map(span => span.textContent);
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
        // Get the query to filter the results by
        const query = searchInput.value.trim();
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

    // Handle filter chat list input changes
    filterChatList.addEventListener("input", (event) => {
        // Get the search query to filter by
        const filterText = event.target.value.toLowerCase();

        // Get the chat list items as an array
        chatListArray = Array.from(chatList.getElementsByTagName("li"));
       
        if (chatListArray.length !== 0) {
            
            // Go through the array of chat list items and show the ones that match the query 
            chatListArray.forEach((item) => {
                const itemText = item.textContent.toLowerCase();
                if (itemText.startsWith(filterText)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });

        } 
    });


    /****************************  Functions ********************************/

    /**
     * Function that runs whenever the page is loaded/reloaded. Displays the user chats if the user is logged in.
     * And hide/shows the buttons that are supposed to be hidden/shown.
     * Displays the chat messages if the user has navigated from the group page, such that the groups messages
     * should be displayed.
     * @returns {void}
     * @see displayUserChats - Function to display the chats for the logged in user
     * @see getChatFromGroupAsync - Function to get the chat for the group with the specified groupID
     */
    async function onPageRelod() {

        username = sessionStorage.getItem("username");
        
        // Make sure user is logged in before dsiplaiyng chats.
        if (sessionStorage.getItem("loggedIn") === "true"){
            console.log("username: " + username);
            displayUserChats(username);
        } else {
            // Display a message to the user that they need to be logged in to view chats
            const noChatsMessage = document.createElement("span");
            noChatsMessage.textContent = "Du må være logget inn for å vise chatter";
            noChatsMessage.classList.add("no-chats-to-display");
            chatListContainer.appendChild(noChatsMessage);
        }
    
        // Hide the edit button and leave chat button if no chat is selected
        if (activeChatID === "") {
            leaveChatButton.style.display = "none";
            editChatOpenButton.style.display = "none";
        }

        // If the user has navigated from the group page, display the group messages
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams) {
            groupIDSentAsParam = urlParams.get('groupID');
            console.log("GroupID sent as para:" + groupIDSentAsParam);
            if (groupIDSentAsParam !== null) {
                try {
                    await getChatFromGroupAsync(groupIDSentAsParam);
                    
                    await waitForSocketOpenOrTimeout();
                    
                    // If the connection failed, do not send the join message to the websocket
                    if (socket.readyState === WebSocket.OPEN) {
                        console.log("Joining chat now");
                        const joinMessage = {
                            event: "joinChat",
                            activeChatID: activeChatID,
                        };
                        // Join the chat room for the group
                        socket.send(JSON.stringify(joinMessage));
                    }

                } catch (error) {
                    console.error("Error:", error);
                }
            }
        }
    }


    /**
     * Waits for the WebSocket connection to open before sending the join message
     * @returns {void}
     */
    function waitForSocketOpenOrTimeout() {
        return new Promise((resolve) => {
            const maxTime = 5000; // Maximum time to wait in milliseconds (5 seconds)
            const checkInterval = 500; // Check interval in milliseconds
    
            const interval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    console.log("WebSocket connection open");
                    clearInterval(interval);
                    resolve();
                }
            }, checkInterval);
    
            setTimeout(() => {
                clearInterval(interval);
                resolve();
            }, maxTime);
        });
    }


    /**
     * Sends the message to the backend API and the websocket.
     * @see sendMessage - Function to send the message to the API that adds the message to the databse
     * @see sendMessageSocket - Function to send the message event to the websocket server
     * @returns {void}
     */
    function sendMessageHandler() {

        // Get the message content
        const message = messageInput.value.trim();
        messageInput.value = "";

        // Remove the "No messages to display..." message if there was no messages in the chat
        if (messageList.firstChild.span === "No messages to display...") {
            messageList.removeChild(messageList.firstChild);
        }

        // Make sure the message is not empty
        if (message !== "") {

            // Add the message to the chat
            sendMessage(message);
            // Make sure the socket is open before sending the message
            if (socket.readyState === WebSocket.OPEN) {
                sendMessageSocket(message);
            } else {
                console.error("Not connected to WebSocket server");
                window.alert("Not connected to WebSocket server, reload page to display the new message");
            }
        } else {
            console.log("Message is empty, was not sent");
        }
    }
    
      
    /**
     * Sends the message event to the websocket server with the correct message data
     * @param {Message struct} message - Content of the message to be 
     * @returns {void}
     */
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
    }

    /**
     * Updates the suggestions for members to add after the user have entered in partial or full
     * username of the person they wish to add to their group
     * @param {[]string} results - The usernames of the users that corresponded to the search
     * @param {bool} editChat    - Boolean value to indicate if the user is editing a chat or creating a new one
     * @returns {void}
     * @see addMemberToAddList - Function to add the member to the list of members to be added to the group
     * @see addUserToChat - Function to add the user to the chat
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

    /**
     * Adds the member to the list of members to be added to the group
     * @param {string} username - The username of the member to add to the members to be added list 
     * @returns {void}
     * @see removeMemberFromList - Function to remove the member from the list of members to be added
     */
    function addMemberToAddList(username) {
        
        // Get the list of members
        const memberListItem = document.createElement("li");
        const memberName = document.createElement("span");
        memberName.textContent = username;
        
        // Create a remove button for removing the member from add list
        const removeButton = document.createElement("button");
        removeButton.className = "remove-member-button";
        removeButton.textContent = "Fjern";
        
        // Add an event listener to the remove button to handle removing the member from the list
        removeButton.addEventListener("click", function () {
            removeMemberFromList(username);
        });

        memberListItem.appendChild(memberName);
        memberListItem.appendChild(removeButton);
        memberList.appendChild(memberListItem);
    }

    /**
     * Remove the member from the list of members to be added to the group
     * @param {string} username - The username of the member to remove from the list of members to be added 
     */
    function removeMemberFromList(username){
        var memberListItem;
        const listItems = document.querySelectorAll("#member-list li");

        // Go through the list items and find the one with the matching username
        for (const listItem of listItems) {
            console.log(listItem);
            const span = listItem.querySelector("span");
            // If the username matches the username of the list item
            if (span.textContent === username) {
                memberListItem = listItem;
            }
        }
        // Remove the list item from the list
        memberList.removeChild(memberListItem);
    }

    /**
     * Adds the chat to the the list of chats for the logged in user.
     * @param {Chat struct} chat - The chat struct with the chats necessary Data
     * @returns {void}
     * @see displayChatMessages - Function to display the chat messages for the chat
     */
    function addChatToList(chat) {
        
        const chatList = document.querySelector("#list-of-chats");
        const chatItem = document.createElement("li");
        chatItem.classList.add("chat-item");
        console.log("chat nam:" + chat.name);
        chatItem.textContent = chat.name; // Display the chat name
        
        // Event Listener to display the clicked chat with its messages, and join the chat room
        chatItem.addEventListener("click", function () {
            
            // Make sure a chat was previosuly selected before trying to leave it
            if (activeChatID !== "") {
                // Leave the current chat room
                const leaveMessage = {
                    event: "leaveChat",
                    activeChatID: activeChatID,
                };
                socket.send(JSON.stringify(leaveMessage));
            }

            // Join the new chat room
            const joinMessage = {
                event: "joinChat",
                activeChatID: chat.documentID,
            };

            // Send the join event to the websocket server
            socket.send(JSON.stringify(joinMessage));
            displayChatMessages(chat);
        });
    
        // Append the chat item to the chat list
        chatList.appendChild(chatItem);
    }

    /**
     * Displays all the relevant data needed for the chat, this includes hiding or showing the necessary buttons
     * and displaying the chat messages.
     * @param {Struct chat} chat - The chat struct with the chats necessary Data 
     * @returns {void}
     * @see getMessageDate - Function to get the date of the message
     * @see addMessageWithDateToList - Function to add the message to the message list with the correct formatting
     */
    function displayChatMessages(chat) {
        // Clear existing messages if any
        if (messageList) {
            while (messageList.firstChild) {
                messageList.removeChild(messageList.firstChild);
            }
        }

        // Set the active chat ID and owner
        activeChatID = chat.documentID;
        chatOwner = chat.chatOwner;
        
        // Display the chat name and hide/show the necessary buttons
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
        date = null;
        if (messages) {
            // Iterate through the messages and add them to the message list
            messages.forEach(message => {
                addMessageWithDateToList(message);
                currentDate = getMessageDate(message.timestamp);
            });
            messageList.scrollTop = messageList.scrollHeight;
        } else {

            // If there are no chat messages display an message saying so
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

    /**
     * Adds the message to the message list with the correct formatting
     * @param {Message struct} message - Message struct with the necessary data for the messages 
     * @returns {void}
     */
    function addMessageToList(message) {
        // Get the chat messages list
        const messageList = document.querySelector(".chat-messages");
    
        // Create the message list item
        const messageItem = document.createElement("li");
    
        // Create the message container
        const messageContainer = document.createElement("div");
        messageContainer.classList.add(message.sender === username ? "message-sent" : "message-received");
    
        // Create the message header
        const messageHeader = document.createElement("div");
        messageHeader.classList.add("message-header");
    
        // Create the sender span
        const senderSpan = document.createElement("span");
        senderSpan.classList.add("message-sender");
        senderSpan.textContent = (message.sender === username) ? "You" + ":": message.sender + ":";
    
        // Create the timestamp span
        const timestampSpan = document.createElement("span");
        timestampSpan.classList.add("message-timestamp");
        const formattedTimestamp = formatGoTimeStamp(message.timestamp);
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

    /**
     * Displays all the chats that the user is a member of in a list, and adds an event listener to each chat
     * item to display the chat messages when clicked.
     * @param {string} username - The username of the user to display the chats for 
     * @returns {void}
     * @see addChatToList - Function to add the chat to the chat list
     */
    function displayUserChats(username) {
        // URL for the API endpoint
        const URL = `${API_IP}/chat/chat?username=${username}`;
        
        // Send the GET request to the API endpoint
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

            // Display a message to the user if they are not a member of any chats
            if (chats.length === 0) {
                const noChatsMessage = document.createElement("span");
                noChatsMessage.textContent = "Du er ikke medlem av noen chatter... opprett en ny chat ovenfor";
                noChatsMessage.classList.add("no-chats-to-display");
                chatListContainer.appendChild(noChatsMessage);
                return;
            }

            // Go through the chats and add them to the chat list
            chats.forEach(chat => {
                addChatToList(chat);
            });
        })
        .catch((error) => {
            console.error('Not part of nay chats, or error fetching chats:', error);
        });
    } 

    /**
     * Sends the message to the backend API that adds the message to the database
     * @param {Message struct} message - Message struct with the necessary data for the messages
     * @returns {void}
     */
    function sendMessage(message) {
        // URL for the backend API endpoint
        const URL = `${API_IP}/chat/messages?chatID=${activeChatID}`;

        const messageData = {
            sender: username,
            content: message,
        };

        // Send a POST request to the backend API with the message as the bod
        fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messageData),
        })
        .then(response => {
            if (response.status !== 201) {
                window.alert("Error sending message");
            }
        })
        .catch(error => {
            console.error("API Error:", error);
            window.alert("Error sending message");
        });
    }

    /**
     * Removes the member with the specified username from the active chat.
     * @param {string} username - The username of the member to remove from the chat
     * @param {bool} leave - If the user left the chat themself or was removed by the owner
     * @returns {void}
     */
    async function removeMembersFromChat(usernames, leave) {

        // URL for the backend API endpoint
        const url = `${API_IP}/chat/membersDelete`;

        // Send a POST request to the backend API
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ chatID: activeChatID, usernames: usernames }),
        })
            .then(response => {
                if (response.status === 204) {
                    // If the user left the chat themself, reload the page
                    if (leave === true) { 
                        location.reload();
                    } else {
                        getChatMembers(activeChatID);
                    }
                } else {
                    console.error("Error removing member:", response.status);
                }
            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }

    /**
     * Gets all the members of the chat with the specified chatID
     * 
     * @param {string} chatID - The ID of the chat to get the members for
     * @returns {void}
     * @see updateChatMembersList - Function to update the chat members list with the members
     */
    function getChatMembers(chatID) {
        // URL for the backend API endpoint
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
                    // Update the chat members list with the members
                    updateChatMembersList(data);
                } else {
                    console.error("Invalid response data:", data);
                }
            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }

    /**
     * Adds the user with the specified username to the active chat
     * @param {string} username - The username of the user to add to the chat 
     * @returns {void}
     * @see updateChatMembersList - Function to update the chat members list with the members
     */
    function addUserToChat(username) {
        // URL for the backend API endpoint
        const url = `${API_IP}/chat/members?chatID=${activeChatID}`; 
        
        // Prepare the data to be sent to the API endpoint
        const data = {
            username: username,
        };
        
        // Send a POST request to the backend API
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            // Handle the response from the API
            .then((response) => {
                return response.json(); 
            })
            // The response is then used to update the chatMembersList
            .then((responseData) => {
                updateChatMembersList(responseData);
            })
            .catch((error) => {
                console.error('API Error:', error);
            });
    }

    /**
     * Update the chat members list with the members sent as a parameter
     * 
     * @param {[]String} members - Array of members to update the chat members list with 
     * @returns {void}
     */
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

    /**
     * Removes the active chat from the databas
     * @returns {void}
     */
    function deleteChat() {
        //  URL for the backend API endpoint
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
                    console.error("Error deleting chat:", response.status);
                }
            })
            .catch(error => {
                console.error("API Error:", error);
            });
    }

    /**
     * Gets the chat for the group with the specified groupID
     * 
     * @param {string} groupID - unique ID for the group 
     * @returns {void}
     * @see displayChatMessages - Function to display the chat messages for the group
     */
    async function getChatFromGroupAsync(groupID) {
        // URL for the backend API endpoint
        const url = `${API_IP}/chat/chatData?groupID=${groupID}`;

        // Send a GET request to the backend API
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            const data = await response.json();
            // Call the function to display the chat messages after the response from the API is received
            displayChatMessages(data);
        } catch (error) {
            console.error("Error fetching search results from database:", error);
            throw error; // Re-throw the error to handle it at the caller's level
        }
    }

    /**
     * Formats the timestamp created in the GO backend to a string in the digital format.
     * 
     * @param {number} timestamp - The timestamp to be formatted.
     * @returns {string} The formatted time string in the "HH:mm" format.
     */
    formatGoTimeStamp = (timestamp) => {
        const jsDate = new Date(timestamp);
        
        const hours = jsDate.getHours();
        const minutes = jsDate.getMinutes();
        
        // Digital format so for example 22:00 or 05:20
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}`;
    };

    /**
     * Formats the timestamp into a string in the "MMM dd, yyyy" format.
     * 
     * @param {string} timestamp - The timestamp to be formatted. 
     * @returns {string} The formatted date string in the "MMM dd, yyyy" format.
     */
    function getMessageDate(timestamp) {
        const jsDate = new Date(timestamp);
        const year = jsDate.getFullYear();

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const monthName = months[jsDate.getMonth()];

        const day = String(jsDate.getDate()).padStart(2, '0');
        return `${monthName} ${day}, ${year}`;
    }

    /**
     * Creates the item for the date of the message
     * @param {string} messageDate - Formatted date of the message
     * @returns {dateItem} - The date item to be added to the message list
     */
    function createMessageDateItem(messageDate) {
        const dateItem = document.createElement("li");
        dateItem.classList.add("message-date");
    
        const dateSpan = document.createElement("span");
        dateSpan.textContent = messageDate;
    
        dateItem.appendChild(dateSpan);
    
        return dateItem;
    }

    /**
     * Adds a message to the list of messages and adds a new item with the date of the message if the date
     * of the message is different from the date of the previous message.
     * 
     * @param {Message struct} message - Message struct with the necessary data for the messages
     * @returns {void}
     * @see addMessageToList - Function to add the message to the message list
     * @see createMessageDateItem - Function to create the item for the date of the message
     */
    function addMessageWithDateToList(message) {
        const messageDate = getMessageDate(message.timestamp);

        if (currentDate !== messageDate) {
            const dateItem = createMessageDateItem(messageDate);
            messageList.appendChild(dateItem);
            currentDate = messageDate;
        }
        addMessageToList(message);
        messageList.scrollTop = messageList.scrollHeight;
    }

});