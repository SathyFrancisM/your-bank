# Enterprise Core Banking Portal Prototype

Internal bank employee portal for privileged access misuse detection, insider threat monitoring, and real banking operations simulation.

## Stack

- Frontend: React, React Router, Tailwind CSS, Framer Motion, React Icons, Chart.js, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Multer, Socket.IO, Node Cron

## Structure

- `client/` React application
- `server/` API, security engine, models, and seed data

## Quick Start

1. Install dependencies in both apps.
2. Copy `.env.example` files to `.env`.
3. Start MongoDB.
4. Run the backend and frontend concurrently.

## Security Features

- Employee login with OTP verification
- Smart login checks for office hours, GPS distance, device, browser, VPN/IP risk
- Manager approval workflow for unusual logins
- JWT authentication and role-based access control
- Screen recording simulation with session lifecycle control
- Audit logging for all privileged actions
- Rule-based insider threat risk scoring

## Demo Data

The seed service generates sample employees, managers, customers, accounts, transactions, loans, FDs, RDs, risk scores, notifications, and recordings.

## Notes

This is a production-style prototype built for internal bank demos and security reviews. It is designed to show the full control flow of a core banking operations portal, not to connect to live banking rails.
