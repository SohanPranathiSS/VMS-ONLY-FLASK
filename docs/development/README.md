# Development Documentation

## Overview
This directory contains development guides, coding standards, and contributor information.

## Getting Started

### Prerequisites
- **Node.js** 16+ (for Frontend)
- **Python** 3.9+ (for Backend/ML)
- **MySQL** 8.0+ (for Database)
- **Git** (for version control)

### Development Setup
1. **Clone Repository**
   ```bash
   git clone https://github.com/SohanPranathiSS/visitor-management-system-Version-3.git
   cd visitor-management-system-Version-3
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install Dependencies**
   ```bash
   # Frontend
   cd Frontend && npm install

   # Backend
   cd ../Backend && pip install -r requirements.txt

   # ML Service
   cd ../ML && pip install -r requirements.txt
   ```

## Development Workflow

### Git Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push and create PR: `git push origin feature/your-feature`

### Commit Convention
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build/tooling changes

## Coding Standards

### Python (Backend/ML)
- Follow **PEP 8** style guide
- Use **Black** for code formatting
- Use **Pylint** for linting
- Document functions with docstrings
- Write unit tests for all functions

### JavaScript (Frontend)
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Use meaningful variable names
- Write JSDoc comments for functions
- Create tests for components

### Database
- Use snake_case for table/column names
- Include created_at/updated_at timestamps
- Use proper foreign key constraints
- Document schema changes

## Testing Guidelines

### Frontend Testing
```bash
cd Frontend
npm test                    # Run tests
npm run test:coverage      # Coverage report
```

### Backend Testing
```bash
cd Backend
pytest                     # Run tests
pytest --cov=src          # Coverage report
```

### ML Testing
```bash
cd ML
pytest tests/             # Run ML tests
```

## Code Review Guidelines
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No sensitive data in commits
- [ ] Performance impact considered

## Development Tools
- **VS Code** - Recommended editor
- **Docker** - Container development
- **Postman** - API testing
- **MySQL Workbench** - Database management

## Troubleshooting
- Check logs in respective service directories
- Verify environment variables are set
- Ensure all services are running
- Check database connections
