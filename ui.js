// UI utility functions for chess puzzles application

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '1000';
        notification.style.maxWidth = '300px';
        notification.style.transition = 'all 0.3s ease';
        document.body.appendChild(notification);
    }
    
    // Set notification style based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#F44336';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = '#FF9800';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
            notification.style.color = 'white';
    }
    
    // Set message
    notification.textContent = message;
    
    // Make notification visible
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Update puzzle progress animation
function updatePuzzleProgress(percent) {
    const progressBar = document.getElementById('puzzle-progress');
    if (!progressBar) return;
    
    progressBar.style.width = `${percent}%`;
}

// Helper function to create confetti effect for solved puzzles
function showConfetti() {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    canvas.style.zIndex = '999';
    document.body.appendChild(canvas);
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get context
    const ctx = canvas.getContext('2d');
    
    // Confetti particles
    const particles = [];
    const particleCount = 100;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39'];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            speed: Math.random() * 3 + 2
        });
    }
    
    // Animation function
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // Update position
            p.y += p.speed;
            
            // Reset if out of bounds
            if (p.y > canvas.height) {
                particles[i].y = -10;
                particles[i].x = Math.random() * canvas.width;
            }
            
            // Draw particle
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.rect(p.x, p.y, p.size, p.size);
            ctx.fill();
        }
        
        // Continue animation
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Remove after 3 seconds
    setTimeout(() => {
        canvas.remove();
    }, 3000);
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Create achievement notification
function showAchievement(title, description) {
    // Create achievement element
    const achievement = document.createElement('div');
    achievement.className = 'achievement';
    achievement.style.position = 'fixed';
    achievement.style.bottom = '20px';
    achievement.style.left = '50%';
    achievement.style.transform = 'translateX(-50%)';
    achievement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    achievement.style.color = 'white';
    achievement.style.padding = '15px 20px';
    achievement.style.borderRadius = '10px';
    achievement.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    achievement.style.zIndex = '1000';
    achievement.style.minWidth = '250px';
    achievement.style.transition = 'all 0.5s ease';
    achievement.style.opacity = '0';
    achievement.style.transform = 'translateX(-50%) translateY(100px)';
    
    // Create achievement content
    achievement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 24px;">🏆</div>
            <div>
                <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
                <div style="font-size: 14px; opacity: 0.8;">${description}</div>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(achievement);
    
    // Show achievement
    setTimeout(() => {
        achievement.style.opacity = '1';
        achievement.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Hide after 5 seconds
    setTimeout(() => {
        achievement.style.opacity = '0';
        achievement.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => {
            achievement.remove();
        }, 500);
    }, 5000);
}

// Check achievements when puzzle is solved
function checkAchievements(stats) {
    const memberId = sessionStorage.getItem("memberId");
    if (!memberId) return;
    
    // Check if achievements have been already awarded
    database.ref(`users/${memberId}/achievements`).once('value')
        .then((snapshot) => {
            const achievements = snapshot.val() || {};
            
            // Define achievement criteria
            const achievementsList = [
                {
                    id: 'first_puzzle',
                    title: 'First Steps',
                    description: 'Solve your first puzzle',
                    condition: stats.solved >= 1,
                    points: 10
                },
                {
                    id: 'five_puzzles',
                    title: 'Getting Started',
                    description: 'Solve 5 puzzles',
                    condition: stats.solved >= 5,
                    points: 20
                },
                {
                    id: 'ten_puzzles',
                    title: 'Puzzle Enthusiast',
                    description: 'Solve 10 puzzles',
                    condition: stats.solved >= 10,
                    points: 30
                },
                {
                    id: 'fifty_points',
                    title: 'Point Collector',
                    description: 'Earn 50 points',
                    condition: stats.points >= 50,
                    points: 25
                },
                {
                    id: 'hundred_points',
                    title: 'Chess Master',
                    description: 'Earn 100 points',
                    condition: stats.points >= 100,
                    points: 50
                }
            ];
            
            // Check each achievement
            achievementsList.forEach(achievement => {
                if (achievement.condition && !achievements[achievement.id]) {
                    // Award achievement
                    database.ref(`users/${memberId}/achievements/${achievement.id}`).set({
                        title: achievement.title,
                        description: achievement.description,
                        earnedAt: new Date().toISOString(),
                        points: achievement.points
                    });
                    
                    // Add bonus points
                    const currentPoints = stats.points || 0;
                    database.ref(`users/${memberId}/stats/points`).set(currentPoints + achievement.points);
                    
                    // Show achievement notification
                    showAchievement(achievement.title, achievement.description);
                    
                    // Update points display
                    const userPointsElement = document.getElementById('user-points');
                    if (userPointsElement) {
                        userPointsElement.textContent = currentPoints + achievement.points;
                    }
                }
            });
        })
        .catch(error => {
            console.error("Error checking achievements:", error);
        });
}

// Update user profile UI
function updateUserProfileUI(userData) {
    const userNameElement = document.getElementById('user-name');
    const userAvatarElement = document.getElementById('user-avatar');
    
    if (userData && userData.name) {
        if (userNameElement) {
            userNameElement.textContent = userData.name;
        }
        
        if (userAvatarElement) {
            // Set avatar with initials
            const initials = userData.name.split('-')
                .map(part => part.charAt(0).toUpperCase())
                .join('');
            userAvatarElement.textContent = initials;
        }
    }
}

// Update theme preference
function updateThemePreference(darkMode) {
    const body = document.body;
    
    if (darkMode) {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

// Initialize theme from localStorage
function initializeTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    updateThemePreference(darkMode);
}

// Load user achievements
function loadUserAchievements(memberId) {
    if (!memberId) return;
    
    database.ref(`users/${memberId}/achievements`).once('value')
        .then((snapshot) => {
            const achievements = snapshot.val() || {};
            const achievementsContainer = document.getElementById('achievements-container');
            
            if (achievementsContainer) {
                // Clear container
                achievementsContainer.innerHTML = '';
                
                if (Object.keys(achievements).length === 0) {
                    achievementsContainer.innerHTML = '<p>No achievements yet. Solve puzzles to earn achievements!</p>';
                    return;
                }
                
                // Create achievement elements
                Object.entries(achievements).forEach(([id, achievement]) => {
                    const achievementElement = document.createElement('div');
                    achievementElement.className = 'achievement-item';
                    achievementElement.innerHTML = `
                        <div class="achievement-title">
                            <span class="achievement-icon">🏆</span>
                            <span>${achievement.title}</span>
                        </div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-info">
                            <span class="achievement-points">+${achievement.points} points</span>
                            <span class="achievement-date">${new Date(achievement.earnedAt).toLocaleDateString()}</span>
                        </div>
                    `;
                    achievementsContainer.appendChild(achievementElement);
                });
            }
        })
        .catch(error => {
            console.error("Error loading achievements:", error);
        });
}

// Show difficulty filter UI
function showDifficultyFilter() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'difficulty-filter';
    filterContainer.innerHTML = `
        <label>Filter by difficulty:</label>
        <select id="difficulty-select">
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
        </select>
    `;
    
    const puzzleHeader = document.querySelector('.puzzle-header');
    if (puzzleHeader) {
        puzzleHeader.appendChild(filterContainer);
        
        // Add event listener to filter select
        const difficultySelect = document.getElementById('difficulty-select');
        difficultySelect.addEventListener('change', (e) => {
            const difficulty = e.target.value;
            filterPuzzlesByDifficulty(difficulty);
        });
    }
}

// Filter puzzles by difficulty
function filterPuzzlesByDifficulty(difficulty) {
    // This function would be implemented in puzzles.js
    // We'll just trigger a custom event here
    const event = new CustomEvent('filterDifficulty', { detail: { difficulty } });
    document.dispatchEvent(event);
}

// Update puzzle history
function updatePuzzleHistory(puzzleId, result) {
    const memberId = sessionStorage.getItem("memberId");
    if (!memberId) return;
    
    const historyEntry = {
        puzzleId,
        timestamp: new Date().toISOString(),
        result // 'solved', 'failed', 'hint', etc.
    };
    
    // Push to history array
    database.ref(`users/${memberId}/history`).push(historyEntry);
}

// Initialize UI components
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initializeTheme();
    
    // Add dark mode toggle if it exists
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.checked = darkMode;
        
        darkModeToggle.addEventListener('change', (e) => {
            updateThemePreference(e.target.checked);
        });
    }
    
    // Initialize any other UI components
    const puzzlesTab = document.getElementById('puzzles-tab');
    if (puzzlesTab) {
        // Show difficulty filter in puzzles tab
        showDifficultyFilter();
    }
});