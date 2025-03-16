# TimeWarp Focus

TimeWarp Focus is a productivity app that combines genuinely useful task management with absurd visual representations and humor. It's both a practical tool and a satirical take on productivity culture.

## Features

### 🗓️ Task Management
- Create, edit, and complete tasks with deadlines and importance levels
- Tasks progressively get more dramatic as deadlines approach
- Procrastinate too much and your tasks will literally run away from you in 3D space

### ⏱️ Focus Timer
- Standard focus timer with Pomodoro-style functionality
- Reality-distorting effects that alter time perception
- Time can slow down, speed up, or even flow backward at extreme distortion levels

### 📊 Productivity Stats
- Track completion rates, procrastination index, and focus time
- Stats delivered by AI personalities that range from supportive to unhinged
- Ridiculous projections and comparisons based on your productivity metrics

### 🏆 Achievements
- Over-the-top achievements that parody gamification trends
- Unlock achievements for both productivity wins and spectacular procrastination
- Secret "mystery" achievements that can only be unlocked through unexpected actions

### 🌄 3D Productivity Landscape
- Visualize your productivity as a surreal 3D landscape
- Focus Mountain that grows with your completed tasks
- Procrastination Swamp that expands with your avoidance 
- Other absurd metaphors like Achievement Island and Time Warp Zone

## Tech Stack

- **React**: For UI components and state management
- **Next.js**: React framework for the app structure
- **Three.js**: 3D visualizations and animations
- **React Three Fiber**: React renderer for Three.js
- **Zustand**: State management
- **Framer Motion**: Animations and transitions
- **TailwindCSS**: Styling

## Getting Started

1. Clone the repository
2. Install dependencies
   ```
   npm install --legacy-peer-deps
   ```
3. Run the development server
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Why the Legacy Peer Deps Flag?

This project uses React 19 which has some compatibility issues with certain Three.js-related packages. We use the `--legacy-peer-deps` flag to bypass these compatibility checks while still allowing the app to work correctly.

## Project Philosophy

TimeWarp Focus deliberately walks the line between genuinely useful functionality and absurdist humor. It's designed to:

1. Actually help you manage tasks and focus
2. Make you laugh at productivity culture's extremes
3. Provide visual feedback that makes productivity more engaging
4. Embrace the struggle of procrastination rather than pretending it doesn't exist

## License

MIT
