# WebGPU Interactive Raytracer - AI Engineer Feedback Loop Guide

This document describes the recommended workflow for AI engineers working on implementing and iterating on the WebGPU Interactive Raytracer project. By following this process, you'll ensure that your code is well-tested and meets the project requirements.

## The Feedback Loop Process

### 1. Receive Implementation Prompt

The implementation process begins when you receive a prompt asking you to implement a specific feature or fix a bug in the codebase. The prompt will include:

- A clear explanation of what needs to be implemented
- Context from the codebase
- References to relevant files and functions
- Acceptance criteria for the implementation

### 2. Implement the Feature/Fix

Based on the prompt, implement the requested feature or fix:

1. **Read and understand** the relevant code
2. **Plan your changes** to meet the requirements
3. **Implement your solution** using Test-Driven Development (TDD) where applicable
4. **Add or update tests** to verify your implementation
5. **Document your changes** with comments and JSDoc annotations

### 3. Run Tests and Get Feedback

After implementing your solution, run the tests to verify that your changes work as expected:

```bash
# Run all tests with minimal feedback (recommended)
npm run test:minimal

# Run tests for a specific module (useful for focused testing)
npm run test:module -- --dir tests/raytracer.test.js
```

The test output will be deliberately condensed to focus on the most important information:

- Number of passed/failed tests
- For failed tests: the test name, error message, and location

### 4. Analyze Test Results and Make Improvements

Based on the test results:

1. If all tests pass, great! Your implementation meets the requirements.
2. If tests fail, analyze the failure messages carefully and fix your implementation.
3. Run the tests again to verify your fixes.

Repeat steps 2-4 until all tests pass.

### 5. Generate Detailed Report (Optional)

For more detailed analysis, you can generate a comprehensive test report:

```bash
# Run tests and save results to JSON
npm run test:ci

# Generate HTML report from test results
npm run test:report
```

This will create an HTML report (`test-report.html`) with detailed information about all test results, which can be useful for more complex implementations.

### 6. Submit Implementation for Review

Once all tests pass, submit your implementation for review. Include:

1. A summary of the changes you made
2. Any design decisions or trade-offs you considered
3. Suggestions for further improvements (optional)

## Best Practices

1. **Follow the TDD approach**: Write tests before implementing the feature.
2. **Keep implementations focused**: Only change what's necessary to meet the requirements.
3. **Maintain code quality**: Follow the coding guidelines in the `.cursorrules` file.
4. **Optimize for readability**: Your code should be easy to understand and maintain.
5. **Consider edge cases**: Make sure your implementation works in all scenarios.

## Example Feedback Loop

Here's an example of how the feedback loop works in practice:

1. **Prompt**: "Implement the `updateSceneObjects` function to make the objects movable by the user."
2. **Implementation**: Add code to the `updateSceneObjects` function.
3. **Test**: Run `npm run test:minimal` and see that 2 tests fail.
4. **Fix**: Update implementation to fix the issues identified in the test results.
5. **Test again**: Run `npm run test:minimal` and verify all tests pass.
6. **Submit**: Submit implementation for review with a summary of changes.

## Troubleshooting

If you encounter issues with the testing process:

- Check that you're running the tests in the correct directory.
- Make sure all dependencies are installed (`npm install`).
- Verify that your implementation follows the project's architecture and design patterns.
- For complex issues, generate a detailed report using `npm run test:report` to get more information.

By following this feedback loop process, you'll help ensure that the WebGPU Interactive Raytracer project maintains high quality and meets all requirements. 