window.onbeforeunload = function () {
    return "Data will be lost if you leave the page, are you sure?";
};

window.addEventListener("DOMContentLoaded", () => {
    const websocket = new WebSocket("ws://localhost:8765");
    const serverTimeZone = "Asia/Hong_Kong";
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let clientID = null;
    let ticketID = null;
    const headerButton = document.getElementById("chatbox-collapse-button");
    const messageInput = document.getElementById("message-input");
    // Get user data from sessionStorage
    const title = sessionStorage.getItem("Chatroom-Title");
    const firstName = sessionStorage.getItem("Chatroom-FirstName");
    const lastName = sessionStorage.getItem("Chatroom-LastName");

    // Execute a function when the user presses a key on the keyboard
    document.getElementById("sendMessageButton").addEventListener("click", () => {
        sendMessage();
    });
    // Hidden the bottom border of chat header
    headerButton.addEventListener("click", function (event) {
        let chatbox = document.getElementById("chatbox-area");
        let headerCSS = document.querySelector(".chat-area header");
        if (chatbox.getAttribute("aria-expanded") == "true") {
            headerCSS.style.borderBottom = "none";
        } else {
            headerCSS.style.borderBottom = "1px solid #ccc";
        }
    });
    messageInput.addEventListener("keypress", function (event) {
        if (!event.repeat) {
            if (event.key === "Enter") {
                event.preventDefault();
                document.getElementById("sendMessageButton").click();
            }
        }
    });

    // websocket events
    websocket.onopen = function (event) {
        // console.log("WebSocket connection established");
        checkUserInfos();
    };
    websocket.onclose = function (event) {
        let message = "Server connection lost";
        if (event.reason) {
            message = event.reason
        }
        // console.log(event);
        displayMessage(message, new Date().toUTCString(), timeZone, "in");
        displayButton("Go back to signin", function () { returnToSignin(); });
        document.getElementById("sendMessageButton").disabled = true;
        scrollToBottom();
    };
    // Capture server message
    websocket.onmessage = ({ data }) => {
        const event = JSON.parse(data);
        switch (event.type) {
            case "addClient":
                if (clientID == null || ticketID == null) {
                    // console.log("A new client has been created:");
                    // console.log(event);
                    clientID = event["clientID"];
                    ticketID = event["ticketID"];
                    welcomeMessage();
                }
                break;
            case "addClientMessage":
            case "message":
                // console.log(`message from server: ${event.type}`);
                if (event["ticketID"] == ticketID) {
                    // console.log(event);
                    let type = "in";
                    switch (event.type) {
                        case "addClientMessage":
                            type = "out";
                            break;
                        case "message":
                            type = "in";
                            break;
                    }
                    displayMessage(event["message"], event["messageDate"], serverTimeZone, type);
                    scrollToBottom();
                }
                break;
            case "resolveTicket":
                if (event["ticketID"] == ticketID) {
                    websocket.close(1000, `System message: Conversation ${ticketID} resolved, server connection closed. Thank you for using our service!`);
                }
                break;
            case "users":
                // console.log("Current user count");
                break;
            case "clients":
                // console.log("All clients");
                break;
            case "clientChatInfo":
                // console.log("Client chat info");
                break;
            default:
                console.error(`unsupported event: ${event.type}`, event);
        }
    }

    // Ask server to add a new client
    function addClient() {
        let text = JSON.stringify({ senderType: "addClient", senderUserID: 0, message: "", });
        websocket.send(text);
    }
    // Handle sendMessage event
    function sendMessage() {
        // Get message
        const errorMessageSlot = document.getElementById("errorMessageSlot");
        const input = document.getElementById("message-input");
        const message = input.value;
        input.value = "";
        let errorMessage = document.getElementById("ErrorMessage");
        // If error messages exists, delete it
        while (errorMessage != null) {
            errorMessage.parentElement.removeChild(errorMessage);
            errorMessage = document.getElementById("ErrorMessage");
        }
        // Check message null
        if (input != null && message == "") {
            let newErrorMessage = document.createElement("div");
            newErrorMessage.id = "ErrorMessage";
            // newErrorMessage.className = "field error";
            newErrorMessage.className = "alert alert-danger";
            newErrorMessage.role = "alert";
            newErrorMessage.textContent = "Enter message";
            errorMessageSlot.appendChild(newErrorMessage);
        } else {
            // Send the message to server
            let text = JSON.stringify({ senderType: "addClientMessage", senderUserID: clientID, message: message, ticketID: ticketID });
            websocket.send(text);
        }
    }
    // Display outgoing and incoming messages
    function displayMessage(message, messageTime, messageTZ, direction) {
        let messageID;
        let messageClass;
        // Remove meaningless "\" in message
        message = message.replaceAll("\\\\", "\\");
        message = message.replaceAll("\\'", "'");
        message = message.replaceAll("\\\"", "\"");
        // Classify incoming or outgoing message
        switch (direction) {
            case "in":
                messageID = "chat-incoming";
                messageClass = "chat incoming";
                break;
            case "out":
                messageID = "chat-outgoing";
                messageClass = "chat outgoing";
                break;
            default:
                console.log("Error when displaying message");
                return;
        }
        // Get chatbox and create message elements
        let chatbox = document.getElementById("chatbox");
        let outerDiv = document.createElement("div");
        let innerDiv = document.createElement("div");
        let messageElement = document.createElement("p");
        let timeDiv = document.createElement("div");
        let arrow = document.createElement("i");
        let time = document.createElement("i");
        // Setup message elements
        outerDiv.id = messageID;
        outerDiv.className = messageClass;
        innerDiv.className = "details";
        messageElement.textContent = message;
        if (direction == "out") {
            timeDiv.style = "float:right";
        }
        else {
            timeDiv.style = "float:left";
        }
        arrow.className = "glyphicon glyphicon-chevron-up";
        time.className = "time";
        let mTime = moment.tz(messageTime, messageTZ);
        time.textContent += mTime.tz(timeZone).format("YYYY/MM/DD HH:mm:ss a z"); // time.textContent += "2077-08-20 22:00:00";
        // Create message format
        innerDiv.appendChild(messageElement);
        timeDiv.appendChild(arrow);
        timeDiv.appendChild(time);
        innerDiv.appendChild(timeDiv);
        outerDiv.appendChild(innerDiv);
        // Display message
        chatbox.appendChild(outerDiv);
    }
    // Display button in chat
    function displayButton(message, onClick) {
        // Get chatbox and create message elements
        let chatbox = document.getElementById("chatbox");
        let button = document.createElement("button");
        let text = document.createElement("b");
        // Setup button elements
        text.textContent = message;
        button.type = "button";
        button.id = "goBackToSigninButton";
        button.className = "btn btn-primary btn-lg btn-block";
        // Create button format
        button.onclick = onClick;
        button.appendChild(text);
        // Display button
        chatbox.appendChild(button);
    }
    function scrollToBottom() {
        const chatArea = document.getElementById("chatbox");
        chatArea.scrollTo(0, chatArea.scrollHeight);
    }
    function returnToSignin() {
        window.location.replace("Signup.html");
    }
    // Check if user data exists
    function checkUserInfos() {
        if (title == null || firstName == null || lastName == null) {
            websocket.close(1000, "Missing user infos");
            // console.log(`title null: ${title == null}`);
            // console.log(`firstName null: ${firstName == null}`);
            // console.log(`lastName null: ${lastName == null}`);
            returnToSignin();
        } else {
            addClient();
        }
        // Delete user data from sessionStorage
        sessionStorage.removeItem("Chatroom-Title");
        sessionStorage.removeItem("Chatroom-FirstName");
        sessionStorage.removeItem("Chatroom-LastName");
    }

    function welcomeMessage() {
        let message = `System message: Hello ${title} ${firstName} ${lastName}. Thank you for your patience. `;
        message += `We appreciate your time and understand that it's valuable. Our team is currently working on your request. `;
        message += `Your conversation ID is ${ticketID}.`;
        let text = JSON.stringify({ senderType: "addClientMessage", senderUserID: clientID, message: message, ticketID: ticketID });
        // console.log(text);
        websocket.send(text);
        scrollToBottom();
        // debugMessages();
    }

    function debugMessages() {
        let message = "Attention citizens. Nuclear strike imminent. Please exit the area at your earliest convenience. Thank you for your cooperation.";
        displayMessage(message, new Date().toUTCString(), timeZone, "in");
        displayMessage(message, new Date().toUTCString(), timeZone, "out");
        displayMessage(message, new Date().toUTCString(), timeZone, "in");
        displayMessage(message, new Date().toUTCString(), timeZone, "out");
        displayMessage(message, new Date().toUTCString(), timeZone, "in");
        displayMessage(message, new Date().toUTCString(), timeZone, "out");
        scrollToBottom();
        // console.log(moment(new Date().toUTCString()).unix());
        // console.log(moment.tz("2077-11-20 16:41:23.266289", timeZone).format("YYYY/MM/DD HH:mm:ss a"));
        // console.log(timeZone);
    }
});