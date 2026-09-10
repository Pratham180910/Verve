# Verve

## Role-Based Club Management System

Verve is a role-based club management system designed for student organizations. It provides separate experiences for Admins, Project Leads, and Members to manage members, projects, teams, tasks, and club activity from a single platform.

---

## Features

## Live Demo

**Deployed Application:** https://verve-frontend-three.vercel.app

### Authentication & Role-Based Access

- Secure login using JWT authentication.
- Password hashing using bcrypt.
- Role-based access control for Admin, Project Lead, and Member users.
- Automatic role-based dashboard redirection.
- Protected API routes and frontend pages.

### Admin

- Dashboard with club statistics and recent activity.
- Manage members and their roles/status.
- Create, edit, and delete projects.
- Create and manage teams.
- Assign Project Leads to projects.
- Add members to teams.
- Create, edit, assign, and delete tasks.
- Manage task priority, deadlines, and status.
- View club activity.
- Manage admin profile/settings.

### Project Lead

- Project Lead dashboard.
- View assigned projects.
- View assigned project team.
- Create and manage project tasks.
- Assign tasks to individual team members.
- Track task status and deadlines.
- View project-related activity.

### Member

- Member dashboard.
- View assigned tasks.
- Update task progress and status.
- View projects they are participating in.
- View their project team.
- View relevant project activity updates.
- Manage their profile.

### Projects & Teams

- Projects and teams are managed as separate entities.
- Each project can have one team.
- Members can participate in multiple projects and teams.
- Project Leads can manage their assigned projects and teams.

### Tasks

- Individual task assignment.
- Task deadlines.
- Priority levels.
- Status tracking:
  - To Do
  - In Progress
  - Completed
- Role-based task management.

### Activity & Notifications

- Activity tracking across the system.
- Recent activity displayed for relevant users.
- Functional notification bell in the top navigation header.
- Dynamic unread notification indicator.
- Recent activity dropdown popover.
- Mark-as-read action.

### Responsive UI

- Responsive layouts for desktop, tablet, and mobile.
- Consistent light Verve design across all roles.
- Hamburger navigation for smaller screens.
- Feature-specific search where required.

---

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- JavaScript
- React Router

### Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- bcrypt

### Database

- Supabase
- PostgreSQL
- Row Level Security (RLS)

### Development Tools

- Git
- GitHub
- Antigravity IDE

---

## Project Structure

```text
Verve/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       │   ├── lead/
│       │   └── member/
│       ├── services/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   └── supabase/
│       └── schema.sql
│
├── .gitignore
├── package.json
└── README.md
```

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Pratham180910/Verve.git
cd Verve
```

### 2. Configure Environment Variables

Create the required environment files.

#### Server

Create:

```text
server/.env
```

Add:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

#### Client

Create:

```text
client/.env
```

Add the required client-side API configuration used by the project.

> **Important:** Do not commit `.env` files or secret keys to GitHub.

### 3. Install Dependencies

From the project root:

```bash
npm install
```

Install client dependencies:

```bash
cd client
npm install
```

Install server dependencies:

```bash
cd ../server
npm install
```

### 4. Database / Schema Setup

1. Create a project in Supabase.
2. Open the Supabase SQL Editor.
3. Run the SQL contained in:

```text
server/supabase/schema.sql
```

The schema creates the main tables and relationships required by Verve, including:

- Users
- Projects
- Teams
- Team Members
- Tasks
- Activities

The database also contains the required foreign-key relationships, indexes, constraints, and Row Level Security configuration.

### 5. Seed Users

From the `server` directory, run:

```bash
npm run seed
```

This creates the initial users required for testing the different roles.

### 6. Run the Application

From the project root:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:5000
```

---

## Database Schema

The application uses PostgreSQL through Supabase.

### Main Tables

#### Users

Stores registered users and their roles.

Important fields include:

- User ID
- Name
- Email
- Password
- Role
- Status

Supported roles:

```text
admin
project_lead
member
```

#### Projects

Stores club projects and their assigned Project Leads.

#### Teams

Stores teams associated with projects.

A project can have one team.

#### Team Members

Stores the many-to-many relationship between users and teams.

This allows a member to participate in multiple projects.

#### Tasks

Stores individual tasks assigned to members.

Tasks contain information such as:

- Title
- Description
- Assigned member
- Project
- Team
- Priority
- Deadline
- Status

Supported task statuses:

```text
To Do
In Progress
Completed
```

#### Activities

Stores activity records used for activity feeds and notifications.

---

## API Documentation

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Get the currently authenticated user |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Get admin dashboard data |
| GET | `/api/admin/members` | Get members |
| POST | `/api/admin/members` | Create a member |
| PUT | `/api/admin/members/:id` | Update a member |
| DELETE | `/api/admin/members/:id` | Delete a member |
| GET | `/api/admin/activity` | Get admin activity |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | Get projects |
| POST | `/api/projects` | Create a project |
| PUT | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |

### Teams

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teams` | Get teams |
| POST | `/api/teams` | Create a team |
| PUT | `/api/teams/:id` | Update a team |
| DELETE | `/api/teams/:id` | Delete a team |
| POST | `/api/teams/:id/members` | Add members to a team |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | Get tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### Project Lead

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/lead/dashboard` | Get Project Lead dashboard |
| GET | `/api/lead/projects` | Get assigned projects |
| GET | `/api/lead/team` | Get assigned team |
| GET | `/api/lead/tasks` | Get project tasks |
| GET | `/api/lead/activity` | Get project activity |

### Member

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/member/dashboard` | Get member dashboard |
| GET | `/api/member/tasks` | Get assigned tasks |
| GET | `/api/member/projects` | Get member projects |
| GET | `/api/member/team` | Get member team |
| GET | `/api/member/activity` | Get member activity |
| GET | `/api/member/profile` | Get member profile |

> All protected endpoints require a valid JWT authentication token and appropriate role permissions.

---

## Screenshots

The following screenshots demonstrate the major features and role-specific interfaces of Verve.

### Login Page

<img width="1880" height="911" alt="Verve Login" src="https://github.com/user-attachments/assets/825e3daa-fdaf-492b-931b-f55784040fb4" />

### Admin Dashboard

<img width="1900" height="912" alt="Admin Dashboard" src="https://github.com/user-attachments/assets/ce809aa3-e69f-4c34-a1d3-6008d9cec71e" />

### Admin Members

<img width="1895" height="903" alt="Admin Members" src="https://github.com/user-attachments/assets/53228287-b327-4e8c-a845-785a9cee7a4c" />

### Admin Projects

<img width="1900" height="906" alt="Admin Projects" src="https://github.com/user-attachments/assets/19259cbe-1940-404d-91e8-5f270116c8e6" />

### Admin Teams

<img width="1895" height="905" alt="Admin Teams" src="https://github.com/user-attachments/assets/ba80a5f5-7a26-46bc-b5da-a3ebc0ce20f0" />

### Admin Tasks

<img width="1900" height="907" alt="Admin Tasks" src="https://github.com/user-attachments/assets/f5acf942-268b-4e2c-8b4c-bece064e6d3d" />

### Admin Activity

<img width="1898" height="910" alt="Admin Activity" src="https://github.com/user-attachments/assets/407cc0bc-33ee-497f-add2-e3e73f703592" />

### Admin Settings

<img width="1900" height="912" alt="Admin Settings" src="https://github.com/user-attachments/assets/5ef8b6ee-2d9b-4c3b-9f43-ff49d4cfc051" />

### Project Lead Dashboard

<img width="1897" height="906" alt="Project Lead Dashboard" src="https://github.com/user-attachments/assets/f62eb248-5e58-487a-958d-a0fc01ba37b6" />

### Member Dashboard

<img width="1902" height="900" alt="Member Dashboard" src="https://github.com/user-attachments/assets/40ac6d29-d6eb-409c-9216-1bc51d3f5a5a" />

---

## Security

- Passwords are hashed using bcrypt.
- Authentication uses JWT tokens.
- Role-based middleware protects restricted API routes.
- Supabase service credentials are stored in environment variables.
- `.env` files are excluded from version control.
- Row Level Security is enabled in Supabase.

---
## License

This project was developed as a student club management system project.
