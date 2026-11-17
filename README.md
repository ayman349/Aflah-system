# Aflax College Management System

Aflax College Management System is a web-based application developed to support the management of academic activities and online course delivery. The system provides tools for managing courses, students, instructors, learning materials, and course feedback through a centralized platform.

## Features

- Course creation and management
- Student account management
- Instructor management
- Course video and learning material uploads
- Student course reviews and comments
- Course rating and review display
- Administrative dashboard
- Responsive user interface
- PostgreSQL database integration

## Technologies

- Frontend: Web technologies
- Backend: Server-side application
- Database: PostgreSQL
- Runtime: Node.js
- Package Manager: npm

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/ayman349/Aflah-system.git
```

**2. Open the project directory**

```bash
cd Aflah-system
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env` file in the project root directory and configure the required database connection and application settings.

**5. Create the administrator account**

```bash
npm run admin:create
```

**6. Start the development server**

```bash
npm run dev
```

The application will be available at:

`http://localhost:3000`

## Database

The application uses PostgreSQL for data storage. Configure the database connection through the `DATABASE_URL` environment variable before starting the application.

## Environment Configuration

The application requires environment variables for database connectivity, application URL, file storage, upload limits, and administrator account creation.

Sensitive configuration files must not be committed to the repository.

## Repository

GitHub: https://github.com/ayman349/Aflah-system

## Project

**Aflax College Management System**