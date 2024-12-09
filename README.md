# P2P File Sharing Application

## Overview

The P2P File Sharing Application is an Electron-based desktop application designed to facilitate peer-to-peer (P2P) file sharing between users within a local network. It leverages a central server to manage user registrations, logins, and the sharing of file metadata, while actual file transfers occur directly between peers. This architecture ensures efficient and secure file distribution without overloading the central server.

## Features

- **User Registration and Authentication:** Secure user sign-up and login functionality.
- **File Sharing:** Users can select and share files with others on the network.
- **Peer Discovery:** The application discovers active peers through regular heartbeats to maintain an updated list of available files.
- **File Searching and Downloading:** Users can search for shared files and download them directly from peers.
- **Heartbeat Mechanism:** Ensures active peer status and removes inactive peers from the network.
- **Concurrent Operations:** Handles multiple file transfers simultaneously without performance degradation.
- **Responsive UI:** Intuitive and user-friendly interface for seamless interaction.

![image](https://github.com/user-attachments/assets/b6e0da80-dec3-4403-a3be-bf6b3f7b2a7f)
![image](https://github.com/user-attachments/assets/4ef4fc2b-e5f6-4715-968c-0b2de5bf3008)


## Technologies Used

- **Electron:** Framework for building cross-platform desktop applications with JavaScript, HTML, and CSS.
- **Node.js:** JavaScript runtime for executing server-side code.
- **Express.js:** Web framework for building the central server API.
- **SQLite:** Lightweight relational database for storing user and file information.
- **Luxon:** Library for handling dates and times.
- **Portfinder:** Utility to find open ports for peer servers.
- **@electron/remote:** Facilitates communication between the main and renderer processes in Electron.

## Folder Structure

```
project/
├── server/
│   ├── server.js           # Main server application
│   ├── db.js                # Database setup and utility functions
│   ├── cleanup.js           # Periodic cleanup of inactive peers
│   ├── package.json         # Server dependencies and scripts
│   └── p2p.db               # SQLite database file
├── client/
│   ├── main.js              # Electron main process script
│   ├── renderer.js          # Renderer process script handling UI interactions
│   ├── index.html           # HTML structure of the client application
│   ├── style.css            # CSS styling for the client application
│   ├── shared_files/        # Directory to store files shared by the user
│   ├── downloads/           # Directory to store downloaded files
│   └── package.json         # Client dependencies and scripts
├── .env                     # Environment variables configuration
├── package.json             # Top-level project dependencies and scripts
└── README.md                # Project documentation
```

## Installation

### Prerequisites

- **Node.js:** Ensure you have Node.js installed on your system. You can download it from [Node.js Official Website](https://nodejs.org/).
- **Git:** To clone the repository. Download from [Git Official Website](https://git-scm.com/).

### Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/mridul249/p2p_electron.git
   cd p2p_electron
   ```

2. **Set Up Environment Variables:**

   Create a `.env` file in the project root directory and add the server IP address.

   ```
   SERVER_IP=YOUR_LAN_IP
   ```

   Replace `YOUR_LAN_IP` with the actual IP address of your server.

3. **Install Top-Level Dependencies:**

   ```bash
   npm install
   ```

4. **Set Up the Server:**

   ```bash
   cd server
   npm install
   ```

5. **Set Up the Client:**

   ```bash
   cd ../client
   npm install
   ```

## Configuration

### Server Configuration

- **IP Address:** Ensure that the `HOST` variable in `server/server.js` matches the IP address specified in the `.env` file.
- **Port:** The server listens on port `5001` by default. Ensure this port is open and not blocked by firewalls.

### Client Configuration

- **Server URL:** In `client/renderer.js`, the `SERVER_URL` should be set to the IP address and port of the central server. It dynamically reads from the `.env` file.

## Running the Application

### Starting the Server and Client

From the project root directory, you can start both the server and client concurrently using the following command:

```bash
npm run start
```

This command utilizes the `concurrently` package to run both the server and Electron client simultaneously.

### Accessing the Client

Once both the server and client are running:

1. Open the Electron application window.
2. Register a new user or log in with existing credentials.
3. Use the interface to share files, search for available files, and download files from other peers.

## Code Flow

### Server (`server/server.js`)

1. **User Registration (`/register`):**
   - Receives username, password, IP, and port from the client.
   - Validates input and stores user information in the SQLite database.
   - Responds with success or error messages.

2. **User Login (`/login`):**
   - Receives username, password, IP, and port.
   - Authenticates user credentials against the database.
   - Updates the user's last seen and heartbeat timestamps.
   - Responds with user data or error messages.

3. **Heartbeat (`/heartbeat`):**
   - Receives periodic heartbeat signals from the client to indicate active status.
   - Updates the user's last heartbeat timestamp in the database.

4. **File Sharing (`/share_files`):**
   - Receives shared file metadata from the client.
   - Updates the database with the list of files shared by the user.
   - Ensures that only active peers have their files listed.

5. **File Retrieval (`/files` & `/search_files`):**
   - Provides clients with a list of available files based on search criteria.
   - Ensures that only files from active peers are listed.

6. **Disconnect (`/disconnect`):**
   - Handles user disconnections by removing user and file data from the database.

7. **Periodic Cleanup:**
   - Every 30 seconds, the server runs a cleanup process to remove inactive peers and their associated files.

### Client (`client/renderer.js`)

1. **User Interface Interaction:**
   - Handles user inputs for registration, login, file sharing, and searching.
   - Updates the UI based on user actions and server responses.

2. **Registration & Login:**
   - Sends user credentials to the server for registration or authentication.
   - On successful login, starts the peer server and begins sending heartbeats.

3. **Heartbeat Mechanism:**
   - Sends heartbeat signals to the server every 30 seconds to indicate active status.

4. **File Sharing:**
   - Opens a file dialog for users to select files to share.
   - Copies selected files to the `shared_files` directory.
   - Sends file metadata to the server for distribution.

5. **File Searching & Downloading:**
   - Allows users to search for files based on filename or username.
   - Displays a list of available files with options to download.
   - Initiates direct file downloads from peers and saves them to the `downloads` directory.

6. **Peer Server Management:**
   - Communicates with the main Electron process to start a local server for handling incoming file requests.

## Usage

1. **Registering a New User:**
   - Open the Electron application.
   - Enter a unique username and password.
   - Click the "Sign Up" button.
   - A success message will confirm registration.

2. **Logging In:**
   - Enter your registered username and password.
   - Click the "Login" button.
   - Upon successful login, the main interface becomes accessible.

3. **Sharing Files:**
   - Click the "Share New File" button.
   - Select one or multiple files from the file dialog.
   - Confirm to share the selected files.
   - Shared files will appear in the "Available Files" list.

4. **Searching for Files:**
   - Enter a filename or username in the search fields.
   - Click the "Search" button to filter available files.
   - Click "Clear" to reset the search filters.
   - Click "Refresh Files" to update the file list.

5. **Downloading Files:**
   - Browse the "Available Files" list.
   - Click the "Download" button next to a desired file.
   - Monitor the download progress in the "Download Progress" section.
   - Completed downloads will be available in the `downloads` directory.

## Troubleshooting

1. **Incorrect IP Address Detection:**
   - Ensure that the device is connected via Wi-Fi.
   - Verify that the `getLocalIP` function in `renderer.js` correctly identifies the Wi-Fi interface.
   - Check server logs to confirm the received IP address matches the device's Wi-Fi IP.

2. **Persistent User Data After Database Deletion:**
   - Ensure that the `p2p.db` file is completely removed before restarting the server.
   - Confirm that there are no multiple instances of the server running that might be accessing a different database file.
   - Check file permissions to ensure the server has the necessary rights to create and modify the database file.

3. **Shared Files Not Updating:**
   - Verify that the server's `/share_files` endpoint receives the correct file metadata.
   - Ensure that heartbeats are being sent regularly to keep the peer active.
   - Check the `shared_files` directory to confirm that files are being copied correctly.

4. **Download Failures:**
   - Ensure that the peer (source) is online and actively sharing files.
   - Verify network connectivity between the client and the peer.
   - Check firewall settings to allow necessary ports for file transfers.

## Configuration File

### `.env` File

Create a `.env` file in the project root directory to store environment variables. This file should contain the server's IP address, which is crucial for the client to communicate with the server.

```
SERVER_IP=YOUR_LAN_IP
```

**Note:** Replace `YOUR_LAN_IP` with the actual IP address of your server. This IP address should be accessible to all clients within the local network.

## Security Considerations

- **Password Management:** Passwords are stored in plaintext in the database. For enhanced security, implement hashing (e.g., using `bcrypt`) before storing passwords.
- **Network Security:** Ensure that your local network is secure to prevent unauthorized access to shared files.
- **Input Validation:** Implement thorough input validation on both client and server sides to prevent injection attacks and other security vulnerabilities.

## Contributing

Contributions are welcome! If you'd like to improve the project, please follow these steps:

1. **Fork the Repository:**
   - Click the "Fork" button at the top right of the repository page.

2. **Create a New Branch:**
   - Navigate to your forked repository.
   - Create a new branch for your feature or bug fix.

3. **Make Changes:**
   - Implement your changes in the new branch.

4. **Commit and Push:**
   - Commit your changes with clear and descriptive messages.
   - Push the changes to your forked repository.

5. **Create a Pull Request:**
   - Navigate to the original repository.
   - Click the "New Pull Request" button.
   - Provide a detailed description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).

---

Thank you for using the P2P File Sharing Application! If you encounter any issues or have suggestions for improvements, feel free to reach out or contribute to the project.
