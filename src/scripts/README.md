# MongoDB Data Persistence Scripts

This directory contains scripts to help diagnose and fix issues with MongoDB data being deleted automatically.

## Problem Description

The MongoDB data on the server (http://69.62.83.129:3000/) is being deleted automatically every night, while the local development database remains intact. This can lead to data loss and service disruptions.

## Diagnostic and Solution Scripts

### 1. Check for TTL Indexes

TTL (Time-To-Live) indexes in MongoDB can cause automatic document deletion after a specified period. This script checks for any TTL indexes in your collections.

```bash
node src/scripts/check-mongodb-ttl-indexes.js
```

This script will:

- Connect to your MongoDB database
- Check all collections for TTL indexes
- Report any TTL indexes found
- Provide information about the MongoDB server configuration
- Suggest possible causes if no TTL indexes are found

### 2. Monitor MongoDB for Changes

This script monitors your MongoDB database for changes, especially deletions, to help identify when and how data is being removed.

```bash
node src/scripts/monitor-mongodb-server.js
```

This script will:

- Connect to your MongoDB database
- Record the initial state of all collections
- Monitor for changes at regular intervals (hourly checks and more frequent quick checks)
- Log all changes, especially deletions, to a log file
- Check for scheduled operations that might be causing deletions
- Run for 24 hours by default (can be modified in the script)

The monitoring logs will be saved to `logs/mongodb-monitor.log`.

### 3. Backup MongoDB Data

This script creates regular backups of your MongoDB database to prevent data loss.

```bash
node src/scripts/backup-mongodb.js
```

This script will:

- Create a backup of your MongoDB database using `mongodump`
- Save the backup to a timestamped directory in the `backups` folder
- Keep the 7 most recent backups and delete older ones
- Provide instructions for setting up a daily cron job for automated backups

## Possible Causes of Data Deletion

1. **TTL Indexes**: MongoDB can automatically delete documents based on TTL indexes.
2. **External Cron Jobs**: There might be a cron job or scheduled task on the server that's cleaning up the database.
3. **MongoDB Server Configuration**: The server might have settings that cause data to be deleted, such as limited oplog size.
4. **Deployment Environment**: If using containers (like Docker), they might be restarted nightly, and if the MongoDB data isn't properly persisted, it could be lost.
5. **Hosting Provider Maintenance**: Some hosting providers perform nightly maintenance that could affect the database.

## Recommended Solutions

1. **Set up Daily Backups**: Use the backup script to create regular backups of your database.

   ```bash
   # Add to crontab to run daily at 2 AM
   0 2 * * * node /path/to/src/scripts/backup-mongodb.js > /path/to/backup.log 2>&1
   ```

2. **Check Server Configuration**: Ensure MongoDB is configured to persist data properly.

   - If using Docker, make sure volumes are properly configured
   - Check if there are any maintenance scripts running on the server

3. **Monitor the Database**: Run the monitoring script during the time when data is typically deleted to catch the issue in action.

   ```bash
   # Run in the evening before the usual deletion time
   node src/scripts/monitor-mongodb-server.js
   ```

4. **Modify MongoDB Connection**: If the server is using a different MongoDB connection than specified in the environment variables, update the connection string to point to a persistent database.

5. **Check Server Logs**: Review the server logs around the time when data is deleted for any scheduled tasks or maintenance operations.

## Server vs. Local Environment Differences

The fact that data is only being deleted on the server but not locally suggests that:

1. The server might have different MongoDB configuration settings
2. There might be external processes running on the server that don't exist locally
3. The server might be using a different database connection than what's specified in the environment variables

To identify these differences, compare:

- MongoDB configuration files
- Cron jobs and scheduled tasks
- Environment variables
- Deployment scripts

## Additional Resources

- [MongoDB TTL Indexes Documentation](https://www.mongodb.com/docs/manual/core/index-ttl/)
- [MongoDB Backup and Restore](https://www.mongodb.com/docs/manual/tutorial/backup-and-restore-tools/)
- [MongoDB Server Configuration](https://www.mongodb.com/docs/manual/reference/configuration-options/)
