# **App Name**: Star Square Shooter

## Core Features:

- Score Tracking: Tracks and displays the user's score, incrementing by one for each converted opponent.
- Player Lives: Implement a lives system for the player, starting with three lives. Reduce lives upon collision with enemy shots, ending the game when lives reach zero.
- Final Boss Encounter: Upon defeating the initial opponent, introduce a more powerful boss (pentagon) that moves at double speed as the final challenge.
- Collision Detection: Handles collision detection between player, opponents, and shots to trigger score updates or life deductions.
- Game Over Screen: Displays a 'game over' or 'you win' screen based on the game's outcome (lives depleted or boss defeated, respectively).
- Keyboard/Touch Input Handling: Manages player movement based on keyboard arrow keys or touch input on the screen.
- Game State Management: Controls the game loop, updating the game state and rendering elements on the screen at a set interval (50ms).

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to evoke a sense of space and adventure.
- Background color: Dark gray (#303030) to emphasize the game elements.
- Accent color: Bright cyan (#00BCD4) to highlight important information like score and lives.
- Font: 'Space Grotesk' (sans-serif) for headlines and short amounts of body text. Clean, modern look fitting for a space shooter game.
- Simple, geometric icons for displaying lives and score counters.
- Clean, minimalist layout with score and lives displayed at the top of the screen.
- Use particle effects and smooth transitions when an opponent is hit and turns into a star.