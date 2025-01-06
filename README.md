# Stock Management Application

A modern web and mobile application for managing stock inventory across different locations.

## Features

- Three main stock categories: Head Office, Katra Ghee, and Novelty
- Add, delete, and manage items with photos
- Stock entry through Excel upload or manual entry
- Clean and professional user interface
- Real-time data synchronization with Firebase

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database and Storage
   - Replace the Firebase configuration in `src/firebase.js` with your project's configuration

3. Start the development server:
```bash
npm start
```

## Project Structure

- `/src/pages/`: Contains the main page components
  - `MainPage.js`: Landing page with three main category buttons
  - `StockPage.js`: Stock management page with item operations
  - `ItemDetailsPage.js`: Detailed item view with stock entry options
- `/src/firebase.js`: Firebase configuration and initialization

## Technologies Used

- React 18
- Material-UI
- Firebase (Firestore & Storage)
- React Router
- XLSX for Excel file processing
