# LiveChat

LiveChat is a modern, secure, and user-friendly web chat application that allows real-time communication between friends and acquaintances.

---

## Features

- Real-time messaging powered by WebSocket (Socket.IO)
- User registration and login secured with JWT
- Email verification using Gmail addresses only
- Message encryption and decryption using AES-128-CBC
- Profile picture upload and storage on the server
- Read/unread message status display in chat
- Simple and intuitive UI/UX design

---

## Technology Stack and Requirements

- Node.js (runtime)
- Express.js (server framework)
- Sequelize ORM (database abstraction)
- PostgreSQL/MySQL or another SQL database
- Socket.IO (real-time communication)
- bcrypt, JWT, dotenv, multer, nodemailer
- JavaScript (ES Modules)
- HTML, CSS, and vanilla JavaScript for frontend

---

## Project Structure

```

backend/
├── app.js              # Entry point of Express server
├── dataBase/           # Models and database configuration
├── middlwear/          # Middleware (e.g., authentication)
├── router/             # Express routes
├── utils/              # Utility functions (e.g., encryption)
├── frontend/
│   ├── profil/
│   │   ├── profil.html
│   │   ├── script.js
│   │   └── style.css
│   ├── chat/
│   │   ├── chat.html
│   │   ├── script.js
│   │   └── style.css
│   ├── register/
│   │   ├── register.html
│   │   ├── script.js
│   │   └── style.css
│   ├── verify/
│   │   ├── verify.html
│   │   ├── script.js
│   │   └── style.css
uploads/                # Folder for storing user-uploaded profile pictures
.env                   # Environment variables (not committed to GitHub)
.gitignore             # Files/folders excluded from Git tracking
package.json
package-lock.json
README.md

````

---

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/arziiann/livechat.git
cd livechat/backend
````

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory and add your configuration variables (refer to `.env.example`):

```env
JWT_SECRET=your_jwt_secret
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
ENCRYPTION_KEY=your_16_characters_key
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_NAME=your_db_name
```

4. Set up and configure your database (PostgreSQL, MySQL, or your choice).

5. Start the server:

```bash

cd backend/
npm start
```

6. Open `http://localhost:3001` (or configured port) in your browser.

---

## Usage

* Register using a valid Gmail address.
* Verify your email by entering the code sent to your inbox.
* Log in with your credentials.
* Select a user to start chatting.
* The chat interface displays unread message counts and real-time updates.

---

## Security Notes

* Keep your `.env` file secure and do not share sensitive keys.
* Messages are encrypted using AES-128-CBC for privacy.
* JWT tokens are used to secure user sessions.

---

## Contributing

Feel free to open issues or submit pull requests for bug fixes or feature requests.

---


---


