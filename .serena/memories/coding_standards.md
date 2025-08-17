# Coding Standards and Conventions

## TypeScript Standards
- Strict TypeScript configuration enabled
- Use interfaces for object shapes, types for unions/primitives
- Explicit return types for functions when not obvious
- Proper error handling with typed catch blocks

## React/Next.js Conventions
- Use 'use client' directive for client components
- Functional components with hooks
- Props interfaces should end with 'Props'
- Use React.memo for performance optimization when needed
- Suspense boundaries for loading states

## Component Structure
- Import order: external libraries, internal modules, relative imports
- Group useState hooks together
- useEffect hooks after state declarations
- Custom hooks and functions defined before return
- Export default at bottom of file

## Form Handling
- React Hook Form with Zod validation
- Error states handled consistently
- Loading states for submit operations
- Proper form accessibility

## Styling
- Material-UI components with sx prop for styling
- Tailwind CSS for utility classes
- Consistent spacing and color scheme
- Responsive design patterns

## Error Handling
- SafeAlert component for user-facing errors
- Proper error boundaries
- Consistent error message formatting
- Graceful degradation for failed operations

## Security Practices
- Input validation on both client and server
- CSRF protection enabled
- Rate limiting on API endpoints
- Secure authentication flows