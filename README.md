# Topps Card Collection Tracker

A web-based application for managing your Topps Premier League 2026 card collection.

## Project Structure

```
src/
├── components/     # React components
├── services/       # Business logic and data access services
├── models/         # TypeScript interfaces and types
├── utils/          # Utility functions and helpers
└── test/           # Test setup and utilities
```

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Testing**: Vitest with React Testing Library
- **Property-Based Testing**: fast-check
- **Linting**: ESLint with TypeScript support

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
npm run lint
```

## TypeScript Configuration

The project uses strict TypeScript mode with the following additional checks:
- `noUnusedLocals`
- `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `noUncheckedIndexedAccess`

## Testing Strategy

The project employs a dual testing approach:
- **Unit Tests**: Verify specific examples and edge cases
- **Property-Based Tests**: Verify universal properties across all inputs using fast-check