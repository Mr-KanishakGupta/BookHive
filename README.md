# BookHive 📚🐝

BookHive is a comprehensive mobile application for managing library resources, tracking book returns, handling due date extensions, and providing a seamless experience for both students and library administrators. Built with React Native, Expo, and Firebase.

## Features ✨

*   **Student Panel**: Self-registration, library card-based searches, and borrowing requests.
*   **Admin Dashboard**: Manage books, track active loans, approve/reject extension requests, and handle book returns.
*   **Authentication**: Secure login flow using Firebase Auth.
*   **Database**: Real-time data synchronization using Firestore.
*   **Camera Integration**: (If applicable) Barcode scanning for easy book and library card management using Expo Camera.
*   **Theming**: Light and dark mode support for a comfortable viewing experience.

## Tech Stack 🛠️

*   **Frontend**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
*   **Navigation**: React Navigation (Stack, Drawer, Bottom Tabs)
*   **Backend as a Service**: [Firebase](https://firebase.google.com/) (Authentication, Firestore)
*   **Icons**: [Lucide React Native](https://lucide.dev/)
*   **Animations**: React Native Reanimated

## Prerequisites 📝

Make sure you have the following installed on your local machine:
*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Expo CLI](https://docs.expo.dev/more/expo-cli/)
*   Expo Go app on your iOS/Android device (or setting up Android Studio / Xcode for simulators)

## Installation & Setup 🚀

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/bookhive.git
    cd bookhive/App
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory (this is already ignored in `.gitignore`) and add your Firebase configuration keys. 
    *(Note: if using a `config/firebase.js` file for config, ensure your sensitive keys are secured or environment variables are correctly mapped.)*

4.  **Run the application**
    ```bash
    npx expo start
    ```
    This will open the Expo Metro Bundler in your browser. You can then scan the QR code with the Expo Go app on your physical device, or run it on an emulator/simulator.

## Folder Structure 📁

```text
BookHive/App/
├── assets/         # Images, fonts, and other static assets
├── backend/        # Backend-related configurations (if any)
├── functions/      # Firebase Cloud Functions (if used)
├── src/            # Main application source code
│   ├── config/     # Configuration files (e.g., firebase.js)
│   ├── screens/    # UI screens (AdminLoginScreen, LoginScreen, etc.)
│   └── ...         # Components, hooks, utils
├── App.js          # Entry point of the application
├── package.json    # Project dependencies and scripts
└── ...
```

## Contributing 🤝

Contributions are welcome! Feel free to open an issue or submit a Pull Request.

## License 📄

This project is licensed under the [MIT License](LICENSE).
