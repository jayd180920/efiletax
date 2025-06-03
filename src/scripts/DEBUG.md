# Debug Scripts for EFileTax Admin

This directory contains debugging utilities for the EFileTax Admin application.

## Debug Script

The main debug script (`debug.js`) provides utilities for checking environment configuration, verifying database connections, testing API endpoints, and logging system information.

### Usage

You can run the debug script directly with Node.js:

```bash
node src/scripts/debug.js [command]
```

Or use the npm scripts defined in `package.json`:

```bash
npm run debug:script      # Run all checks
npm run debug:env         # Check environment configuration
npm run debug:db          # Verify database connections
npm run debug:api         # Test API endpoints
npm run debug:system      # Log system information
```

### Available Commands

- `env`: Check environment configuration
- `db`: Verify database connections
- `api`: Test API endpoints
- `system`: Log system information
- `all`: Run all checks (default if no command is specified)

### Environment Configuration Check

This check verifies that all required environment variables are set. It checks for:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `JWT_SECRET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET_NAME`
- `S3_REGION`

It also reports the current `NODE_ENV` value.

### Database Connection Check

This check attempts to connect to MongoDB using both Mongoose and the MongoDB native client. It reports:

- Connection status
- Database name
- Number of collections
- Number of documents

### API Endpoints Check

This check tests the following API endpoints:

- `/api/auth/me` (GET): Get current user
- `/api/common-services` (GET): Get common services

It reports the status code and whether the endpoint is working.

### System Information Check

This check logs information about the system, including:

- Node.js version
- Process platform and architecture
- OS type, release, and architecture
- CPU cores
- Total and free memory
- Project name and version
- Next.js and React versions

## Debugging with VSCode

A VSCode launch configuration is provided in `.vscode/launch.json` for debugging the application. The following configurations are available:

- **Next.js: debug server-side**: Debug the server-side code of the Next.js application
- **Next.js: debug client-side**: Debug the client-side code in Chrome
- **Next.js: debug full stack**: Debug both server-side and client-side code
- **Attach to Node Process**: Attach to an existing Node.js process

### Using the VSCode Debugger

1. Open the Debug view in VSCode (Ctrl+Shift+D or Cmd+Shift+D on macOS)
2. Select the desired configuration from the dropdown
3. Click the green play button or press F5 to start debugging

### Debugging with npm Scripts

You can also use the npm scripts defined in `package.json` to run the application in debug mode:

```bash
npm run dev:debug       # Run Next.js in debug mode
npm run debug           # Alias for dev:debug
```

These scripts start the Next.js development server with the `--inspect` flag, which allows you to attach a debugger.

## Environment-Specific Scripts

The `package.json` file includes scripts for running the application in different environments:

### Development

```bash
npm run dev             # Run in development mode
npm run dev:debug       # Run in development mode with debugging enabled
npm run dev:staging     # Run in staging mode
npm run dev:prod        # Run in production mode
```

### Building

```bash
npm run build           # Build for development
npm run build:staging   # Build for staging
npm run build:prod      # Build for production
```

### Starting

```bash
npm run start           # Start for development
npm run start:staging   # Start for staging
npm run start:prod      # Start for production
```

## Troubleshooting

If you encounter issues while running the debug script:

1. Make sure all required environment variables are set
2. Check that MongoDB is running and accessible
3. Ensure that the Next.js development server is running if testing API endpoints
4. Check the console output for specific error messages

For more detailed debugging, you can use the VSCode debugger to step through the code and inspect variables.
