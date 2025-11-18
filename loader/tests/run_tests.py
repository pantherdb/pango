#!/usr/bin/env python3
"""
Test runner for panther pango loader tests.

This module provides utilities to run all tests or specific test modules.
"""

import unittest
import sys
import os
from io import StringIO


def discover_tests(start_dir=None, pattern='test_*.py'):
    """
    Discover and return all test cases in the tests directory.
    
    Args:
        start_dir: Directory to start discovery from (default: tests directory)
        pattern: Pattern to match test files (default: 'test_*.py')
    
    Returns:
        TestSuite object containing all discovered tests
    """
    if start_dir is None:
        start_dir = os.path.dirname(os.path.abspath(__file__))
    
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir, pattern=pattern)
    return suite


def run_tests(verbosity=2, failfast=False, buffer=False):
    """
    Run all discovered tests.
    
    Args:
        verbosity: Level of detail in test output (0, 1, or 2)
        failfast: Stop on first failure if True
        buffer: Buffer stdout/stderr during tests if True
    
    Returns:
        TestResult object
    """
    suite = discover_tests()
    runner = unittest.TextTestRunner(
        verbosity=verbosity,
        failfast=failfast,
        buffer=buffer
    )
    return runner.run(suite)


def run_specific_tests(test_modules, verbosity=2):
    """
    Run tests from specific modules.
    
    Args:
        test_modules: List of module names (e.g., ['test_clean_annotations'])
        verbosity: Level of detail in test output
    
    Returns:
        TestResult object
    """
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    for module_name in test_modules:
        try:
            module = __import__(module_name)
            suite.addTests(loader.loadTestsFromModule(module))
        except ImportError as e:
            print(f"Warning: Could not import {module_name}: {e}")
    
    runner = unittest.TextTestRunner(verbosity=verbosity)
    return runner.run(suite)


def get_test_coverage():
    """
    Generate a simple test coverage report by counting test methods.
    
    Returns:
        Dictionary with coverage information
    """
    suite = discover_tests()
    
    coverage_info = {
        'total_tests': 0,
        'test_files': [],
        'modules_tested': []
    }
    
    def count_tests(test_suite):
        count = 0
        for test in test_suite:
            if isinstance(test, unittest.TestSuite):
                count += count_tests(test)
            else:
                count += 1
        return count
    
    coverage_info['total_tests'] = count_tests(suite)
    
    # Get test file names
    test_dir = os.path.dirname(os.path.abspath(__file__))
    test_files = [f for f in os.listdir(test_dir) if f.startswith('test_') and f.endswith('.py')]
    coverage_info['test_files'] = test_files
    
    # Extract module names being tested
    modules_tested = []
    for test_file in test_files:
        if test_file.startswith('test_'):
            module_name = test_file[5:-3]  # Remove 'test_' prefix and '.py' suffix
            modules_tested.append(module_name)
    
    coverage_info['modules_tested'] = modules_tested
    
    return coverage_info


def main():
    """
    Main entry point for the test runner.
    
    Supports command line arguments for running specific tests or all tests.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Run panther pango loader tests')
    parser.add_argument('--module', '-m', action='append', 
                       help='Specific test module to run (can be used multiple times)')
    parser.add_argument('--verbosity', '-v', type=int, default=2, choices=[0, 1, 2],
                       help='Test output verbosity level (0=quiet, 1=normal, 2=verbose)')
    parser.add_argument('--failfast', '-f', action='store_true',
                       help='Stop on first test failure')
    parser.add_argument('--buffer', '-b', action='store_true',
                       help='Buffer stdout and stderr during tests')
    parser.add_argument('--coverage', '-c', action='store_true',
                       help='Show test coverage information')
    
    args = parser.parse_args()
    
    if args.coverage:
        coverage_info = get_test_coverage()
        print("Test Coverage Information:")
        print(f"Total tests: {coverage_info['total_tests']}")
        print(f"Test files: {len(coverage_info['test_files'])}")
        print(f"Modules tested: {', '.join(coverage_info['modules_tested'])}")
        print(f"Test files: {', '.join(coverage_info['test_files'])}")
        return
    
    if args.module:
        print(f"Running specific test modules: {', '.join(args.module)}")
        result = run_specific_tests(args.module, verbosity=args.verbosity)
    else:
        print("Running all tests...")
        result = run_tests(
            verbosity=args.verbosity,
            failfast=args.failfast,
            buffer=args.buffer
        )
    
    # Exit with error code if tests failed
    if not result.wasSuccessful():
        sys.exit(1)


if __name__ == '__main__':
    main()
