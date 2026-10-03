# LabPulse - College Laboratory & Workstation Management System

LabPulse is a modern full-stack MERN (MongoDB, Express.js, React, Node.js) platform designed for higher education institutions to digitize laboratory facility operations, workstation scheduling, seat collision prevention, and student project collaboration.

---

## 🌟 System Capabilities

### 1. Student Portal
- **Secure Authentication**: JWT-based session management, bcryptjs password hashing, email validation, and tokenized password reset.
- **Dynamic Facility Discovery**: Real-time workstation availability calculated dynamically based on active reservations and operating hours.
- **Interactive Visual Workstation Matrix**:
  - 🟢 **Available**: Ready for reservation
  - 🟡 **Pending**: Awaiting faculty approval for extended or privileged sessions
  - 🔴 **Occupied**: Reserved by another student session
  - ⚪ **Out of Order**: Hardware maintenance mode
- **Zero-Collision Scheduling Engine**: Server-side transactional conflict verification preventing overlapping bookings on the same terminal while permitting contiguous back-to-back reservations.
- **Session Check-In & Check-Out**: Time-stamped terminal attendance tracking and session logging.
- **Academic Project Hub**: Student project portfolio management with skill tagging, repository URLs, and team collaboration invitations.
- **Peer Discovery**: Deterministic skill and interest overlap algorithm that matches students with prospective research and project collaborators.
- **Collaboration Pipeline**: Send, accept, decline, or withdraw project collaboration requests with built-in messaging.
- **Visual Calendar**: Multi-view (month/week) schedule of confirmed and upcoming lab sessions.
- **Real-Time Alerts**: Instant WebSocket notification badges via Socket.IO.

### 2. Faculty Portal
- **Operational Telemetry**: Real-time dashboard tracking daily facility utilization, checked-in students, and pending approvals.
- **Lab Schedules**: Searchable, filterable schedule matrix across laboratories and dates.
- **Special Session Approvals**: Review student requests requiring elevated privileges or extended hours.
- **Student Monitoring**: Review student lab attendance, hours logged, and active project engagements.
- **Usage Reports**: Exportable laboratory utilization analytics with one-click **CSV export**.

### 3. Administrator Portal
- **Analytics & Telemetry**: Aggregated data visualizations powered by MongoDB pipelines:
  - Workstation utilization rate percentage
  - Daily booking volume trends
  - Status distribution (Confirmed, Pending, Completed, Cancelled)
  - Departmental utilization comparison
- **Academic Department Management (`/admin/departments`)**: Full CRUD management of college departments, codes, HOD leads, facility locations, and automated data synchronization across labs and user profiles.
- **Workstation & Facility Layout Editor**: Interactive seat configuration to add, remove, rename terminals (`PC-01`, `PC-02`), and toggle hardware maintenance flags with automatic capacity synchronization.
- **User Directory**: Search and manage student, faculty, and administrative accounts with one-click status activation and deactivation.
- **Audit & Conflict Detection**: Automated conflict detection audit (`GET /api/admin/bookings/conflicts`) scanning for schedule overlap anomalies.
- **System Broadcasts**: Push announcements to students, faculty, or all campus users.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Recharts, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Node.js, Express.js (Modular MVC Architecture) |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing |
| **Real-Time** | Socket.IO (WebSocket Gateway with fallback) |
| **Testing** | Jest, Supertest automated integration test suite |
| **File Storage** | Multer disk storage for student avatars and project artifacts |

---

## 📁 Repository Structure

```
lab_management_system/
├── client/                      # React Frontend Application
│   ├── public/                  # Static assets and favicon
│   ├── src/
│   │   ├── components/common/   # Header, Sidebar, Modal, ConfirmDialog, LoadingSpinner
│   │   ├── context/             # AuthContext, SocketContext
│   │   ├── layouts/             # AppLayout (responsive dashboard shell)
│   │   ├── pages/
│   │   │   ├── auth/            # LoginPage, RegisterPage, ForgotPassword, ResetPassword
│   │   │   ├── student/         # Dashboard, Labs, Seats, Bookings, Calendar, Projects, Peers
│   │   │   ├── faculty/         # Dashboard, Schedules, Students, Requests, Reports
│   │   │   └── admin/           # Dashboard, Departments, Labs, Users, Bookings, Broadcasts, Settings
│   │   ├── routes/              # ProtectedRoute, RoleRoute
│   │   ├── services/            # Centralized Axios API service layer
│   │   ├── App.jsx              # Router configuration
│   │   └── index.css            # Custom SaaS Design System tokens and layouts
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node.js + Express Backend API
│   ├── src/
│   │   ├── config/              # db.js, mongoRunner.js (auto-detecting persistence engine)
│   │   ├── controllers/         # auth, department, lab, booking, project, collab, admin, faculty
│   │   ├── middleware/          # auth, upload (Multer), errorHandler
│   │   ├── models/              # User, Department, Lab, Booking, Project, Collaboration, Notification
│   │   ├── routes/              # Express REST endpoints
│   │   ├── sockets/             # Socket.IO connection and broadcast handlers
│   │   ├── utils/               # notificationHelper.js
│   │   ├── app.js               # Express middleware & route declarations
│   │   └── server.js            # HTTP and Socket server bootstrap
│   ├── tests/                   # Automated integration test suite
│   ├── package.json
│   └── .env.example
│
├── package.json                 # Monorepo task runner
└── README.md
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `server/` directory (or copy from `server/.env.example`):

```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lab_management_system
JWT_SECRET=your_production_jwt_secret_key_here
JWT_REFRESH_SECRET=your_production_refresh_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=production
```

---

## 🚀 Installation & Running

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Installs both `server` and `client` node packages)*

### 2. Database Management
- **View Database Status & Document Counts**:
  ```bash
  node server/scripts/db-cli.js
  ```
- **Reset Database to Clean State**:
  ```bash
  node server/scripts/clear-db.js
  ```
  *(Clears dummy data and initializes a clean Administrator account)*
- **Optional Demo Data Seed**:
  ```bash
  npm run seed
  ```

### 3. Start Development Servers
```bash
npm run dev
```
- Frontend: **[http://localhost:5173](http://localhost:5173)**
- Backend API: **[http://localhost:5000/api](http://localhost:5000/api)**

### 4. Production Build & Execution
To compile the production frontend and launch the API server:
```bash
# Build frontend bundle
npm --prefix client run build

# Start backend service
npm --prefix server start
```

---

## 🔑 Initial Administrator Setup

When initializing a fresh deployment or after running `node server/scripts/clear-db.js`:

1. Access the web portal at **[http://localhost:5173/login](http://localhost:5173/login)**
2. Default initial administrator credentials:
   - **Email**: `admin@example.com`
   - **Password**: `Password123!`
3. **Recommended First Steps**:
   - Navigate to **Departments** (`/admin/departments`) and create your academic departments (e.g., Computer Science, BCA, Data Science).
   - Navigate to **Manage Labs** (`/admin/labs`) to register laboratory rooms, campus locations, and configure workstation grids.
   - Navigate to **Manage Users** (`/admin/users`) to create faculty and student credentials, or allow students to self-register via `/register`.
   - Update your administrator password from the Profile page.

*(Note: If the user database is ever completely empty, the first user to register via `/register` is automatically granted the `admin` role).*

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register student account | Public |
| `POST` | `/api/auth/login` | Authenticate and issue JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private |
| `POST` | `/api/auth/forgot-password` | Request password reset token | Public |
| `POST` | `/api/auth/reset-password` | Set new password with token | Public |

### Academic Departments (`/api/departments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/departments` | List active departments with lab & user metrics | Public |
| `GET` | `/api/departments/:id` | Get department details and facility list | Private |
| `POST` | `/api/departments` | Create academic department | Admin |
| `PUT` | `/api/departments/:id` | Update department details & cascade references | Admin |
| `DELETE` | `/api/departments/:id` | Remove department (with safety constraints) | Admin |

### Laboratories & Workstations (`/api/labs`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/labs` | List laboratories with capacity & availability | Private |
| `GET` | `/api/labs/:id` | Get laboratory details & terminal layout | Private |
| `GET` | `/api/labs/:id/availability` | Calculate real-time seat status matrix for date/time | Private |

### Reservations & Bookings (`/api/bookings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/bookings` | Create workstation reservation with conflict check | Student / Admin |
| `GET` | `/api/bookings/my` | Retrieve authenticated user's reservations | Private |
| `GET` | `/api/bookings/calendar` | Retrieve scheduled sessions for calendar view | Private |
| `DELETE` | `/api/bookings/:id` | Cancel reservation and release terminal slot | Private |
| `PUT` | `/api/bookings/:id/checkin` | Check in to reserved terminal | Private |
| `PUT` | `/api/bookings/:id/checkout` | Check out and complete session | Private |

### Academic Projects & Collaboration (`/api/projects`, `/api/collaborations`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/projects` | Search and filter academic projects | Private |
| `POST` | `/api/projects` | Create student project | Private |
| `GET` | `/api/projects/:id` | Project details, milestones, and team roster | Private |
| `POST` | `/api/collaborations/request` | Submit collaboration application | Student |
| `PUT` | `/api/collaborations/:id/accept` | Accept peer into project team | Project Lead |
| `PUT` | `/api/collaborations/:id/reject` | Decline collaboration proposal | Project Lead |

### Faculty Operations (`/api/faculty`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/faculty/dashboard` | Daily faculty summary and live counters | Faculty / Admin |
| `GET` | `/api/faculty/schedules` | Filter workstation schedules by lab & date | Faculty / Admin |
| `GET` | `/api/faculty/students` | Student attendance and activity records | Faculty / Admin |
| `PUT` | `/api/faculty/requests/:id/approve` | Approve special lab session request | Faculty / Admin |
| `GET` | `/api/faculty/reports` | Exportable usage and utilization metrics | Faculty / Admin |

### Administrative Management (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/analytics` | High-level system utilization metrics | Admin |
| `GET` | `/api/admin/users` | Campus user directory with role and status filters | Admin |
| `POST` | `/api/admin/users` | Provision new user account | Admin |
| `PUT` | `/api/admin/users/:id/toggle-status`| Toggle account activation | Admin |
| `POST` | `/api/admin/labs` | Create new laboratory facility | Admin |
| `PUT` | `/api/admin/labs/:id/seats` | Update interactive workstation grid | Admin |
| `GET` | `/api/admin/bookings/conflicts` | Audit overlapping schedule reservations | Admin |
| `POST` | `/api/admin/notifications/broadcast`| Broadcast campus announcement | Admin |

---

## 🧪 Automated Testing

The backend includes automated integration tests verifying authentication, collision prevention, role protection, and scheduling invariants:

```bash
npm run test:server
```

### Test Coverage Highlights:
- User registration, token creation, and role guards
- Terminal collision rejection (`409 Conflict` on overlap)
- Adjacent slot scheduling (`201 Created` on consecutive slots)
- Peer matching similarity algorithms
- MongoDB analytical aggregation pipelines

---

## 🔒 Security & Architecture Principles

- **Password Safety**: Enforced `bcryptjs` hashing with salt rounds; passwords are excluded from API queries by default (`select: false`).
- **Strict Role-Based Access Control**: Route protections are enforced at the Express middleware layer (`protect`, `authorize`), independent of client-side navigation.
- **Collision Invariants**: Enforced via MongoDB query criteria matching `labId`, `seatId`, `bookingDate`, and active status filters before booking creation.
- **Input Sanitization**: Clean data normalization and validation across all controllers.

---

## 📄 License

This project is licensed under the open-source **MIT License** - see the [LICENSE](LICENSE) file for full details.
