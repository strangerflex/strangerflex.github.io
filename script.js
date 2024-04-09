$(document).ready(function() {
$('#message-input').keydown(function(event) {
        if (event.keyCode === 13) {
            event.preventDefault(); // Prevent default behavior (e.g., newline)
            $('#send-btn').click(); // Simulate click event on Send button
        }
    });
    var interests = localStorage.getItem('interests');
    $('#chat-box').append('<p>Looking for a stranger you can chat with...</p>');

    var userId; // Define userId variable globally

    $.ajax({
        type: 'POST',
        url: '/connect',
        contentType: 'application/json',
        data: JSON.stringify({ interests: interests }),
        success: function(response) {
            userId = response.user_id; // Assign user_id to global userId variable
            waitForConnection(userId);
        }
    });

    function waitForConnection(userId) {
        $.ajax({
            type: 'GET',
            url: 'https://strangerflex.pythonanywhere.com/online_count',
            success: function(response) {
                $('#online-count').text('Online: ' + response.count);
            }
        });
        
        $.ajax({
            type: 'GET',
            url: 'https://strangerflex.pythonanywhere.com/chat/' + userId,
            success: function(response) {
                if (response.connected) {
                    var otherUserId = response.other_user_id;
                    startChat(userId, otherUserId);
                } else {
                    setTimeout(function() {
                        waitForConnection(userId);
                    }, 2000); // Check for connection every 2 seconds
                }
            }
        });
    }

    function startChat(userId, otherUserId) {
        $('#chat-box').empty();
        $('#chat-box').append('<p>Connected with a stranger. Say hi!</p>');

        $('#send-btn').click(function() {
            var message = $('#message-input').val();
            if (message.trim() === '') {
                alert('Message cannot be empty');
                return;
            }
            sendMessage(userId, otherUserId, message);
            $('#message-input').val('');
            displayMessage('You', message, true);
        });

        $('#skip-btn').click(function() {
            disconnect(userId, otherUserId);
            $(this).text('New Chat');
        });

        // Start polling for messages
        setInterval(function() {
            receiveMessage(userId);
        }, 2000); // Poll every 2 seconds
    }

    function sendMessage(userId, otherUserId, message) {
        $.ajax({
            type: 'POST',
            url: 'https://strangerflex.pythonanywhere.com/send_message/' + userId,
            contentType: 'application/json',
            data: JSON.stringify({ message: message }),
            success: function(response) {
                // Message sent successfully
            },
            error: function() {
                alert('Failed to send message');
            }
        });
    }

    function receiveMessage(userId) {
        $.ajax({
            type: 'GET',
            url: 'https://strangerflex.pythonanywhere.com/receive_message/' + userId,
            success: function(response) {
                var messages = response.messages || [];
                messages.forEach(function(message) {
                    displayMessage('Stranger', message, false);
                });
                if (messages.length > 0) {
                    clearMessages(userId);
                }
            }
        });
    }

    function displayMessage(sender, message, isYou) {
        var messageClass = isYou ? 'you-message' : 'stranger-message';
        var messageText = isYou ? 'You: ' + message : 'Stranger: ' + message;
        $('#chat-box').append('<div class="' + messageClass + '"><div>' + messageText + '</div></div>');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    }

    function disconnect(userId, otherUserId) {
        $.ajax({
            type: 'GET',
            url: 'https://strangerflex.pythonanywhere.com/disconnect/' + userId,
            success: function() {
                $.ajax({
                    type: 'GET',
                    url: 'https://strangerflex.pythonanywhere.com/disconnect/' + otherUserId,
                    success: function() {
                        location.reload();
                    }
                });
            }
        });
    }

    function clearMessages(userId) {
        $.ajax({
            type: 'GET',
            url: 'https://strangerflex.pythonanywhere.com/clear_messages/' + userId,
            success: function(response) {
                // Messages cleared successfully
            }
        });
    }
});

