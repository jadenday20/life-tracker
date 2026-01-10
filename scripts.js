let userCount = 1;
let playerLifeTotals = [];
let defaultLifeTotal = 20;
let playerColors = {}; // Per-player background colors
let pendingChanges = {}; // Track cumulative changes per player
let changeTimers = {}; // Track timers per player
let colorPickersActive = new Set(); // Track which players have color pickers open

// Default color options
const colorOptions = [
    '#efe8bf',
    '#b4c8e3',
    '#989297',
    '#e8a9a3',
    '#bdd3c1',
    '#ffb6d9',
    '#d8b5e8',
    '#f5ca9e'
];

function getFirstUnusedColor(playerIndex) {
    // Find the first color in the list that is not being used by any other player
    for (let i = 0; i < colorOptions.length; i++) {
        const color = colorOptions[i];
        let isUsed = false;
        
        for (let j = 0; j < userCount; j++) {
            if (j !== playerIndex && playerColors[j] === color) {
                isUsed = true;
                break;
            }
        }
        
        if (!isUsed) {
            return color;
        }
    }
    
    // If all colors are used, return the first color
    return colorOptions[0];
}

function saveGameState() {
    const gameState = {
        userCount: userCount,
        playerLifeTotals: playerLifeTotals,
        defaultLifeTotal: defaultLifeTotal,
        playerColors: playerColors
    };
    localStorage.setItem('lifeTrackerState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('lifeTrackerState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        userCount = gameState.userCount || 1;
        playerLifeTotals = gameState.playerLifeTotals || [];
        defaultLifeTotal = gameState.defaultLifeTotal || 20;
        playerColors = gameState.playerColors || {};
    } else {
        // First-time user defaults: 4 players, 40 life each, first 4 colors
        userCount = 4;
        defaultLifeTotal = 40;
        playerLifeTotals = [40, 40, 40, 40];
        
        // Assign first 4 colors
        for (let i = 0; i < 4; i++) {
            playerColors[i] = colorOptions[i];
        }
    }
}

function createPlayer(playerIndex, lifeTotal) {
    const playerContainer = document.querySelector('#playerContainer');
    const player = document.createElement('div');
    player.className = 'player';
    player.dataset.playerIndex = playerIndex;
    
    // Set default colors for this player
    let bgColor = playerColors[playerIndex];
    
    if (!bgColor) {
        // Get the first unused color
        const defaultColor = getFirstUnusedColor(playerIndex);
        bgColor = defaultColor;
        playerColors[playerIndex] = bgColor;
    }
    
    player.style.backgroundColor = bgColor;
    
    const lifeTotalElement = document.createElement('span');
    lifeTotalElement.className = 'lifeTotal';
    lifeTotalElement.textContent = lifeTotal;
    lifeTotalElement.addEventListener('click', function() {
        openSetLifeModal(playerIndex);
    });
    player.appendChild(lifeTotalElement);
    
    const changePopup = document.createElement('div');
    changePopup.className = 'change-popup';
    changePopup.dataset.playerIndex = playerIndex;
    player.appendChild(changePopup);
    
    const diceBackground = document.createElement('div');
    diceBackground.className = 'diceBackground';
    diceBackground.dataset.playerIndex = playerIndex;
    player.appendChild(diceBackground);
    
    const diceValue = document.createElement('div');
    diceValue.className = 'diceValue';
    diceValue.dataset.playerIndex = playerIndex;
    player.appendChild(diceValue);
    
    const incrementButton = document.createElement('button');
    incrementButton.classList.add('lifeButton', 'increment');
    const incrementSpan = document.createElement('span');
    incrementSpan.className = 'button-text';
    incrementSpan.textContent = '+';
    incrementButton.appendChild(incrementSpan);
    incrementButton.addEventListener('click', function() {
        playerLifeTotals[playerIndex]++;
        trackChange(playerIndex, 1);
        updateDisplay();
    });
    player.appendChild(incrementButton);
    
    const decrementButton = document.createElement('button');
    decrementButton.classList.add('lifeButton', 'decrement');
    const decrementSpan = document.createElement('span');
    decrementSpan.className = 'button-text';
    decrementSpan.textContent = '-';
    decrementButton.appendChild(decrementSpan);
    decrementButton.addEventListener('click', function() {
        playerLifeTotals[playerIndex]--;
        trackChange(playerIndex, -1);
        updateDisplay();
    });
    player.appendChild(decrementButton);
    
    // Add color picker button at the bottom
    const colorButton = document.createElement('button');
    colorButton.className = 'color-picker-btn';
    colorButton.textContent = '🎨';
    colorButton.dataset.playerIndex = playerIndex;
    colorButton.addEventListener('click', function(e) {
        e.stopPropagation();
        togglePlayerColorPicker(playerIndex);
    });
    player.appendChild(colorButton);
    
    playerContainer.appendChild(player);
}

function trackChange(playerIndex, amount) {
    // Initialize pending changes for this player if not already done
    if (pendingChanges[playerIndex] === undefined) {
        pendingChanges[playerIndex] = 0;
    }
    
    // Add to cumulative change
    pendingChanges[playerIndex] += amount;
    
    // Clear existing timer for this player
    if (changeTimers[playerIndex]) {
        clearTimeout(changeTimers[playerIndex]);
    }
    
    // Show popup with current change amount
    showChangePopup(playerIndex, pendingChanges[playerIndex]);
    
    // Set new timer
    changeTimers[playerIndex] = setTimeout(() => {
        hideChangePopup(playerIndex);
        delete pendingChanges[playerIndex];
        delete changeTimers[playerIndex];
    }, 4000);
}

function showChangePopup(playerIndex, amount) {
    const player = document.querySelector(`.player[data-player-index="${playerIndex}"]`);
    const popup = player.querySelector('.change-popup');
    
    const sign = amount > 0 ? '+' : '';
    popup.textContent = sign + amount;
    popup.classList.add('active');
}

function hideChangePopup(playerIndex) {
    const player = document.querySelector(`.player[data-player-index="${playerIndex}"]`);
    const popup = player.querySelector('.change-popup');
    popup.classList.remove('active');
}

function openSetLifeModal(playerIndex) {
    const modal = document.createElement('div');
    modal.className = 'life-modal-overlay';
    
    const modalContent = document.createElement('form');
    modalContent.className = 'life-modal';
    
    const title = document.createElement('h3');
    title.id = `life-modal-title-${playerIndex}`;
    title.textContent = 'Set Life Total';
    modalContent.appendChild(title);
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'life-input';
    input.inputMode = 'numeric';
    input.setAttribute('aria-labelledby', `life-modal-title-${playerIndex}`);
    input.name = 'lifeTotal';
    input.value = playerLifeTotals[playerIndex];
    input.min = '0';
    modalContent.appendChild(input);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'modal-btn cancel-btn';
    cancelBtn.addEventListener('click', function() {
        modal.remove();
    });
    buttonContainer.appendChild(cancelBtn);
    
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'submit';
    confirmBtn.textContent = 'Set';
    confirmBtn.className = 'modal-btn confirm-btn';
    buttonContainer.appendChild(confirmBtn);
    
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Handle form submission
    modalContent.addEventListener('submit', function(e) {
        e.preventDefault();
        const newValue = parseInt(input.value);
        if (!isNaN(newValue)) {
            playerLifeTotals[playerIndex] = newValue;
            updateDisplay();
        }
        modal.remove();
    });
    
    // Focus and select the input
    input.focus();
    input.select();
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });
}

function updateDisplay() {
    const players = document.querySelectorAll('.player');
    players.forEach((player, index) => {
        const lifeTotalElement = player.querySelector('.lifeTotal');
        lifeTotalElement.textContent = playerLifeTotals[index];
    });
    saveGameState();
}

function updateUserCount(count) {
    userCount = count;
    
    const playerContainer = document.querySelector('#playerContainer');
    playerContainer.innerHTML = '';
    
    const lifeTotal = defaultLifeTotal;
    
    playerLifeTotals = [];
    for (let i = 0; i < count; i++) {
        playerLifeTotals[i] = lifeTotal;
        createPlayer(i, lifeTotal);
    }
    
    document.body.dataset.playerCount = count;
    saveGameState();
}

function restoreGameUI() {
    const playerContainer = document.querySelector('#playerContainer');
    playerContainer.innerHTML = '';
    
    for (let i = 0; i < userCount; i++) {
        createPlayer(i, playerLifeTotals[i]);
    }
}

function toggleSettings() {
    const overlay = document.querySelector('#settingsOverlay');
    overlay.classList.toggle('active');
}

function closeMenu() {
    // Close all submenus
    document.querySelectorAll('.settings-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show main menu
    document.querySelector('#settingsMenu').classList.add('active');
    
    // Close the overlay
    document.querySelector('#settingsOverlay').classList.remove('active');
}

// Settings button
document.querySelector('#settingsButton').addEventListener('click', function() {
    toggleSettings();
});

document.querySelector('#closeSettingsButton').addEventListener('click', function() {
    toggleSettings();
});

// Menu navigation
document.querySelectorAll('.menu-btn').forEach(button => {
    button.addEventListener('click', function() {
        const menuType = this.dataset.menu;
        showSettingsView(menuType);
    });
});

// Back buttons
document.querySelectorAll('.back-btn').forEach(button => {
    button.addEventListener('click', function() {
        showSettingsView('menu');
    });
});

function showSettingsView(viewName) {
    document.querySelectorAll('.settings-view').forEach(view => {
        view.classList.remove('active');
    });
    
    if (viewName === 'menu') {
        document.querySelector('#settingsMenu').classList.add('active');
    } else if (viewName === 'players') {
        document.querySelector('#playersView').classList.add('active');
    } else if (viewName === 'life') {
        document.querySelector('#lifeView').classList.add('active');
    }
}

function togglePlayerColorPicker(playerIndex) {
    // Check if picker is already open
    if (colorPickersActive.has(playerIndex)) {
        // Toggle off - close the existing picker
        const existingPicker = document.querySelector(`.player-color-picker[data-player-index="${playerIndex}"]`);
        if (existingPicker) {
            existingPicker.remove();
        }
        colorPickersActive.delete(playerIndex);
        return;
    }
    
    colorPickersActive.add(playerIndex);
    const player = document.querySelector(`.player[data-player-index="${playerIndex}"]`);
    
    // Create color picker popup
    const picker = document.createElement('div');
    picker.className = 'player-color-picker';
    picker.dataset.playerIndex = playerIndex;
    
    colorOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'player-color-option';
        btn.style.backgroundColor = option;
        btn.textContent = '';
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            playerColors[playerIndex] = option;
            player.style.backgroundColor = option;
            saveGameState();
            picker.remove();
            colorPickersActive.delete(playerIndex);
        });
        picker.appendChild(btn);
    });
    
    player.appendChild(picker);
}

// Close overlay when clicking outside the modal
document.querySelector('#settingsOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        toggleSettings();
    }
});

// Player count buttons
document.querySelectorAll('.player-btn').forEach(button => {
    button.addEventListener('click', function() {
        const count = parseInt(this.dataset.players);
        updateUserCount(count);
        closeMenu();
    });
});

// Life total buttons
document.querySelectorAll('.life-btn').forEach(button => {
    button.addEventListener('click', function() {
        const lifeTotal = parseInt(this.dataset.life);
        defaultLifeTotal = lifeTotal;
        // Reset all players to new life total
        updateUserCount(userCount);
        closeMenu();
    });
});

// Custom life total button
document.querySelector('#customLifeBtn').addEventListener('click', function() {
    const customValue = parseInt(document.querySelector('#customLifeInput').value);
    if (!isNaN(customValue) && customValue > 0) {
        defaultLifeTotal = customValue;
        // Reset all players to new life total
        updateUserCount(userCount);
        document.querySelector('#customLifeInput').value = '';
        closeMenu();
    }
});

// Dice rolling functionality
function rollDice() {
    // Create array of numbers 1-20
    const diceNumbers = Array.from({length: 20}, (_, i) => i + 1);
    
    // Shuffle the array
    for (let i = diceNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [diceNumbers[i], diceNumbers[j]] = [diceNumbers[j], diceNumbers[i]];
    }
    
    // Assign unique numbers to each player
    const diceValues = {};
    for (let i = 0; i < userCount; i++) {
        diceValues[i] = diceNumbers[i];
    }
    
    // Find the winner (highest roll)
    let winnerIndex = 0;
    let maxValue = diceValues[0];
    for (let i = 1; i < userCount; i++) {
        if (diceValues[i] > maxValue) {
            maxValue = diceValues[i];
            winnerIndex = i;
        }
    }
    
    // Display dice values and backgrounds on each player
    document.querySelectorAll('.diceValue').forEach(diceElement => {
        const playerIndex = parseInt(diceElement.dataset.playerIndex);
        if (diceValues[playerIndex] !== undefined) {
            diceElement.textContent = diceValues[playerIndex];
            diceElement.classList.add('active');
            
            // Highlight winner
            if (playerIndex === winnerIndex) {
                diceElement.classList.add('winner');
            }
            
            // Also show the background
            const bgElement = document.querySelector(`.diceBackground[data-player-index="${playerIndex}"]`);
            if (bgElement) bgElement.classList.add('active');
        }
    });
    
    // Add click listener to hide dice results (with slight delay to avoid immediate trigger)
    const hideDiceResults = () => {
        document.querySelectorAll('.diceValue').forEach(diceElement => {
            diceElement.classList.remove('active');
            diceElement.classList.remove('winner');
        });
        document.querySelectorAll('.diceBackground').forEach(bgElement => {
            bgElement.classList.remove('active');
        });
        document.removeEventListener('click', hideDiceResults);
        clearTimeout(diceTimeout);
    };
    
    setTimeout(() => {
        document.addEventListener('click', hideDiceResults);
    }, 100);
    
    // Hide dice values and backgrounds after 8 seconds
    const diceTimeout = setTimeout(() => {
        document.querySelectorAll('.diceValue').forEach(diceElement => {
            diceElement.classList.remove('active');
            diceElement.classList.remove('winner');
        });
        document.querySelectorAll('.diceBackground').forEach(bgElement => {
            bgElement.classList.remove('active');
        });
        document.removeEventListener('click', hideDiceResults);
    }, 8000);
    
    closeMenu();
}

document.querySelector('#rollDiceMenuButton').addEventListener('click', rollDice);
loadGameState();
restoreGameUI();
document.body.dataset.playerCount = userCount;