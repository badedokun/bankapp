#!/bin/bash

# Setup script for comprehensive test framework
# Installs dependencies and configures testing infrastructure

echo "🔧 Setting up comprehensive test framework..."

# Install testing dependencies
echo "📦 Installing test framework dependencies..."

npm install --save-dev \
  @playwright/test \
  @testing-library/react-native \
  @testing-library/jest-native \
  jest-environment-jsdom \
  husky \
  lint-staged

# Install git hooks
echo "🔗 Setting up Git hooks..."
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

# Configure git to use custom hooks directory
git config core.hooksPath .githooks

# Initialize Playwright
echo "🎭 Initializing Playwright..."
npx playwright install

# Setup lint-staged configuration
echo "⚙️  Configuring lint-staged..."
cat > .lintstagedrc.json << EOF
{
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "npm run test:feature --"
  ]
}
EOF

# Setup husky
echo "🐕 Setting up Husky..."
npx husky install
npx husky add .husky/pre-commit "npm run test:pre-commit"
npx husky add .husky/pre-push "npm run test:pre-push"

# Create test directories if they don't exist
echo "📁 Creating test directory structure..."
mkdir -p tests/{e2e,integration,ux,utils,framework}

# Create Jest configuration for different test types
echo "📝 Creating Jest configuration..."
cat > jest.config.js << 'EOF'
module.exports = {
  projects: [
    {
      displayName: 'React Native',
      preset: 'react-native',
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'Backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/backend/**/*.test.{js,ts}'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'Integration Tests',
      preset: 'react-native',
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'UX Tests',
      preset: 'react-native',
      setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
      testMatch: ['<rootDir>/tests/ux/**/*.test.{js,jsx,ts,tsx}'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'server/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
EOF

# Create GitHub Actions workflow for CI
echo "🔄 Setting up CI workflow..."
mkdir -p .github/workflows

cat > .github/workflows/test.yml << 'EOF'
name: Comprehensive Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: bank_app_platform_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: npm run db:setup
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_USER: postgres
        DB_PASSWORD: postgres
        DB_NAME: bank_app_platform_test
    
    - name: Run backend tests
      run: npm run test:backend
    
    - name: Run frontend tests
      run: npm run test:frontend
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run UX validation tests
      run: npm run test:ux
    
    - name: Install Playwright browsers
      run: npx playwright install
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: test-results
        path: test-results/
EOF

echo "📚 Creating test documentation..."
cat > tests/README.md << 'EOF'
# Test Framework Documentation

## Quick Start

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:frontend     # React Native component tests
npm run test:backend      # API endpoint tests
npm run test:integration  # Frontend-backend integration tests
npm run test:ux          # User experience validation tests
npm run test:e2e         # End-to-end user journey tests

# Development workflow
npm run test:watch       # Watch mode for development
npm run test:feature     # Test only files related to staged changes
```

## Test Types

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test frontend-backend integration
3. **UX Tests**: Validate user experience principles
4. **E2E Tests**: Test complete user workflows

## Writing Tests

### For New Features:
1. Create unit tests in `src/**/__tests__/`
2. Create integration tests in `tests/integration/`
3. Create UX validation tests in `tests/ux/`
4. Create E2E tests in `tests/e2e/` for critical paths

### Test Requirements:
- All new features must have integration tests
- UI components must have UX validation tests
- Critical user journeys must have E2E tests
- All tests must pass before merging

## Test Helpers

Import test utilities:
```typescript
import { 
  AlertTestHelper, 
  APIResponseValidator, 
  UserInputValidator 
} from '../utils/test-helpers';
```

See `tests/utils/test-helpers.ts` for available utilities.
EOF

echo "✅ Test framework setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run test:all' to verify setup"
echo "2. Check existing tests with new framework"
echo "3. Start writing comprehensive tests for new features"
echo "4. Review test coverage with 'npm run test:coverage'"
echo ""
echo "🔧 Git hooks are now active - tests will run automatically on commit/push"