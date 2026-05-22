// Copy of dashboard.js for public folder
const API_BASE_URL = 'http://localhost:5000';
let currentUser = null;

// Initialize dashboard
async function initializeDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/user`, {
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = 'index.html';
            return;
        }

        const data = await response.json();
        currentUser = data.user;
        
        updateUserInfo();
        loadChatHistory();
    } catch (error) {
        console.error('Failed to load user:', error);
        window.location.href = 'index.html';
    }
}

// Update user information in UI
function updateUserInfo() {
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-avatar').src = currentUser.avatar || 'https://via.placeholder.com/40';
        
        // Update profile tab
        document.getElementById('profile-name').textContent = currentUser.name;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-avatar').src = currentUser.avatar || 'https://via.placeholder.com/150';
        
        const joinDate = new Date(currentUser.createdAt).toLocaleDateString();
        document.getElementById('profile-joined').textContent = `Joined: ${joinDate}`;
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update page title
    const titles = {
        chat: 'Chat with AI',
        knowledge: 'Knowledge Base',
        history: 'Chat History',
        profile: 'Profile'
    };
    document.getElementById('page-title').textContent = titles[tabName];
    
    // Load history when switching to history tab
    if (tabName === 'history') {
        loadChatHistory();
    }
}

// Send message to AI
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    messageInput.value = '';
    
    // Show loading indicator
    addMessageToChat('Thinking...', 'loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        
        // Remove loading indicator
        const loadingMsg = document.querySelector('.chat-message.loading');
        if (loadingMsg) loadingMsg.remove();
        
        // Add AI response
        addMessageToChat(data.response, 'ai');
        
    } catch (error) {
        console.error('Chat error:', error);
        const loadingMsg = document.querySelector('.chat-message.loading');
        if (loadingMsg) loadingMsg.remove();
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'error');
    }
}

// Add message to chat UI
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Remove welcome message if exists
    const welcome = chatMessages.querySelector('.chat-welcome');
    if (welcome) welcome.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (sender === 'loading') {
        messageContent.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    } else {
        messageContent.textContent = message;
    }
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Load chat history
async function loadChatHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chats`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load history');
        
        const data = await response.json();
        const historyList = document.getElementById('history-list');
        
        if (data.chats && data.chats.length > 0) {
            historyList.innerHTML = '';
            data.chats.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.className = 'history-item';
                
                const date = new Date(chat.createdAt).toLocaleString();
                const preview = chat.userMessage.substring(0, 50) + (chat.userMessage.length > 50 ? '...' : '');
                
                chatItem.innerHTML = `
                    <div class="history-question">${preview}</div>
                    <div class="history-date">${date}</div>
                `;
                
                chatItem.addEventListener('click', () => {
                    addMessageToChat(chat.userMessage, 'user');
                    addMessageToChat(chat.aiResponse, 'ai');
                    switchTab('chat');
                });
                
                historyList.appendChild(chatItem);
            });
        } else {
            historyList.innerHTML = '<p>No chat history yet. Start chatting!</p>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('history-list').innerHTML = '<p>Error loading history</p>';
    }
}

// Handle Enter key in input
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Logout
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            credentials: 'include'
        });
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Check if already logged in
async function checkAuth() {
    try {
        const token = new URLSearchParams(window.location.search).get('token');
        if (token) {
            localStorage.setItem('authToken', token);
            window.location.href = 'dashboard.html';
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/user`, {
            credentials: 'include'
        });
        if (response.ok) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.log('Not authenticated');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on
    if (document.getElementById('message-input')) {
        initializeDashboard();
    } else if (document.getElementById('message-input') === null && document.querySelector('.auth-container')) {
        checkAuth();
    }
});
