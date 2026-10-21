# Goal App  <img width="1899" height="828" alt="image" src="https://github.com/user-attachments/assets/bec32a2b-b485-43c4-b20c-11330228ddcd" />


A personal planning web app for organizing seasonal priorities, long-term goals, daily tasks, and meaningful accomplishments.

Built with React, TypeScript, and Vite. Currently in development.

## Features

- **Priorities:** Add, edit, and remove priorities for the current season.
- **Goals:** Set 3-month, 6-month, or yearly goals and organize them into milestones.
- **Weekly planning:** Review milestone-based weekly task suggestions before adding them to a plan. Track goal progress through completed linked tasks.
- **Daily tasks:** Organize and complete tasks for a selected day.
- **Weekly tasks:** Manage tasks within Monday–Sunday weeks and navigate between weeks.
- **Daily Wins:** Record accomplishments in Physical, Spiritual, Mental, and Soul categories.
- **Calendar:** Browse months and manage dated events.
- **Notes:** Write freely in a notes-style interface without requiring a separate title.
- **Reminders:** Create dated reminders with in-app alerts while the app is open.
- **Books:** Organize a Currently Reading list and a Wishlist.
- **Profile and settings:** Customize the displayed name, bio, text size, and reminder preferences.
- **Themes:** Choose Classic, Midnight, Earthy, Nature, Sunshine, Blue Sky, or Ocean.

## Interface

The home page includes a time-based greeting and navigation to each feature.

Dedicated pages use a back arrow to return home. A floating, blurred navigation menu appears on the home page and hides when scrolling down.

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- Lucide React icons

## Run Locally

Requirements: Node.js and npm.

Clone the repository:

    git clone https://github.com/euphyt/goal-app.git
    cd goal-app

Install dependencies:

    npm install

Start the development server:

    npm run dev

Open the local URL printed in the terminal.

## Production Build

Build the app:

    npm run build

Preview the production build locally:

    npm run preview

## Current Limitations

- No authentication or separate user accounts.
- No database or cross-device synchronization.
- App entries currently use React state and reset when the page reloads.
- Reminder alerts require the app to remain open.
- Weekly plan suggestions use milestone scheduling logic, not AI.
- Goal planning and other workflows are still being tested and refined.

## Planned Improvements

- Persistent storage for entries and preferences.
- User authentication and cloud synchronization.
- Improved goal planning and recurring tasks.
- Further mobile and accessibility improvements.
- Optional AI-assisted goal breakdown with editable suggestions.

## Project Status

An actively developed personal project. Features and interface details may change.
