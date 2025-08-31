#!/bin/bash

# Test runner script for Panther Pango Loader
# This script runs all tests for the clean_annotations, generate_gene_annotations, 
# clean_articles, and utils modules

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}Panther Pango Loader Test Suite${NC}"
echo "=================================="
echo "Project root: $PROJECT_ROOT"
echo "Test directory: $SCRIPT_DIR"
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Function to run a specific test module
run_test() {
    local test_file=$1
    local test_name=$2
    
    print_status "INFO" "Running $test_name tests..."
    
    if [ -f "$SCRIPT_DIR/$test_file" ]; then
        cd "$PROJECT_ROOT"
        if python -m pytest "$SCRIPT_DIR/$test_file" -v; then
            print_status "SUCCESS" "$test_name tests passed"
            return 0
        else
            print_status "ERROR" "$test_name tests failed"
            return 1
        fi
    else
        print_status "WARNING" "Test file $test_file not found, skipping..."
        return 0
    fi
}

# Function to run tests with unittest
run_unittest() {
    local test_file=$1
    local test_name=$2
    
    print_status "INFO" "Running $test_name tests (unittest)..."
    
    if [ -f "$SCRIPT_DIR/$test_file" ]; then
        cd "$PROJECT_ROOT"
        if $PYTHON_CMD -m unittest "tests.$(basename "$test_file" .py)" -v; then
            print_status "SUCCESS" "$test_name tests passed"
            return 0
        else
            print_status "ERROR" "$test_name tests failed"
            return 1
        fi
    else
        print_status "WARNING" "Test file $test_file not found, skipping..."
        return 0
    fi
}

# Check if Python is available
if ! command -v python &> /dev/null; then
    print_status "ERROR" "Python is not installed or not in PATH"
    exit 1
fi

# Check for virtual environment in project root
VENV_PYTHON="$PROJECT_ROOT/venv/Scripts/python.exe"
if [ -f "$VENV_PYTHON" ]; then
    PYTHON_CMD="$VENV_PYTHON"
    print_status "INFO" "Using virtual environment Python"
else
    PYTHON_CMD="python"
    print_status "INFO" "Using system Python"
fi

# Check Python version
python_version=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
print_status "INFO" "Using Python $python_version"

# Check if required modules are available
print_status "INFO" "Checking dependencies..."

# Try to import required modules
$PYTHON_CMD -c "import pandas, unittest, tempfile, json" 2>/dev/null || {
    print_status "ERROR" "Required Python modules not found. Please install: pandas"
    print_status "INFO" "You can install with: pip install pandas"
    exit 1
}

print_status "SUCCESS" "All dependencies found"
echo ""

# Initialize test results
total_tests=0
passed_tests=0
failed_tests=0

# Test modules to run
declare -a test_modules=(
    "test_utils.py:Utils"
    "test_clean_articles.py:Clean Articles"
    "test_clean_annotations.py:Clean Annotations" 
    "test_generate_gene_annotations.py:Generate Gene Annotations"
)

# Parse command line arguments
case "${1:-all}" in
    "all")
        print_status "INFO" "Running all tests..."
        ;;
    "utils")
        test_modules=("test_utils.py:Utils")
        ;;
    "articles")
        test_modules=("test_clean_articles.py:Clean Articles")
        ;;
    "annotations")
        test_modules=("test_clean_annotations.py:Clean Annotations")
        ;;
    "genes")
        test_modules=("test_generate_gene_annotations.py:Generate Gene Annotations")
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [test_type]"
        echo ""
        echo "Test types:"
        echo "  all          Run all tests (default)"
        echo "  utils        Run utils tests only"
        echo "  articles     Run clean_articles tests only"
        echo "  annotations  Run clean_annotations tests only"
        echo "  genes        Run generate_gene_annotations tests only"
        echo "  help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0              # Run all tests"
        echo "  $0 all          # Run all tests"
        echo "  $0 utils        # Run only utils tests"
        echo "  $0 articles     # Run only clean_articles tests"
        exit 0
        ;;
    *)
        print_status "ERROR" "Unknown test type: $1"
        print_status "INFO" "Use '$0 help' for usage information"
        exit 1
        ;;
esac

# Run the tests
echo "Running selected tests..."
echo ""

for test_module in "${test_modules[@]}"; do
    IFS=':' read -r test_file test_name <<< "$test_module"
    
    total_tests=$((total_tests + 1))
    
    if run_unittest "$test_file" "$test_name"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    echo ""
done

# Print summary
echo "=================================="
echo -e "${BLUE}Test Results Summary${NC}"
echo "=================================="
echo "Total test modules: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"

if [ $failed_tests -gt 0 ]; then
    echo -e "Failed: ${RED}$failed_tests${NC}"
else
    echo -e "Failed: $failed_tests"
fi

echo ""

# Exit with appropriate code
if [ $failed_tests -eq 0 ]; then
    print_status "SUCCESS" "All tests passed!"
    exit 0
else
    print_status "ERROR" "Some tests failed!"
    exit 1
fi
