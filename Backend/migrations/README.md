# Database Migrations

This directory contains database migration scripts for the Visitor Management System.

## Migration Files

Migration files follow the naming convention: `YYYY_MM_DD_HH_MM_SS_description.sql`

### Current Migrations

1. `2025_08_05_000001_initial_schema.sql` - Initial database schema
2. `2025_08_05_000002_add_indexes.sql` - Performance indexes
3. `2025_08_05_000003_add_audit_logs.sql` - Audit logging tables

## Running Migrations

### Manual Migration
```bash
# Apply all pending migrations
python manage.py migrate

# Apply specific migration
python manage.py migrate --target 2025_08_05_000001_initial_schema
```

### Docker Migration
```bash
# Run migrations in Docker container
docker-compose exec backend python manage.py migrate
```

## Creating New Migrations

1. Create a new migration file with timestamp
2. Add SQL commands for schema changes
3. Test migration on development database
4. Update this README with migration description

## Migration Best Practices

- Always backup database before running migrations
- Test migrations on development environment first
- Include rollback procedures when possible
- Document schema changes in migration comments
- Use transactions for atomic operations

## Rollback Procedures

For critical issues, rollback procedures are documented in each migration file.
