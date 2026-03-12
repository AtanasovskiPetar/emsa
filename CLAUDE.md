---
description: This are rules for all technologies used in this project. Bun, react, typescript, shadcn, etc. All with their best practices, and common patterns. It includes performance optimization, security considerations, and testing strategies.
globs: **/*.{js,ts,jsx,tsx,bun}
alwaysApply: true
---

By following these best practices, you can ensure that your JavaScript/TypeScript code is clean, consistent, and maintainable, reducing the risk of bugs and improving overall code quality.

Before each change, ensure the code is compiling without any errors.

# Bun Library Best Practices

This document outlines the recommended coding standards, best practices, and patterns for developing applications using the Bun library. Following these guidelines ensures maintainability, performance, security, and overall code quality.

## 1. Code Organization and Structure

### 1.1. Directory Structure

A well-defined directory structure is crucial for maintainability. Consider the following structure as a starting point:

project-root/
├── src/ # Source code
│ ├── components/ # Reusable UI components (if applicable)
│ ├── services/ # Business logic and API interactions
│ ├── utils/ # Utility functions
│ ├── types/ # TypeScript type definitions
│ ├── routes/ # API route handlers
│ ├── middleware/ # Middleware functions
│ ├── models/ # Data models
│ ├── config/ # Configuration files
│ ├── index.ts # Entry point for the application
├── tests/ # Unit and integration tests
├── public/ # Static assets (e.g., images, CSS)
├── .env # Environment variables
├── bun.lockb # Lockfile for dependencies
├── package.json # Project metadata and dependencies
├── tsconfig.json # TypeScript configuration
├── README.md # Project documentation

- **src/**: Contains the main source code of the application.
- **components/**: Houses reusable UI components (if building a web application).
- **services/**: Encapsulates business logic and interactions with external APIs.
- **utils/**: Contains utility functions used throughout the application.
- **types/**: Stores TypeScript type definitions.
- **routes/**: Defines API route handlers using Bun's built-in HTTP server.
- **middleware/**: Includes middleware functions for request processing.
- **models/**: Defines data models used in the application.
- **config/**: Contains configuration files for different environments.
- **tests/**: Holds unit and integration tests.
- **public/**: Stores static assets like images and CSS files.
- **.env**: Stores environment variables.
- **bun.lockb**: Lockfile ensuring consistent dependency versions.
- **package.json**: Defines project metadata and dependencies.
- **tsconfig.json**: Configures TypeScript compiler options.
- **README.md**: Provides project documentation and instructions.

### 1.2. File Naming Conventions

- Use descriptive and consistent file names.
- Prefer camelCase for JavaScript/TypeScript files (e.g., `userService.ts`, `apiHelper.js`).
- Use kebab-case for component directories (e.g., `user-profile`).
- For React components, use PascalCase for the filename (e.g., `UserProfile.tsx`).

### 1.3. Module Organization

- Group related functionality into modules.
- Use clear and concise module names.
- Export only the necessary functions and classes from each module.
- Favor explicit imports over global variables.

### 1.4. Component Architecture (if applicable)

- If building a web application, adopt a component-based architecture (e.g., using React, SolidJS).
- Divide the UI into small, reusable components.
- Follow the Single Responsibility Principle (SRP) for each component.
- Use a consistent component structure (e.g., a folder for each component containing the component file, styles, and tests).

### 1.5. Code Splitting Strategies

- Use dynamic imports (`import()`) to split code into smaller chunks.
- Load only the necessary code for each route or component.
- Consider using a library like `esbuild` (Bun's underlying bundler) or `parcel` to automate code splitting.

## 2. Common Patterns and Anti-patterns

### 2.1. Design Patterns

- **Singleton**: Use for managing global resources (e.g., database connections, configuration).
- **Factory**: Use for creating objects without specifying their concrete classes.
- **Observer**: Use for implementing event-driven systems.
- **Middleware**: Use to handle requests and responses in a centralized manner.
- **Dependency Injection**: Use to decouple components and improve testability.

### 2.2. Recommended Approaches for Common Tasks

- **API Request Handling**: Utilize `fetch` API provided by Bun for making HTTP requests.
- **File System Operations**: Use `Bun.file()` and other built-in functions for reading and writing files.
- **Process Management**: Leverage `Bun.spawn()` or `Bun.serve()` to manage child processes and servers.
- **Environment Variable Access**: Use `Bun.env` or `process.env` to access environment variables.
- **Logging**: Implement logging using `console.log` or a dedicated logging library like `pino`.

### 2.3. Anti-patterns and Code Smells

- **Global State**: Avoid using global variables for application state. Use state management solutions instead.
- **Long Functions**: Break down long functions into smaller, more manageable functions.
- **Duplicated Code**: Extract common logic into reusable functions or modules.
- **Magic Numbers**: Use named constants instead of hardcoded values.
- **Ignoring Errors**: Always handle errors properly using try-catch blocks or error handling middleware.

### 2.4. State Management Best Practices

- If your application requires complex state management, consider using a library like Zustand, Valtio, or Jotai.
- Choose a state management solution that fits the complexity of your application.
- Keep state updates predictable and consistent.
- Avoid mutating state directly.

### 2.5. Error Handling Patterns

- Use try-catch blocks to handle synchronous errors.
- Use `async/await` with try-catch blocks for asynchronous errors.
- Implement error handling middleware to catch unhandled exceptions.
- Log errors with relevant information (e.g., stack trace, request details).
- Provide informative error messages to the user.

## 3. Performance Considerations

### 3.1. Optimization Techniques

- **Minimize Dependencies**: Reduce the number of dependencies to decrease bundle size and install time.
- **Code Splitting**: Split code into smaller chunks that can be loaded on demand.
- **Tree Shaking**: Remove unused code during the build process.
- **Caching**: Cache frequently accessed data to reduce latency.
- **Compression**: Compress responses using gzip or Brotli to reduce network traffic.
- **Efficient Algorithms**: Choose the most efficient algorithms for your tasks.

### 3.2. Memory Management

- Avoid memory leaks by properly releasing resources.
- Use weak references to avoid circular dependencies.
- Monitor memory usage using tools like `bun --inspect`.
- Be mindful of large data structures and use streams when appropriate.

### 3.3. Rendering Optimization (if applicable)

- Use virtualization for large lists or tables.
- Optimize images and other assets.
- Use memoization to avoid unnecessary re-renders.
- Profile rendering performance using browser developer tools.

### 3.4. Bundle Size Optimization

- Use a bundler like `esbuild` to minimize bundle size.
- Remove unused code and dependencies.
- Use code splitting to load only the necessary code.
- Consider using a smaller alternative to large libraries.

### 3.5. Lazy Loading Strategies

- Use dynamic imports (`import()`) to load modules on demand.
- Implement lazy loading for images and other assets.
- Use a library like `react-lazyload` (if using React) to simplify lazy loading.

## 4. Security Best Practices

### 4.1. Common Vulnerabilities and How to Prevent Them

- **Cross-Site Scripting (XSS)**: Sanitize user input to prevent malicious scripts from being injected into the page.
- **Cross-Site Request Forgery (CSRF)**: Use CSRF tokens to prevent attackers from forging requests on behalf of authenticated users.
- **SQL Injection**: Use parameterized queries or an ORM to prevent attackers from injecting malicious SQL code.
- **Authentication and Authorization**: Implement robust authentication and authorization mechanisms to protect sensitive data.
- **Denial of Service (DoS)**: Implement rate limiting and other measures to prevent attackers from overwhelming the server.

### 4.2. Input Validation

- Validate all user input on both the client and server sides.
- Use a validation library like `zod` or `yup` to define validation schemas.
- Sanitize user input to remove potentially harmful characters.
- Escape user input when displaying it on the page.

### 4.3. Authentication and Authorization Patterns

- Use a secure authentication protocol like OAuth 2.0 or OpenID Connect.
- Store passwords securely using a hashing algorithm like bcrypt or Argon2.
- Implement role-based access control (RBAC) to restrict access to sensitive resources.
- Use JSON Web Tokens (JWT) for authentication and authorization.

### 4.4. Data Protection Strategies

- Encrypt sensitive data at rest and in transit.
- Use HTTPS to encrypt communication between the client and server.
- Store encryption keys securely using a key management system.
- Regularly back up data to prevent data loss.

### 4.5. Secure API Communication

- Use HTTPS for all API communication.
- Implement API authentication using API keys or JWTs.
- Rate limit API requests to prevent abuse.
- Validate API requests and responses.
- Use a firewall to protect the API from unauthorized access.

## 5. Testing Approaches

### 5.1. Unit Testing Strategies

- Write unit tests for individual functions and classes.
- Use a testing framework like Jest or Bun's built-in test runner.
- Aim for high code coverage.
- Use mocks and stubs to isolate units of code.
- Test edge cases and error conditions.

### 5.2. Integration Testing

- Write integration tests to verify the interaction between different modules.
- Test the integration of the application with external APIs.
- Use a testing framework like Jest or Mocha.
- Use a testing database or mock API to isolate the tests.

### 5.3. End-to-End Testing

- Write end-to-end tests to verify the entire application flow.
- Use a testing framework like Playwright or Cypress.
- Run tests in a browser environment.
- Test the application from the user's perspective.

### 5.4. Test Organization

- Create a separate `tests` directory for test files.
- Organize test files in a way that mirrors the source code structure.
- Use descriptive test names.
- Follow a consistent testing style.

### 5.5. Mocking and Stubbing

- Use mocks and stubs to isolate units of code during testing.
- Use a mocking library like `jest.mock()` or `sinon`.
- Mock external dependencies to avoid relying on external services.
- Stub functions to control their behavior during testing.

## 6. Common Pitfalls and Gotchas

### 6.1. Frequent Mistakes Developers Make

- **Not Using Strict Mode**: Always use strict mode (`'use strict'`) to catch common coding errors.
- **Ignoring Error Handling**: Always handle errors properly using try-catch blocks or error handling middleware.
- **Leaking Global Variables**: Avoid creating global variables by using `let` or `const` to declare variables.
- **Not Understanding Asynchronous JavaScript**: Understand how asynchronous JavaScript works to avoid common pitfalls like callback hell.
- **Over-Engineering**: Keep the code simple and avoid unnecessary complexity.

### 6.2. Edge Cases to Be Aware Of

- **Handling Null and Undefined Values**: Check for null and undefined values before using them to avoid errors.
- **Integer Overflow**: Be aware of integer overflow and underflow when performing arithmetic operations.
- **Unicode Support**: Properly handle Unicode characters to avoid encoding issues.
- **Time Zone Handling**: Handle time zones correctly to avoid date and time discrepancies.

### 6.3. Version-Specific Issues

- Be aware of breaking changes in new versions of Bun.
- Test the application with different versions of Bun to ensure compatibility.
- Use a version manager like `bunx` to manage different Bun versions.

### 6.4. Compatibility Concerns

- Ensure the application is compatible with different operating systems and browsers.
- Use polyfills to support older browsers.
- Test the application on different devices to ensure responsiveness.

### 6.5. Debugging Strategies

- Use the `bun --inspect` flag to debug the application using Chrome DevTools.
- Use `console.log` statements to print debugging information.
- Use a debugger like VS Code's built-in debugger.
- Use a logging library to log errors and other important events.

## 7. Tooling and Environment

### 7.1. Recommended Development Tools

- **VS Code**: A popular code editor with excellent TypeScript support.
- **ESLint**: A linter for identifying and fixing code style issues.
- **Prettier**: A code formatter for automatically formatting code.
- **Jest**: A testing framework for unit and integration testing.
- **Playwright/Cypress**: A testing framework for end-to-end testing.
- **Postman/Insomnia**: API client for testing API endpoints.

### 7.2. Build Configuration

- Use a build tool like `esbuild` or `webpack` to bundle the application.
- Configure the build tool to optimize the bundle size and performance.
- Use environment variables to configure the build process for different environments.

### 7.3. Linting and Formatting

- Use ESLint to enforce consistent coding style.
- Use Prettier to automatically format code.
- Integrate ESLint and Prettier into the development workflow using VS Code extensions or command-line tools.
- Configure ESLint and Prettier to follow the project's coding style guidelines.

### 7.4. Deployment Best Practices

- Use a process manager like `pm2` or `systemd` to manage the application in production.
- Deploy the application to a cloud platform like DigitalOcean, Vercel, or Render.
- Use a CI/CD pipeline to automate the deployment process.
- Monitor the application's performance and health using monitoring tools.

### 7.5. CI/CD Integration

- Use a CI/CD platform like GitHub Actions, GitLab CI, or CircleCI to automate the build, test, and deployment process.
- Configure the CI/CD pipeline to run tests, lint code, and build the application on every commit.
- Use environment variables to configure the CI/CD pipeline for different environments.
- Deploy the application to a staging environment before deploying it to production.

By following these best practices, developers can build high-quality, performant, and secure applications using the Bun library. Remember to adapt these guidelines to the specific needs of your project.

# TypeScript Best Practices and Coding Standards

This document outlines best practices and coding standards for developing TypeScript applications. Following these guidelines will help ensure code quality, maintainability, and scalability.

## 1. Code Organization and Structure

- **Directory Structure:**
  - **Feature-based:** Group files related to a specific feature within a dedicated directory.

  src/
  ├── feature1/
  │ ├── components/
  │ │ ├── ComponentA.tsx
  │ │ └── ComponentB.tsx
  │ ├── services/
  │ │ └── feature1.service.ts
  │ ├── types.ts
  │ └── feature1.module.ts
  ├── feature2/
  │ └── ...
  └── shared/
  ├── components/
  │ └── ReusableComponent.tsx
  ├── services/
  │ └── api.service.ts
  └── types/
  └── global.d.ts
  - **Type-based:** Separate files based on their role (components, services, types, etc.).

  src/
  ├── components/
  │ ├── Feature1Component.tsx
  │ └── Feature2Component.tsx
  ├── services/
  │ ├── feature1.service.ts
  │ └── feature2.service.ts
  ├── types/
  │ ├── feature1.types.ts
  │ └── feature2.types.ts
  └── modules/
  ├── feature1.module.ts
  └── feature2.module.ts
  - Choose the structure that best fits your project's complexity and team's preferences. Consistency is key.

- **File Naming Conventions:**
  - Use descriptive and consistent file names.
  - Components: `ComponentName.tsx`
  - Services: `serviceName.service.ts`
  - Types: `typeName.types.ts` or `types.ts` (if grouping related types)
  - Modules: `moduleName.module.ts`
  - Interfaces: `IInterfaceName.ts` (or `interfaceName.interface.ts` if preferred and consistent throughout the codebase)

- **Module Organization:**
  - Use ES Modules (`import`/`export`) for modularity and reusability.
  - Favor named exports over default exports for better discoverability and refactoring.
  - Group related functionality into modules.
  - Avoid circular dependencies.

- **Component Architecture:**
  - Consider using component-based architectures like React, Angular, or Vue.js.
  - Follow component design principles: Single Responsibility Principle, separation of concerns.
  - Use composition over inheritance.
  - Keep components small and focused.

- **Code Splitting Strategies:**
  - Split your application into smaller chunks to improve initial load time.
  - Implement lazy loading for modules and components that are not immediately needed.
  - Use dynamic imports (`import()`).
  - Webpack, Parcel, and other bundlers offer built-in support for code splitting.

## 2. Common Patterns and Anti-patterns

- **Design Patterns:**
  - **Factory Pattern:** Use factories to create objects with complex initialization logic.
  - **Singleton Pattern:** Use sparingly, and only when a single instance is truly required.
  - **Observer Pattern:** Implement reactive patterns for handling events and data changes.
  - **Strategy Pattern:** Define a family of algorithms and encapsulate each one into a separate class.
  - **Dependency Injection:** Reduce coupling by injecting dependencies into components and services.

- **Recommended Approaches:**
  - **Data Fetching:** Use libraries like `axios` or `fetch` for making API requests.
  - **State Management:** Choose a state management solution appropriate for your application's complexity (e.g., React Context, Redux, Zustand, MobX).
  - **Form Handling:** Use libraries like `react-hook-form` or `formik` for managing form state and validation.

- **Anti-patterns and Code Smells:**
  - **`any` type overuse:** Avoid using `any` as much as possible. Use more specific types or generics.
  - **Long methods/functions:** Break down large functions into smaller, more manageable units.
  - **Deeply nested code:** Refactor deeply nested code to improve readability.
  - **Magic numbers/strings:** Use constants for values that have a specific meaning.
  - **Duplicated code:** Extract common logic into reusable functions or components.
  - **Ignoring errors:** Always handle errors gracefully. Don't just catch and ignore them.
  - **Over-commenting:** Write self-documenting code and use comments only when necessary to explain complex logic.

- **State Management Best Practices:**
  - Choose a state management library based on project needs: React Context API, Redux, Zustand, MobX.
  - Keep state minimal and derive values where possible.
  - Follow immutable update patterns (especially with Redux).
  - Use selectors to access state.
  - Centralize state logic.

- **Error Handling Patterns:**
  - Use `try...catch` blocks to handle potential errors.
  - Implement a global error handler to catch unhandled exceptions.
  - Use error logging to track errors in production.
  - Use discriminated unions for representing different error states.
  - Implement retry mechanisms for transient errors.

## 3. Performance Considerations

- **Optimization Techniques:**
  - **Memoization:** Use memoization techniques (e.g., `React.memo`, `useMemo`) to avoid unnecessary re-renders.
  - **Debouncing and Throttling:** Limit the rate at which functions are executed in response to user input.
  - **Virtualization:** Use virtualization for rendering large lists or tables.
  - **Code Splitting:** Split your code into smaller chunks to reduce initial load time.

- **Memory Management:**
  - Avoid memory leaks by properly cleaning up resources (e.g., event listeners, timers).
  - Use weak references to avoid circular dependencies that can prevent garbage collection.
  - Profile your application to identify memory leaks.

- **Rendering Optimization:**
  - Minimize DOM manipulations.
  - Use CSS transforms and animations instead of JavaScript animations.
  - Optimize images and other assets.
  - Use the `shouldComponentUpdate` lifecycle method or `React.memo` to prevent unnecessary re-renders.

- **Bundle Size Optimization:**
  - Use tree shaking to remove unused code from your bundle.
  - Minify your code to reduce bundle size.
  - Compress your code using gzip or Brotli.
  - Use code splitting to load only the code that is needed for a particular page or component.

- **Lazy Loading Strategies:**
  - Lazy load modules and components that are not immediately needed.
  - Use dynamic imports (`import()`) to load modules on demand.
  - Implement a loading indicator to provide feedback to the user while the module is loading.

## 4. Security Best Practices

- **Common Vulnerabilities and Prevention:**
  - **Cross-Site Scripting (XSS):** Sanitize user input and escape output to prevent XSS attacks.
  - **Cross-Site Request Forgery (CSRF):** Use anti-CSRF tokens to protect against CSRF attacks.
  - **SQL Injection:** Use parameterized queries or ORMs to prevent SQL injection attacks (relevant for backend TypeScript).
  - **Denial of Service (DoS):** Implement rate limiting and other measures to prevent DoS attacks.
  - **Man-in-the-Middle (MitM):** Use HTTPS to encrypt communication between the client and server.

- **Input Validation:**
  - Validate all user input on both the client and server sides.
  - Use strong validation rules to prevent malicious input.
  - Sanitize user input to remove potentially harmful characters.

- **Authentication and Authorization Patterns:**
  - Use a secure authentication mechanism to verify user identities.
  - Implement authorization checks to control access to resources.
  - Use role-based access control (RBAC) to manage user permissions.
  - Use JSON Web Tokens (JWT) for stateless authentication.

- **Data Protection Strategies:**
  - Encrypt sensitive data at rest and in transit.
  - Use strong encryption algorithms.
  - Store passwords securely using a hashing algorithm and salt.
  - Protect API keys and other secrets.

- **Secure API Communication:**
  - Use HTTPS for all API communication.
  - Implement proper authentication and authorization for API endpoints.
  - Use rate limiting to prevent abuse.
  - Validate API requests and responses.

## 5. Testing Approaches

- **Unit Testing Strategies:**
  - Write unit tests for individual functions and components.
  - Use mocking and stubbing to isolate units of code.
  - Test edge cases and error conditions.
  - Aim for high code coverage.

- **Integration Testing:**
  - Test the interaction between different modules and components.
  - Verify that different parts of the application work together correctly.

- **End-to-End Testing:**
  - Test the entire application from the user's perspective.
  - Use tools like Cypress or Playwright to automate end-to-end tests.

- **Test Organization:**
  - Organize tests in a way that makes it easy to find and run them.
  - Group tests by feature or module.
  - Use descriptive test names.

- **Mocking and Stubbing:**
  - Use mocking and stubbing to isolate units of code and simulate dependencies.
  - Use mocking libraries like Jest or Sinon.js.

## 6. Common Pitfalls and Gotchas

- **Frequent Mistakes:**
  - Incorrectly handling asynchronous operations (Promises, async/await).
  - Not handling errors properly.
  - Overusing the `any` type.
  - Ignoring compiler warnings.
  - Not keeping dependencies up to date.

- **Edge Cases:**
  - Handling different browser versions and devices.
  - Dealing with network latency and failures.
  - Handling different time zones and locales.
  - Handling large datasets and complex calculations.

- **Version-Specific Issues:**
  - Be aware of breaking changes in new versions of TypeScript and related libraries.
  - Consult the release notes for each new version to identify potential issues.
  - Use TypeScript's compiler options to target specific ECMAScript versions and maintain backwards compatibility if needed.

- **Compatibility Concerns:**
  - Ensure that your code is compatible with the target browsers and devices.
  - Use polyfills to provide support for older browsers.
  - Test your code on different platforms to identify compatibility issues.

- **Debugging Strategies:**
  - Use a debugger to step through your code and inspect variables.
  - Use console logging to track the flow of execution and identify errors.
  - Use TypeScript's type checking to catch errors early.
  - Use source maps to debug code that has been transpiled or minified.
  - Learn to read and understand stack traces.

## 7. Tooling and Environment

- **Recommended Development Tools:**
  - **IDE:** Visual Studio Code with the TypeScript extension.
  - **Package Manager:** npm or Yarn.
  - **Bundler:** Webpack, Parcel, or Rollup.
  - **Linter:** ESLint with TypeScript-specific rules.
  - **Formatter:** Prettier.
  - **Testing Framework:** Jest, Mocha, or Jasmine.

- **Build Configuration:**
  - Use a `tsconfig.json` file to configure the TypeScript compiler.
  - Configure compiler options like `target`, `module`, `jsx`, and `strict`.
  - Use TypeScript's project references to organize large projects.

- **Linting and Formatting:**
  - Use ESLint with TypeScript-specific rules to enforce coding standards.
  - Use Prettier to automatically format your code.
  - Integrate linting and formatting into your development workflow using Git hooks or CI/CD pipelines.

- **Deployment Best Practices:**
  - Use a build process to transpile and bundle your code.
  - Minify and compress your code to reduce bundle size.
  - Use a CDN to serve static assets.
  - Implement caching strategies to improve performance.

- **CI/CD Integration:**
  - Integrate your tests and linters into your CI/CD pipeline.
  - Automate the build and deployment process.
  - Use environment variables to configure your application for different environments.

# React Best Practices: A Comprehensive Guide

This document outlines the best practices for developing React applications, covering various aspects from code organization to security and testing. Following these guidelines leads to more maintainable, scalable, and performant applications.

## 1. Code Organization and Structure

### 1.1 Directory Structure

A well-defined directory structure is crucial for maintainability. Here's a recommended structure:

src/
├── components/
│ ├── Button/
│ │ ├── Button.tsx
│ │ ├── Button.module.css
│ │ └── Button.test.tsx
│ ├── Input/
│ │ ├── Input.tsx
│ │ ├── Input.module.css
│ │ └── Input.test.tsx
│ └── ...
├── contexts/
│ ├── AuthContext.tsx
│ └── ThemeContext.tsx
├── hooks/
│ ├── useAuth.ts
│ └── useTheme.ts
├── pages/
│ ├── Home.tsx
│ ├── About.tsx
│ └── ...
├── services/
│ ├── api.ts
│ └── auth.ts
├── utils/
│ ├── helpers.ts
│ └── validators.ts
├── App.tsx
├── index.tsx
└── ...

- **`components/`**: Reusable UI components.
  - Each component has its own directory containing the component file, associated styles (using CSS modules), and tests.
- **`contexts/`**: React context providers.
- **`hooks/`**: Custom React hooks.
- **`pages/`**: Top-level components representing different routes or views.
- **`services/`**: API interaction logic.
- **`utils/`**: Utility functions.

### 1.2 File Naming Conventions

- **Components**: Use PascalCase (e.g., `MyComponent.tsx`).
- **Hooks**: Use camelCase prefixed with `use` (e.g., `useMyHook.ts`).
- **Contexts**: Use PascalCase suffixed with `Context` (e.g., `MyContext.tsx`).
- **Services/Utils**: Use camelCase (e.g., `apiService.ts`, `stringUtils.ts`).
- **CSS Modules**: Use `.module.css` or `.module.scss` (e.g., `Button.module.css`).

### 1.3 Module Organization

- **Co-location**: Keep related files (component, styles, tests) together in the same directory.
- **Single Responsibility**: Each module should have a clear and specific purpose.
- **Avoid Circular Dependencies**: Ensure modules don't depend on each other in a circular manner.

### 1.4 Component Architecture

- **Atomic Design**: Consider using Atomic Design principles (Atoms, Molecules, Organisms, Templates, Pages) to structure components.
- **Composition over Inheritance**: Favor component composition to reuse code and functionality.
- **Presentational and Container Components**: Separate UI rendering (presentational) from state management and logic (container).

### 1.5 Code Splitting Strategies

- **Route-Based Splitting**: Use `React.lazy` and `Suspense` to load components only when a specific route is accessed. This is very common and improves initial load time.
- **Component-Based Splitting**: Split large components into smaller chunks that can be loaded on demand.
- **Bundle Analyzer**: Use a tool like `webpack-bundle-analyzer` to identify large dependencies and optimize bundle size.

## 2. Common Patterns and Anti-patterns

### 2.1 Design Patterns

- **Higher-Order Components (HOCs)**: Reusable logic that wraps components (use with caution; prefer hooks).
- **Render Props**: Sharing code using a prop whose value is a function.
- **Compound Components**: Components that work together implicitly (e.g., `Tabs`, `Tab`).
- **Hooks**: Reusable stateful logic that can be shared across functional components.

### 2.2 Recommended Approaches

- **Form Handling**: Use controlled components with local state or a form library like Formik or React Hook Form.
- **API Calls**: Use `useEffect` hook to make API calls and manage loading states.
- **Conditional Rendering**: Use short-circuit evaluation (`&&`) or ternary operators for simple conditions; use separate components for complex scenarios.
- **List Rendering**: Always provide a unique and stable `key` prop when rendering lists.

### 2.3 Anti-patterns and Code Smells

- **Direct DOM Manipulation**: Avoid directly manipulating the DOM; let React handle updates.
- **Mutating State Directly**: Always use `setState` or the state updater function to modify state.
- **Inline Styles**: Use CSS modules or styled-components for maintainable styles.
- **Over-Engineering**: Avoid using complex solutions for simple problems.
- **Prop Drilling**: Passing props through multiple levels of components without them being used.

### 2.4 State Management Best Practices

- **Local State**: Use `useState` for component-specific state.
- **Context API**: Use `useContext` for global state accessible to many components, but avoid for very frequently updated data.
- **Redux/Mobx**: Use these libraries for complex state management in large applications.
- **Recoil/Zustand**: Lightweight alternatives to Redux, often easier to set up and use.
- **Immutable Data**: Treat state as immutable to prevent unexpected side effects.

### 2.5 Error Handling Patterns

- **Error Boundaries**: Wrap components with error boundaries to catch errors during rendering and prevent crashes.
- **Try-Catch Blocks**: Use try-catch blocks for handling errors in asynchronous operations and event handlers.
- **Centralized Error Logging**: Implement a centralized error logging service to track errors and improve application stability.

## 3. Performance Considerations

### 3.1 Optimization Techniques

- **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders and recalculations.
- **Virtualization**: Use libraries like `react-window` or `react-virtualized` to efficiently render large lists or tables.
- **Debouncing/Throttling**: Limit the rate at which functions are executed (e.g., in input fields).
- **Code Splitting**: Load code on demand using `React.lazy` and `Suspense`.

### 3.2 Memory Management

- **Avoid Memory Leaks**: Clean up event listeners, timers, and subscriptions in `useEffect`'s cleanup function.
- **Release Unused Objects**: Avoid holding onto large objects in memory when they are no longer needed.
- **Garbage Collection**: Understand how JavaScript's garbage collection works and avoid creating unnecessary objects.

### 3.3 Rendering Optimization

- **Minimize State Updates**: Avoid unnecessary state updates that trigger re-renders.
- **Batch Updates**: Batch multiple state updates into a single update using `ReactDOM.unstable_batchedUpdates`.
- **Keys**: Ensure that keys are unique and consistent across renders.

### 3.4 Bundle Size Optimization

- **Tree Shaking**: Remove unused code during the build process.
- **Minification**: Reduce the size of JavaScript and CSS files.
- **Image Optimization**: Compress and optimize images to reduce file size.
- **Dependency Analysis**: Use tools like `webpack-bundle-analyzer` to identify large dependencies.

### 3.5 Lazy Loading Strategies

- **Route-Based Lazy Loading**: Load components when a user navigates to a specific route.
- **Component-Based Lazy Loading**: Load components when they are about to be rendered.
- **Intersection Observer**: Load components when they become visible in the viewport.

## 4. Security Best Practices

### 4.1 Common Vulnerabilities and Prevention

- **Cross-Site Scripting (XSS)**: Sanitize user input to prevent malicious code injection.
- **Cross-Site Request Forgery (CSRF)**: Use anti-CSRF tokens to protect against unauthorized requests.
- **Denial of Service (DoS)**: Implement rate limiting and request validation to prevent abuse.
- **Injection Attacks**: Avoid directly embedding user input into database queries or system commands.

### 4.2 Input Validation

- **Client-Side Validation**: Validate user input in the browser to provide immediate feedback.
- **Server-Side Validation**: Always validate user input on the server to prevent malicious data.
- **Sanitize Input**: Sanitize user input to remove potentially harmful characters or code.

### 4.3 Authentication and Authorization

- **Secure Authentication**: Use secure authentication mechanisms like OAuth 2.0 or JWT.
- **Role-Based Access Control (RBAC)**: Implement RBAC to control access to resources based on user roles.
- **Multi-Factor Authentication (MFA)**: Enable MFA to add an extra layer of security.

### 4.4 Data Protection Strategies

- **Encryption**: Encrypt sensitive data at rest and in transit.
- **Data Masking**: Mask sensitive data in logs and UI displays.
- **Regular Backups**: Create regular backups of application data.

### 4.5 Secure API Communication

- **HTTPS**: Use HTTPS to encrypt communication between the client and the server.
- **API Keys**: Protect API keys and secrets.
- **CORS**: Configure Cross-Origin Resource Sharing (CORS) to prevent unauthorized access to APIs.

## 5. Testing Approaches

### 5.1 Unit Testing

- **Test Components**: Test individual components in isolation.
- **Testing Library**: Use React Testing Library for UI testing, focusing on user behavior.
- **Jest**: Use Jest as the test runner.

### 5.2 Integration Testing

- **Test Component Interactions**: Test how components interact with each other.
- **Mock API Calls**: Mock API calls to test component behavior in different scenarios.
- **React Testing Library**: Effective for testing integration points in components.

### 5.3 End-to-End (E2E) Testing

- **Test Full Application Flows**: Test complete user flows, such as login, registration, and checkout.
- **Cypress/Playwright**: Use tools like Cypress or Playwright for E2E testing.
- **Automated Browser Tests**: Automate browser tests to ensure application stability.

### 5.4 Test Organization

- **Co-locate Tests**: Keep test files close to the components they test (e.g., `Button.test.tsx` in the `Button` directory).
- **Descriptive Names**: Use descriptive names for test files and test cases.
- **Test Suites**: Organize tests into logical suites.

### 5.5 Mocking and Stubbing

- **Mock Modules**: Mock external modules or API calls to isolate components during testing.
- **Stub Functions**: Stub function implementations to control component behavior.
- **Jest Mocks**: Utilize Jest's mocking capabilities for effective unit testing.

## 6. Common Pitfalls and Gotchas

### 6.1 Frequent Mistakes

- **Ignoring Keys in Lists**: Forgetting to provide unique and stable `key` props when rendering lists.
- **Incorrect State Updates**: Mutating state directly instead of using `setState` or the state updater function.
- **Missing Dependencies in `useEffect`**: Not including all dependencies in the dependency array of the `useEffect` hook.
- **Over-Using State**: Storing derived data in state instead of calculating it on demand.

### 6.2 Edge Cases

- **Asynchronous State Updates**: Handling state updates in asynchronous operations.
- **Race Conditions**: Preventing race conditions when making multiple API calls.
- **Handling Errors in Event Handlers**: Properly handling errors in event handlers to prevent crashes.

### 6.3 Version-Specific Issues

- **React 16 vs. React 17/18**: Understanding differences in lifecycle methods, error handling, and concurrent mode.
- **Deprecated Features**: Being aware of deprecated features and using recommended alternatives.

### 6.4 Compatibility Concerns

- **Browser Compatibility**: Ensuring compatibility with different browsers and devices.
- **Library Compatibility**: Ensuring compatibility between React and other libraries.

### 6.5 Debugging Strategies

- **React DevTools**: Use React DevTools to inspect component hierarchies, props, and state.
- **Console Logging**: Use console logging to debug code and track variables.
- **Breakpoints**: Set breakpoints in the code to step through execution and inspect variables.

## 7. Tooling and Environment

### 7.1 Recommended Development Tools

- **VS Code**: A popular code editor with excellent React support.
- **Create React App**: A tool for quickly setting up a new React project.
- **React DevTools**: A browser extension for inspecting React components.
- **ESLint**: A linter for enforcing code style and preventing errors.
- **Prettier**: A code formatter for automatically formatting code.

### 7.2 Build Configuration

- **Webpack/Vite**: Configure Webpack or Vite to bundle and optimize code.
- **Babel**: Configure Babel to transpile JavaScript code to older versions.
- **Environment Variables**: Use environment variables to configure different environments.

### 7.3 Linting and Formatting

- **ESLint**: Configure ESLint with recommended React rules.
- **Prettier**: Configure Prettier to automatically format code.
- **Husky/lint-staged**: Use Husky and lint-staged to run linters and formatters before committing code.

### 7.4 Deployment Best Practices

- **Static Hosting**: Host static assets on a CDN.
- **Server-Side Rendering (SSR)**: Use SSR to improve SEO and initial load time.
- **Continuous Deployment**: Automate the deployment process using CI/CD.

### 7.5 CI/CD Integration

- **GitHub Actions/GitLab CI**: Use GitHub Actions or GitLab CI to automate testing, linting, and deployment.
- **Automated Testing**: Run automated tests on every commit or pull request.
- **Automated Deployment**: Automatically deploy code to production after successful tests.

By following these best practices, React developers can build high-quality, maintainable, and scalable applications that meet the demands of modern web development. Continual education and adaptation to emerging trends in the React ecosystem are crucial for sustained success.

# Shadcn UI Best Practices

This document outlines best practices for developing with Shadcn UI, covering code organization, common patterns, performance considerations, security, testing, common pitfalls, and tooling.

## 1. Code Organization and Structure

- **Directory Structure:**
  - Organize components into logical directories based on functionality or domain. For example, place form-related components in a `components/forms` directory.
  - Separate components into their own files. Each component should have a dedicated file named after the component (e.g., `Button.tsx`).
  - Consider using an `index.ts` file within each directory to export all components from that directory, simplifying imports.
  - Structure directories to reflect the UI hierarchy. For example, `/components/layout` for layout related components and `/components/ui` for reusable UI elements.

- **File Naming Conventions:**
  - Use PascalCase for component file names (e.g., `MyComponent.tsx`).
  - Use camelCase for variable and function names (e.g., `handleClick`).
  - Use descriptive names that clearly indicate the purpose of the component or function.

- **Module Organization:**
  - Break down complex components into smaller, reusable modules.
  - Keep components focused on a single responsibility.
  - Utilize shared utility functions and constants to avoid code duplication. Create a `utils` directory for helper functions.
  - Use `components` directory to store UI components.

- **Component Architecture:**
  - Favor composition over inheritance. Create flexible components that can be customized through props.
  - Design components with clear separation of concerns: presentational components (UI) and container components (logic).
  - Use functional components with hooks for managing state and side effects.

- **Code Splitting Strategies:**
  - Implement lazy loading for non-critical components to improve initial load time.
  - Utilize React.lazy and Suspense for code splitting at the component level.
  - Configure your bundler (e.g., Webpack, Parcel) to automatically split code into smaller chunks.
  - Consider route-based code splitting for larger applications.

## 2. Common Patterns and Anti-patterns

- **Design Patterns Specific to Shadcn UI:**
  - Leverage the existing components provided by Shadcn UI whenever possible.
  - Customize components using styling solutions like Tailwind CSS's utility classes or CSS variables.
  - Create compound components by combining existing Shadcn UI components to build more complex UI elements.

- **Recommended Approaches for Common Tasks:**
  - Use Shadcn UI's form components (e.g., `Input`, `Select`) for handling user input.
  - Implement accessible components by following ARIA guidelines and using appropriate HTML semantics.
  - Use the `cn` utility (classnames library) provided by Shadcn UI to manage CSS class names effectively.

- **Anti-patterns and Code Smells to Avoid:**
  - Directly modifying the Shadcn UI component code.
  - Overusing custom CSS, as Shadcn UI is built with Tailwind CSS.
  - Neglecting accessibility considerations.
  - Creating overly complex components with too many responsibilities.

- **State Management Best Practices:**
  - Use React's built-in `useState` hook for simple component-level state.
  - Consider using a state management library like Zustand, Redux, or Recoil for more complex application state.
  - Avoid mutating state directly; always use the setState function or a state management library's update methods.

- **Error Handling Patterns:**
  - Implement error boundaries to catch errors in components and prevent the entire application from crashing.
  - Use try-catch blocks to handle errors in asynchronous operations and API calls.
  - Provide informative error messages to users.
  - Log errors to a monitoring service for debugging and analysis.

## 3. Performance Considerations

- **Optimization Techniques:**
  - Minimize re-renders by using `React.memo` for functional components and `shouldComponentUpdate` for class components.
  - Optimize event handlers by using useCallback to prevent unnecessary re-creation of functions.
  - Debounce or throttle expensive operations to reduce the frequency of execution.

- **Memory Management:**
  - Avoid memory leaks by properly cleaning up event listeners and timers in the `useEffect` hook.
  - Release unused resources, such as large data structures, when they are no longer needed.

- **Rendering Optimization:**
  - Use virtualized lists or grids for rendering large datasets.
  - Batch DOM updates to minimize reflows and repaints.
  - Use CSS containment to isolate rendering changes to specific parts of the DOM.

- **Bundle Size Optimization:**
  - Remove unused code and dependencies using tree shaking.
  - Minify JavaScript and CSS files to reduce their size.
  - Compress images using tools like ImageOptim or TinyPNG.

- **Lazy Loading Strategies:**
  - Implement lazy loading for images and other media assets.
  - Use the Intersection Observer API to detect when elements are visible in the viewport and load them on demand.

## 4. Security Best Practices

- **Common Vulnerabilities and How to Prevent Them:**
  - Prevent cross-site scripting (XSS) attacks by sanitizing user input and escaping HTML entities.
  - Protect against cross-site request forgery (CSRF) attacks by using anti-CSRF tokens.
  - Avoid storing sensitive information, such as API keys or passwords, in client-side code.

- **Input Validation:**
  - Validate user input on both the client-side and server-side.
  - Use a validation library like Zod or Yup to define data schemas and enforce validation rules.
  - Sanitize user input to remove potentially harmful characters or code.

- **Authentication and Authorization Patterns:**
  - Use a secure authentication protocol, such as OAuth 2.0 or OpenID Connect.
  - Implement role-based access control (RBAC) to restrict access to sensitive resources.
  - Store user credentials securely using hashing and salting.

- **Data Protection Strategies:**
  - Encrypt sensitive data at rest and in transit.
  - Use HTTPS to protect data transmitted between the client and server.
  - Implement data masking to hide sensitive information from unauthorized users.

- **Secure API Communication:**
  - Use HTTPS for all API requests.
  - Implement rate limiting to prevent abuse and denial-of-service attacks.
  - Validate API responses to ensure data integrity.

## 5. Testing Approaches

- **Unit Testing Strategies:**
  - Write unit tests for individual components and functions.
  - Use a testing framework like Jest or Mocha.
  - Test component behavior with different props and inputs.

- **Integration Testing:**
  - Write integration tests to verify that components work together correctly.
  - Test the interaction between components and APIs.

- **End-to-End Testing:**
  - Write end-to-end tests to simulate user interactions and verify that the application functions as expected.
  - Use a testing framework like Cypress or Playwright.

- **Test Organization:**
  - Organize tests into separate files based on the component or feature being tested.
  - Use descriptive test names that clearly indicate the purpose of the test.

- **Mocking and Stubbing:**
  - Use mocking and stubbing to isolate components and functions during testing.
  - Mock external dependencies, such as APIs or third-party libraries.

## 6. Common Pitfalls and Gotchas

- **Frequent Mistakes Developers Make:**
  - Forgetting to handle edge cases.
  - Overcomplicating components.
  - Neglecting accessibility.
  - Ignoring performance considerations.

- **Edge Cases to Be Aware Of:**
  - Handling different screen sizes and devices.
  - Dealing with slow network connections.
  - Handling invalid or unexpected user input.

- **Version-Specific Issues:**
  - Be aware of breaking changes between Shadcn UI versions.
  - Consult the Shadcn UI changelog for migration instructions.

- **Compatibility Concerns:**
  - Ensure that your application is compatible with the target browsers and devices.
  - Test your application on different browsers and devices.

- **Debugging Strategies:**
  - Use browser developer tools to inspect the DOM and debug JavaScript code.
  - Use console logging to track the flow of execution and identify errors.
  - Use a debugger to step through code and inspect variables.

## 7. Tooling and Environment

- **Recommended Development Tools:**
  - Visual Studio Code (VS Code) with extensions for React, TypeScript, and Tailwind CSS.
  - A browser with developer tools (e.g., Chrome DevTools, Firefox Developer Tools).
  - A terminal for running commands and scripts.

- **Build Configuration:**
  - Use a build tool like Webpack, Parcel, or Rollup to bundle your application.
  - Configure your build tool to optimize code for production.

- **Linting and Formatting:**
  - Use ESLint to enforce code style and identify potential errors.
  - Use Prettier to automatically format code.
  - Configure your editor to automatically lint and format code on save.

- **Deployment Best Practices:**
  - Deploy your application to a reliable hosting provider.
  - Use a content delivery network (CDN) to serve static assets.
  - Configure your server to serve compressed files.

- **CI/CD Integration:**
  - Use a continuous integration and continuous deployment (CI/CD) pipeline to automate the build, test, and deployment process.
  - Integrate your CI/CD pipeline with your version control system.

## Whenever you need a React component

1. Carefully consider the component's purpose, functionality, and design

2. Think slowly, step by step, and outline your reasoning

3. Check if a similar component already exists in any of the following locations
   1. src/components

4. If it doesn't exist, generate a detailed prompt for the component, including:
   - Component name and purpose
   - Desired props and their types
   - Any specific styling or behavior requirements
   - Mention of using Tailwind CSS for styling
   - Request for TypeScript usage

5. URL encode the prompt.

6. Create a clickable link in this format:
   [ComponentName](https://v0.dev/chat?q={encoded_prompt})

7. After generating, adapt the component to fit our project structure:
   - Import
     - common shadcn/ui components from <ui_package_alias>@repo/ui/components/ui/</ui_package_alias>
     - app specific components from <app_package_alias>@/components</app_package_alias>
   - Ensure it follows our existing component patterns
   - Add any necessary custom logic or state management

Example prompt template:
"Create a React component named {ComponentName} using TypeScript and Tailwind CSS. It should {description of functionality}. Props should include {list of props with types}. The component should {any specific styling or behavior notes}. Please provide the full component code."

Remember to replace placeholders like <ui_package_path> and <app_package_alias> with the actual values used in your project.
