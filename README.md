# Project SouthPark

Project SouthPark is a hands-on initiative that brings together Messe München and students from the MMT program at LMU Munich. The project's mission is to develop a practical MVP for optimizing parking space allocation during high-traffic events. This collaboration serves as a real-world learning opportunity for MMT students, while providing Messe München with innovative solutions to manage event logistics more effectively.

## Table of Contents

- [Project SouthPark](#project-southpark)
  - [Table of Contents](#table-of-contents)
  - [MVP Focus](#mvp-focus)
  - [Project Team](#project-team)
- [Development](#development)
  - [Setting up the Environment](#setting-up-the-environment)
    - [Cloning the Repository](#cloning-the-repository)
    - [Setting Up a Python Virtual Environment](#setting-up-a-python-virtual-environment)
    - [Setting up the Backend](#setting-up-the-backend)
      - [Start the Backend](#start-the-backend)
    - [Setting Up React Frontend](#setting-up-react-frontend)
      - [Source React + Vite](#source-react--vite)
    - [Project Directory Structure](#project-directory-structure)
  - [Working with Git and GitHub](#working-with-git-and-github)
    - [Branching Strategy](#branching-strategy)
    - [Common Git Commands](#common-git-commands)
    - [Committing Changes](#committing-changes)

## MVP Focus

- **Linear Programming Optimization**: Implementing straightforward and robust linear programming techniques for real-time parking allocation.
- **User Experience**: Concentrating on a user interface that balances simplicity and functionality, ensuring ease of use for event organizers and staff. We say goodbye to Excel Sheets!
- **Practicality and Growth**: Designed with practical implementation in mind, the system also considers future expansion, including potential features such as incremental demand projection.
- **Collaborative Learning**: This MVP is a product of academia-industry partnership, reflecting a commitment to solving real-world problems within an educational framework and fostering lasting relationships between LMU and corporate partners like Messe München.

## Project Team

MMT:

- Nichole Chen
- Timon Tirtey
- Sven Tiefenthaler
- Jakob Schwarz

MM:

- Peter Tubak

Through this tripartite win-win collaboration, Project SouthPark aims to deliver tangible benefits to all involved, paving the way for ongoing cooperation and continuous learning.

# Development

This section provides guidelines for setting up and working with the project effectively.

## Setting up the Environment

To begin working with this project, you need to set up your local environment first.

### Cloning the Repository

Start by cloning the repository to your local machine. Open a terminal and run the following command:

```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```

### Setting Up a Python Virtual Environment

After cloning the repository, set up a Python virtual environment by running:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r backend/requirements.txt
```

Make sure the virtual environment is running while you are working on the project.

**Disclaimer:** The choice of technology and environment setup may change as the project evolves and the full tech stack is finalized. Future updates may shift the development requirements, which will be reflected in this documentation accordingly.

### Setting up the Backend

To connect to the database, create a `backend/.env` file to store the `DATABASE_URL` which is available in our [Neon Database](https://console.neon.tech/app/projects/frosty-queen-29994181). Inside the `.env` it will look similar to:

```bash
DATABASE_URL=postgresql://neondb_owner:password@hostname:port/database_name
```

#### Start the Backend

```bash
python3 backend/app.py
```

### Setting Up React Frontend

To begin setting up the React frontend, ensure you have navigated to the frontend directory and execute the following command to install all necessary dependencies:

```zsh/bash
cd frontend
npm install
```

Once the installation process is complete, initiate React by running the following command:

```zsh/bash
npm run dev
```

#### Source React + Vite

The React template installed via Vite provides a minimal setup for integrating React within Vite, featuring HMR (Hot Module Replacement) and specific ESLint rules.

Presently, two official plugins are at your disposal:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md): Employs Babel for Fast Refresh.
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc): Utilizes SWC for Fast Refresh.

### Project Directory Structure

Here is the recommended directory structure for this project, accommodating multiple aspects like frontend, backend, data processing, and script execution:

```plaintext
ProjectRoot/
│
├── frontend/              # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
│
├── backend/               # Flask backend
│   ├── app.py
│   ├── requirements.txt
│   ├── models/
│   └── services/
│
├── notebooks/             # Jupyter notebooks for data exploration and initial algorithm development
│   └── exploration.ipynb
│
├── data/                  # Data directory for storing CSV files and other data forms
│   ├── raw/               # Unprocessed data
│   └── processed/         # Data transformed from Jupyter notebooks
│
├── scripts/               # Standalone scripts for more structured or production-ready processes
│   └── allocation_algorithm.py
│
├── .gitignore             # Specifies intentionally untracked files to ignore
└── README.md              # Project overview and setup instructions
```

## Working with Git and GitHub

### Branching Strategy

Effective use of Git branches can help manage the development process smoothly. Here’s how we structure our branches:

1. **Main Branch**

   - **Purpose**: Serves as the primary branch where the production-ready state of the software is maintained.
   - **Naming**: `main`

2. **Development Branch**

   - **Purpose**: Used for integrating various features and conducting all development work before being merged into `main`.
   - **Naming**: `develop`

3. **Feature Branches**

   - **Purpose**: Each new feature should be developed in its own branch to ensure that the `develop` branch always remains stable.
   - **Naming**: `feature/<feature-name>`
   - **Example**: `feature/backend-algorithm`

4. **Bugfix Branches**

   - **Purpose**: Quick fixes for bugs found in production are addressed here before merging into the main and development branches.
   - **Naming**: `bugfix/<bug-description>`
   - **Example**: `bugfix/routing-error-fix`

5. **Documentation Branches**

   - **Purpose**: Updates to documentation or comments.
   - **Naming**: `docs/<change-description>`
   - **Example**: `docs/update-readme`

6. **Refactoring Branches**

   - **Purpose**: Making code improvements without adding new features or fixing bugs.
   - **Naming**: `refactor/<description>`
   - **Example**: `refactor/optimize-event-search`

7. **Test Branches**

   - **Purpose**: Testing new ideas or changes in a controlled environment.
   - **Naming**: `test/<test-name>`
   - **Example**: `test/database-performance`

### Common Git Commands

Here's a sequence of common Git commands you might use during development:

- **Creating and Switching to a New Branch**:

  ```bash
  git checkout -b <branch-name>
  ```

- **Pulling Latest Changes from Remote**:

  ```bash
  git pull origin <branch-name>
  ```

- **Staging Changes**:

  ```bash
  git add .
  ```

### Committing Changes

When committing changes, use a concise and imperative tone, starting the message with a capitalized verb that describes the action performed in the commit. This makes the commit history easier to read at a glance.

Here are a few examples:

- **"Fix the error handling in the login function"** — Indicates a bug fix.
- **"Setup the initial project structure and create a README"** — Indicates initial setup tasks.

To commit your changes, use the following command:

```bash
git commit -m "Describe your changes here"
```

For example:

```bash
git commit -m "Setup the repository and create a first README"
```

This command records your changes to the local repository with a message that describes what you have done.

**Commit Message Guidelines:**

- Start with a capital letter.
- Use the imperative mood for the verb. For example, use "Fix", "Add", "Change" rather than "Fixed", "Added", "Changed".
- Be concise but descriptive enough for others to understand the purpose of the commit at a glance.
- Try to keep the first line of your commit message under 50 characters if possible. If further explanation is necessary, add a blank line and continue with more details in subsequent lines.

For more details on writing good commit messages, read [this guide on how to write a Git commit message](https://cbea.ms/git-commit/).

- **Pushing Changes to Remote**:

  ```bash
  git push origin <branch-name>
  ```

- **Merging Develop into Your Feature Branch** (to update it with the latest changes):

  ```bash
  git checkout <your-feature-branch>
  git merge develop
  ```
