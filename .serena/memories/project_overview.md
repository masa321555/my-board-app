# My Board App - Project Overview

## Purpose
A Next.js-based board application with user authentication, email verification, and post management functionality. The app supports user registration, login, password reset, and email verification workflows.

## Tech Stack
- **Frontend**: Next.js 15.4.5, React 19.1.0, TypeScript
- **UI Library**: Material-UI (MUI) v7.2.0 with Emotion for styling
- **Authentication**: NextAuth.js 4.24.5 with MongoDB adapter
- **Database**: MongoDB with Mongoose 8.17.0
- **Email**: SendGrid and Nodemailer for email services
- **Forms**: React Hook Form with Zod validation
- **File Upload**: AWS S3 with presigned URLs
- **Password Security**: bcryptjs with zxcvbn strength checking
- **Testing**: Jest, Playwright for E2E, React Testing Library
- **Styling**: Tailwind CSS 4 with PostCSS

## Project Structure
- `/app` - Next.js App Router pages and API routes
- `/src/components` - Reusable React components (including SafeAlert)
- `/lib` - Utility functions and shared logic
- `/schemas` - Zod validation schemas
- `/types` - TypeScript type definitions
- `/public` - Static assets
- `/scripts` - Build and deployment scripts

## Key Features
- User authentication with email verification
- Password reset functionality
- Board/post management
- File uploads to AWS S3
- Responsive Material-UI design
- Form validation with error handling