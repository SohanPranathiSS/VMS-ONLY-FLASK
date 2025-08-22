#!/usr/bin/env python3
"""
Database Migration Manager
Manages database migrations for the Visitor Management System
"""

import os
import sys
import argparse
import mysql.connector
from datetime import datetime
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MigrationManager:
    def __init__(self, config):
        self.config = config
        self.connection = None
        self.migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'migrations')
        
    def connect(self):
        """Connect to the database"""
        try:
            self.connection = mysql.connector.connect(
                host=self.config['host'],
                port=self.config['port'],
                user=self.config['user'],
                password=self.config['password'],
                database=self.config['database']
            )
            logger.info("Connected to database successfully")
        except mysql.connector.Error as err:
            logger.error(f"Database connection failed: {err}")
            sys.exit(1)
    
    def disconnect(self):
        """Disconnect from the database"""
        if self.connection:
            self.connection.close()
            logger.info("Disconnected from database")
    
    def ensure_migration_table(self):
        """Ensure migration_log table exists"""
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS migration_log (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    migration_name VARCHAR(255) UNIQUE NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                    error_message TEXT,
                    rollback_script TEXT
                )
            """)
            self.connection.commit()
            logger.info("Migration log table ready")
        except mysql.connector.Error as err:
            logger.error(f"Failed to create migration log table: {err}")
            sys.exit(1)
        finally:
            cursor.close()
    
    def get_applied_migrations(self):
        """Get list of applied migrations"""
        cursor = self.connection.cursor()
        try:
            cursor.execute("SELECT migration_name FROM migration_log WHERE status = 'completed'")
            return [row[0] for row in cursor.fetchall()]
        except mysql.connector.Error as err:
            logger.error(f"Failed to get applied migrations: {err}")
            return []
        finally:
            cursor.close()
    
    def get_pending_migrations(self):
        """Get list of pending migrations"""
        applied = set(self.get_applied_migrations())
        all_migrations = []
        
        # Scan migrations directory for .sql files
        if os.path.exists(self.migrations_dir):
            for filename in sorted(os.listdir(self.migrations_dir)):
                if filename.endswith('.sql'):
                    migration_name = filename[:-4]  # Remove .sql extension
                    if migration_name not in applied:
                        all_migrations.append(filename)
        
        return all_migrations
    
    def apply_migration(self, migration_file):
        """Apply a single migration"""
        migration_path = os.path.join(self.migrations_dir, migration_file)
        migration_name = migration_file[:-4]  # Remove .sql extension
        
        logger.info(f"Applying migration: {migration_name}")
        
        cursor = self.connection.cursor()
        try:
            # Read migration file
            with open(migration_path, 'r', encoding='utf-8') as f:
                migration_sql = f.read()
            
            # Log migration start
            cursor.execute("""
                INSERT INTO migration_log (migration_name, status) 
                VALUES (%s, 'pending')
                ON DUPLICATE KEY UPDATE status = 'pending'
            """, (migration_name,))
            
            # Execute migration SQL
            # Split by semicolon and execute each statement
            statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
            
            for statement in statements:
                if statement and not statement.startswith('--'):
                    cursor.execute(statement)
            
            # Mark migration as completed
            cursor.execute("""
                UPDATE migration_log 
                SET status = 'completed', applied_at = NOW() 
                WHERE migration_name = %s
            """, (migration_name,))
            
            self.connection.commit()
            logger.info(f"Migration {migration_name} applied successfully")
            
        except Exception as err:
            # Mark migration as failed
            cursor.execute("""
                UPDATE migration_log 
                SET status = 'failed', error_message = %s 
                WHERE migration_name = %s
            """, (str(err), migration_name))
            self.connection.commit()
            logger.error(f"Migration {migration_name} failed: {err}")
            raise
        finally:
            cursor.close()
    
    def migrate(self, target=None):
        """Apply all pending migrations or up to target"""
        pending = self.get_pending_migrations()
        
        if not pending:
            logger.info("No pending migrations")
            return
        
        if target:
            # Find target migration
            target_file = f"{target}.sql"
            if target_file in pending:
                target_index = pending.index(target_file)
                pending = pending[:target_index + 1]
            else:
                logger.error(f"Target migration {target} not found")
                return
        
        logger.info(f"Found {len(pending)} pending migrations")
        
        for migration_file in pending:
            try:
                self.apply_migration(migration_file)
            except Exception:
                logger.error(f"Migration failed, stopping at {migration_file}")
                break
        
        logger.info("Migration process completed")
    
    def status(self):
        """Show migration status"""
        applied = self.get_applied_migrations()
        pending = self.get_pending_migrations()
        
        print(f"\nMigration Status:")
        print(f"Applied: {len(applied)}")
        print(f"Pending: {len(pending)}")
        
        if applied:
            print(f"\nApplied Migrations:")
            for migration in applied:
                print(f"  ✓ {migration}")
        
        if pending:
            print(f"\nPending Migrations:")
            for migration in pending:
                migration_name = migration[:-4]
                print(f"  - {migration_name}")
    
    def create_migration(self, name):
        """Create a new migration file"""
        timestamp = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
        filename = f"{timestamp}_{name}.sql"
        filepath = os.path.join(self.migrations_dir, filename)
        
        template = f"""-- {name.replace('_', ' ').title()} Migration
-- Created: {datetime.now().strftime('%Y-%m-%d')}
-- Description: {name.replace('_', ' ')}

-- Begin transaction
START TRANSACTION;

-- Add your migration SQL here


-- Commit transaction
COMMIT;

-- Migration completion log
INSERT INTO migration_log (migration_name, applied_at, status) 
VALUES ('{timestamp}_{name}', NOW(), 'completed')
ON DUPLICATE KEY UPDATE applied_at = NOW(), status = 'completed';
"""
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(template)
        
        logger.info(f"Created migration: {filename}")
        print(f"Migration file created: {filepath}")

def load_config():
    """Load database configuration"""
    config = {
        'host': os.getenv('DATABASE_HOST', 'localhost'),
        'port': int(os.getenv('DATABASE_PORT', 3306)),
        'user': os.getenv('DATABASE_USER', 'vms_user'),
        'password': os.getenv('DATABASE_PASSWORD', ''),
        'database': os.getenv('DATABASE_NAME', 'visitor_management_prod')
    }
    
    # Load from .env file if present
    env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    if key.startswith('DATABASE_'):
                        config_key = key.replace('DATABASE_', '').lower()
                        if config_key in config:
                            if config_key == 'port':
                                config[config_key] = int(value)
                            else:
                                config[config_key] = value
    
    return config

def main():
    parser = argparse.ArgumentParser(description='Database Migration Manager')
    parser.add_argument('command', choices=['migrate', 'status', 'create'], 
                       help='Command to execute')
    parser.add_argument('--target', help='Target migration for migrate command')
    parser.add_argument('--name', help='Name for new migration (create command)')
    
    args = parser.parse_args()
    
    config = load_config()
    manager = MigrationManager(config)
    
    try:
        manager.connect()
        manager.ensure_migration_table()
        
        if args.command == 'migrate':
            manager.migrate(args.target)
        elif args.command == 'status':
            manager.status()
        elif args.command == 'create':
            if not args.name:
                print("Error: --name is required for create command")
                sys.exit(1)
            manager.create_migration(args.name)
    
    finally:
        manager.disconnect()

if __name__ == '__main__':
    main()
