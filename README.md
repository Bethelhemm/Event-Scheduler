# Event Scheduler Application

## Overview

This is a full-stack event scheduling application with a React + TypeScript frontend and a Django REST Framework backend. The frontend uses Vite as the build tool and React Hook Form for form management. The backend provides RESTful APIs for managing events, users, and calendars.

---

## Setup

### Prerequisites

- Docker and Docker Compose installed

### Running with Docker Compose

1. Build and start the containers:

```bash
docker compose up --build
```

2. The frontend will be available at `http://localhost:3000`.

3. The backend API will be available at `http://localhost:8000`.

---


## Architectural Decisions

- **Frontend Framework:** React with TypeScript was chosen for its component-based architecture, strong typing, and rich ecosystem. Vite is used as the build tool for fast development startup and hot module replacement.

- **Form Management:** React Hook Form is used for performant and easy-to-use form handling, integrated with Zod for schema-based validation.

- **Backend Framework:** Django REST Framework provides a scalable API backend with built-in authentication and serialization.

- **State Management:** The frontend uses React's context and custom hooks for state management, avoiding heavier libraries for simplicity.

- **Styling:** Tailwind CSS is used for utility-first styling, enabling rapid UI development with consistent design.

- **ICS Export:** The backend generates ICS files using the `icalendar` Python package, allowing users to export events to calendar applications.

---

## Shortcuts and Tips

- Use `docker compose up --build` to start the entire application stack.

- The frontend API base URL is configured to point to the backend server; adjust if needed in `frontend/src/services/api.ts`.

- To export an event as an ICS file, use the "Export .ics" button in the event details modal.

- The project uses environment variables for configuration; refer to `.env.example`.

---

If you have any questions or need further assistance, feel free to ask.
