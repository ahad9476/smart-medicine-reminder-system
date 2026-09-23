# Smart Medicine Reminder System

A web-based **Smart Medicine Reminder System** developed as a database-focused project for managing medicines, schedules, reminders, notifications, caregivers, and medicine inventory.

The system provides a centralized platform where users can manage their medicines and related information through a web interface connected to a Node.js/Express backend and MySQL database.

---

## 📌 Project Overview

Managing multiple medicines can be difficult, especially when users need to remember different medicines, dosages, schedules, and refill information.

The **Smart Medicine Reminder System** aims to simplify medicine management by providing features such as:

* User registration and login
* Medicine management
* Medicine dosage information
* Medicine scheduling
* Reminder history
* Notifications
* Caregiver management
* Medicine inventory and refill tracking
* User notification settings

The project follows a **frontend → backend → database** architecture.

```text
Frontend (HTML, CSS, JavaScript)
              │
              │ HTTP Requests
              ▼
      Node.js + Express.js
              │
              │ SQL Queries
              ▼
          MySQL Database
```

---

## ✨ Features

### 👤 User Management

* User registration
* User login
* Password hashing using bcrypt
* User roles

### 💊 Medicine Management

* Add medicines
* View medicines
* Update medicine information
* Delete medicines
* Store medicine description and dosage

### ⏰ Medicine Scheduling

* Create medicine schedules
* Store schedule time
* Store frequency
* Maintain reminder history

### 🔔 Notifications

* Medicine reminder notifications
* Missed dose notifications
* Low-stock notifications
* User notification preferences

### 👨‍⚕️ Caregiver Management

* Store caregiver information
* Assign caregivers to users
* Support multiple users and caregivers through caregiver assignments

### 📦 Medicine Inventory

* Track medicine quantity
* Store expiry dates
* Record medicine refills

---

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js
* REST API
* mysql2
* bcrypt
* CORS
* dotenv

### Database

* MySQL

### Development Tools

* Visual Studio Code
* Git
* GitHub
* XAMPP / MySQL

---

## 🗄️ Database

The project uses a MySQL database named:

```text
smart_medicine
```

The database contains **12 tables**:

1. `Users`
2. `Caregivers`
3. `Caregiver_Assignments`
4. `Medicines`
5. `Dosages`
6. `Medicine_Inventory`
7. `Medicine_Refills`
8. `Schedules`
9. `Reminder_Log`
10. `Notification_Types`
11. `Notifications`
12. `User_Notification_Settings`

### Main Relationships

```text
Users
 │
 ├── 1:N ── Medicines
 │             ├── 1:N ── Dosages
 │             ├── 1:N ── Medicine_Inventory
 │             └── 1:N ── Medicine_Refills
 │
 ├── 1:N ── Schedules ── N:1 ── Medicines
 │             │
 │             └── 1:N ── Reminder_Log
 │
 ├── 1:N ── Notifications ── N:1 ── Notification_Types
 │
 ├── 1:N ── User_Notification_Settings
 │
 └── 1:N ── Caregiver_Assignments ── N:1 ── Caregivers
```

The `Caregiver_Assignments` table acts as a junction entity for the many-to-many relationship between `Users` and `Caregivers`.

`Schedules` connects users with medicines, allowing a user to maintain multiple medicine schedules.

---

## 📁 Project Structure

```text
smart-medicine-reminder-system/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── medicines.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── api.js
│       ├── login.js
│       ├── dashboard.js
│       └── medicines.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .gitignore
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   └── medicineController.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   └── medicine.js
│   │
│   └── db/
│       └── connection.js
│
├── database/
│   └── smart_medicine.sql
│
└── README.md
```

---

## 🔌 Backend API

### Authentication

#### Register

```http
POST /api/register
```

Example request:

```json
{
  "name": "Test User",
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

#### Login

```http
POST /api/login
```

Example request:

```json
{
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

---

## 💊 Medicine API

### Create Medicine

```http
POST /api/medicines
```

Example:

```json
{
  "user_id": 1,
  "name": "Napa",
  "description": "For fever",
  "dosage": "500mg"
}
```

### Read Medicines

```http
GET /api/medicines
```

### Update Medicine

```http
PUT /api/medicines/:id
```

Example:

```json
{
  "name": "Napa Extra",
  "description": "For fever and pain",
  "dosage": "650mg"
}
```

### Delete Medicine

```http
DELETE /api/medicines/:id
```

---

## 🔄 CRUD Operations

The Medicine module implements complete CRUD functionality:

| Operation | HTTP Method | Endpoint             |
| --------- | ----------- | -------------------- |
| Create    | POST        | `/api/medicines`     |
| Read      | GET         | `/api/medicines`     |
| Update    | PUT         | `/api/medicines/:id` |
| Delete    | DELETE      | `/api/medicines/:id` |

The backend uses parameterized SQL queries with `?` placeholders.

---

## 🔐 Security

The project currently includes:

* Password hashing using **bcrypt**
* Environment variables using `.env`
* Parameterized SQL queries
* `.env` excluded from GitHub using `.gitignore`
* CORS configuration for frontend-backend communication

> **Note:** The current authentication implementation is intended for the project's development/demo stage. Production deployment would require additional authentication and authorization mechanisms.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ahad9476/smart-medicine-reminder-system.git
```

Then enter the project:

```bash
cd smart-medicine-reminder-system
```

---

### 2. Set Up MySQL

Create a database:

```sql
CREATE DATABASE smart_medicine;
```

Import:

```text
database/smart_medicine.sql
```

into the database.

---

### 3. Configure Backend

Go to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `backend` folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_medicine
DB_PORT=3306
```

If your MySQL installation uses a password, enter it as `DB_PASSWORD`.

---

### 4. Start the Backend

Run:

```bash
npm run dev
```

The server should start at:

```text
http://localhost:5000
```

You should see:

```text
Server running on http://localhost:5000
MySQL database connected successfully!
```

---

### 5. Run the Frontend

Open the `frontend` folder using a local development server such as **VS Code Live Server**.

The frontend communicates with the backend through:

```text
http://localhost:5000
```

---

## 🧪 Testing

The main workflow can be tested as follows:

```text
Register
   ↓
Login
   ↓
Dashboard
   ↓
Medicines
   ↓
Add Medicine
   ↓
View Medicine
   ↓
Edit Medicine
   ↓
Delete Medicine
```

The Medicine module has been implemented with all four CRUD operations.

---

## 👥 Team Responsibilities

| Member   | Responsibility                                    |
| -------- | ------------------------------------------------- |
| Member 1 | Frontend Development                              |
| Member 2 | Backend Development & GitHub Management           |
| Member 3 | User & Caregiver Database Module                  |
| Member 4 | Medicine & Inventory Database Module              |
| Member 5 | Schedule, Reminder & Notification Database Module |

---

## 📂 Database SQL File

The complete database structure is stored in:

```text
database/smart_medicine.sql
```

This file contains the SQL required to recreate the project's database tables.

---

## 🚀 Future Improvements

Possible future improvements include:

* JWT-based authentication
* User-specific medicine access
* Complete schedule management
* Automated reminder generation
* Email notifications
* Improved authorization and role management
* Medicine stock alerts
* More detailed dashboard statistics
* Production deployment

---

## 📜 License

This project was developed for academic purposes as part of a database-focused university project.

---

## 👨‍💻 Project Team

**Smart Medicine Reminder System**

Developed as a team project at **United International University (UIU)**.
