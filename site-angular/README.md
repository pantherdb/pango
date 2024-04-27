### 4. PAN-GO Site
This section of the project involves an Angular-based front-end which provides a user-friendly interface to interact with the data through web requests to the API.

**Development Setup:**
- **Prerequisites**: Ensure that Node.js and Angular CLI are installed on your system. You can download Node.js from [Node.js official website](https://nodejs.org/) and install Angular CLI globally using npm:
    ```bash
    npm install -g @angular/cli
    ```

- **Project Setup**: Clone the repository and install the required npm packages:
    ```bash
    git clone https://github.com/pantherdb/pango
    cd pango/site-angular
    npm install
    ```

- **Running the Application**: Use the npm start script to serve the application on the specified port, as defined in `package.json`:
    ```bash
    npm start
    ```
    This will serve the application on port 4207. Access the application by navigating to `http://localhost:4207` in your web browser.

**Development Notes:**
- **Environment Configuration**: Make sure to review and adjust the environment configuration files located in the `src/environments/` folder as needed for development and production environments.
- **Building for Production**: To build the application for production, use the build command with the production flag:
    ```bash
    npm run build-prod
    ```

