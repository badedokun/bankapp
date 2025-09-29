#!/bin/bash

# RBAC Endpoints Test Runner
# This script runs comprehensive tests for all RBAC endpoints

set -e

echo "🚀 Starting RBAC Endpoints Test Suite..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if servers are running
check_servers() {
    print_status "Checking if servers are running..."

    # Check backend server
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Backend server is running on port 3001"
    else
        print_error "Backend server is not running on port 3001"
        print_warning "Please start the backend server first:"
        echo "  ENABLE_AI_INTELLIGENCE=true npm run server"
        exit 1
    fi

    # Check frontend server (optional)
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend server is running on port 3000"
    else
        print_warning "Frontend server is not running (optional for API tests)"
    fi
}

# Run API endpoint tests
run_api_tests() {
    print_status "Running RBAC API endpoint tests..."

    if npx playwright test tests/api/rbac-endpoints.test.ts --reporter=list --project=chromium; then
        print_success "API endpoint tests completed successfully"
    else
        print_error "API endpoint tests failed"
        return 1
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running RBAC service unit tests..."

    if npx playwright test tests/unit/rbac-service.test.ts --reporter=list --project=chromium; then
        print_success "Unit tests completed successfully"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Run performance tests
run_performance_tests() {
    print_status "Running performance tests..."

    # Run specific performance-related tests
    if npx playwright test tests/api/rbac-endpoints.test.ts --grep="Performance Test" --reporter=list --project=chromium; then
        print_success "Performance tests completed successfully"
    else
        print_error "Performance tests failed"
        return 1
    fi
}

# Run security tests
run_security_tests() {
    print_status "Running security tests..."

    # Run security-related tests
    if npx playwright test tests/api/rbac-endpoints.test.ts --grep="Unauthorized|Invalid Token" --reporter=list --project=chromium; then
        print_success "Security tests completed successfully"
    else
        print_error "Security tests failed"
        return 1
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."

    # Create reports directory if it doesn't exist
    mkdir -p test-results/rbac-reports

    # Run all tests with JSON reporter
    npx playwright test tests/api/rbac-endpoints.test.ts tests/unit/rbac-service.test.ts \
        --reporter=json > test-results/rbac-reports/test-results.json 2>/dev/null || true

    # Create a simple HTML report
    cat > test-results/rbac-reports/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>RBAC Endpoints Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .test-section { margin: 20px 0; padding: 15px; border-left: 4px solid #007acc; }
        .success { border-left-color: #28a745; }
        .error { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 RBAC Endpoints Test Report</h1>
        <p class="timestamp">Generated: $(date)</p>
        <p>Comprehensive test suite for RBAC API endpoints and services</p>
    </div>

    <div class="test-section success">
        <h2>✅ Test Coverage</h2>
        <ul>
            <li>Enhanced Dashboard Data Endpoint</li>
            <li>User Permissions & Roles</li>
            <li>Feature Access Control</li>
            <li>Security & Authentication</li>
            <li>Performance & Caching</li>
            <li>Data Validation & Consistency</li>
            <li>Multi-tenant Isolation</li>
            <li>Error Handling</li>
        </ul>
    </div>

    <div class="test-section">
        <h2>📊 Test Results</h2>
        <p>For detailed test results, check the console output or test-results directory.</p>
        <p>Test files:</p>
        <ul>
            <li><code>tests/api/rbac-endpoints.test.ts</code> - API endpoint tests</li>
            <li><code>tests/unit/rbac-service.test.ts</code> - Service unit tests</li>
        </ul>
    </div>

    <div class="test-section">
        <h2>🚀 Running Tests</h2>
        <pre>
# Run all RBAC tests
./scripts/test-rbac-endpoints.sh

# Run specific test suites
npx playwright test tests/api/rbac-endpoints.test.ts --reporter=list
npx playwright test tests/unit/rbac-service.test.ts --reporter=list

# Run with specific environment
TEST_URL=http://localhost:3001 npx playwright test tests/api/rbac-endpoints.test.ts
        </pre>
    </div>
</body>
</html>
EOF

    print_success "Test report generated: test-results/rbac-reports/index.html"
}

# Main execution flow
main() {
    echo "📋 RBAC Endpoints Test Suite"
    echo "Test URL: ${TEST_URL:-http://localhost:3001}"
    echo "======================================"

    # Check prerequisites
    check_servers

    # Initialize test results
    local test_failures=0

    # Run test suites
    echo ""
    print_status "Starting test execution..."

    # API Tests
    if ! run_api_tests; then
        ((test_failures++))
    fi

    echo ""

    # Unit Tests
    if ! run_unit_tests; then
        ((test_failures++))
    fi

    echo ""

    # Performance Tests
    if ! run_performance_tests; then
        ((test_failures++))
    fi

    echo ""

    # Security Tests
    if ! run_security_tests; then
        ((test_failures++))
    fi

    echo ""

    # Generate report
    generate_report

    # Final summary
    echo ""
    echo "======================================"
    if [ $test_failures -eq 0 ]; then
        print_success "🎉 All RBAC tests passed successfully!"
        print_status "✅ Enhanced Dashboard API integration is working correctly"
        print_status "✅ All RBAC endpoints are functioning properly"
        print_status "✅ Security controls are in place"
        print_status "✅ Performance is within acceptable limits"
    else
        print_error "❌ $test_failures test suite(s) failed"
        print_warning "Please check the test output above for details"
        exit 1
    fi

    echo ""
    print_status "📋 Test report available at: test-results/rbac-reports/index.html"
    print_status "🔍 For detailed logs, check: test-results/ directory"
}

# Handle script arguments
case "${1:-}" in
    "api")
        check_servers
        run_api_tests
        ;;
    "unit")
        check_servers
        run_unit_tests
        ;;
    "performance")
        check_servers
        run_performance_tests
        ;;
    "security")
        check_servers
        run_security_tests
        ;;
    "report")
        generate_report
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [api|unit|performance|security|report|help]"
        echo ""
        echo "Commands:"
        echo "  api         - Run API endpoint tests only"
        echo "  unit        - Run unit tests only"
        echo "  performance - Run performance tests only"
        echo "  security    - Run security tests only"
        echo "  report      - Generate test report only"
        echo "  help        - Show this help message"
        echo ""
        echo "Default: Run all test suites"
        ;;
    *)
        main
        ;;
esac