# Project SouthPark

Project SouthPark is a hands-on initiative that brings together Messe München and students from the MMT program at LMU Munich. The project's mission is to develop a practical MVP for optimizing parking space allocation during high-traffic events. This collaboration serves as a real-world learning opportunity for MMT students, while providing Messe München with innovative solutions to manage event logistics more effectively.

## Table of Contents

- [Project SouthPark](#project-southpark)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Project Team](#project-team)
  - [Project Directory Structure](#project-directory-structure)
- [Development](#development)
  - [Setting up the Environment](#setting-up-the-environment)
    - [Cloning the Repository](#cloning-the-repository)
    - [Setting Up a Python Virtual Environment](#setting-up-a-python-virtual-environment)
      - [Using venv](#using-venv)
      - [Using conda](#using-conda)
    - [Setting up the Backend](#setting-up-the-backend)
      - [Start the Backend](#start-the-backend)
    - [Setting Up React Frontend](#setting-up-react-frontend)
    - [User Registration](#user-registration)
    - [Standard Account Creation](#standard-account-creation)
    - [Admin Account Creation](#admin-account-creation)
    - [Usage Instructions](#usage-instructions)
  - [Common Issue Troubleshooting](#common-issue-troubleshooting)

## Features

- **Map**: The map view in the parking space management system provides an interactive and dynamic visualization of parking space occupancy and event details. Users can view different areas such as parking spaces, entrances, and halls, with overlays and tooltips displaying real-time information about current events and their impact on parking availability. The map supports a gradient color scheme to represent various event allocations, as well as specific patterns for areas under construction. Users can easily switch between a heatmapThe map supports a gradient color scheme to represent various event allocations and uses specific patterns for areas under construction. Users can easily switch between a heatmap view, which color-codes parking spaces based on occupancy levels (occupied vs. free), and an event map view, which highlights the locations and details of current events. Additionally, the timeline slider allows navigation through different dates, showcasing historical and future occupancy data and event schedules, enhancing the overall user experience and functionality.

- **Dashboard**: The dashboard in the parking space management system provides a comprehensive overview of capacity utilization, offering a bar chart and critical capacity table to visualize and monitor parking space usage. The bar chart displays the percentage of total capacity being utilized over a selected time range, with data dynamically fetched and updated. Users can adjust the date range and year to view historical or future data, while the table highlights critical days when demand exceeds capacity or is close to the limit. This functionality ensures that users can make timely investments or source external parking spaces to minimize costs, allowing for efficient and cost-effective parking space management.

- **Event Management**: The events management feature of the parking space management system provides a comprehensive table view of all events, allowing users to filter by entrances, halls, allocated parking spaces, and event status. Users can search for events by name and paginate through the filtered results. Each event is displayed with its name, color, specific phases (assembly, runtime, disassembly), and selected halls and entrances. Status icons indicate the allocation status, making it easy to identify fully allocated or unallocated events. Additionally, users can add and edit events by specifying details such as the event name, color, date ranges for different phases, and selected halls and entrances. The system dynamically updates hall availability based on selected dates and prevents the selection of occupied halls. Users can view event demands, allocations, and their statuses to enable effective planning and adjustments. This feature ensures well-organized event logistics with flexibility for managing changes and optimal space utilization.

- **Allocation recommendation**: The parking lot recommendation engine for Messe München provides optimal parking lot assignments for events based on demands for cars, buses, and trucks. It considers factors like parking lot proximity to event halls, lot capacities, and specific event requirements, ensuring effective space utilization and planning. Key features include loading and processing distance data between entrances and parking lots, fetching detailed parking lot information, calculating average distances to event halls, and determining free capacities and limits for different vehicle types. The system assigns parking lots based on these capacities and distances, prioritizing certain lots for specific halls when needed. This approach supports and guides human decision-making, ensuring efficient parking lot allocation that meets the diverse demands of various events while facilitating effective planning and adjustments. However, it is designed to complement, not replace, the expertise and judgment of event managers, who remain integral to the final decision-making process.

- **Parking Space Management**: The Parking Space Management feature streamlines the administration and utilization of parking areas through a user-friendly interface that provides real-time data and sorting functionalities. It allows users to fetch, view, and sort parking space data based on various attributes such as name, surface material, shelter availability, toilet facilities, pricing, and type (internal or external). Users can also add new parking spaces and access detailed information about each space, ensuring efficient allocation and management of parking resources. This feature enhances operational efficiency by enabling quick identification and organization of available spaces, facilitating optimal parking space usage and better decision-making.

## Project Team

MMT:

- Timon Tirtey

- Jakob Schwarz

- Nichole Chen

- Sven Tiefenthaler

Messe München:

- Peter Tubak (Product Owner)

Through this tripartite win-win collaboration, Project SouthPark aims to deliver tangible benefits to all involved, paving the way for ongoing cooperation and continuous learning.

## Project Directory Structure

```plaintext
southpark
├── app.py
├── config.py
├── extensions.py
├── models.py
├── requirements.txt
├── routes
│   ├── __init__.py
│   ├── allocation.py
│   ├── auth.py
│   ├── dashboard.py
│   ├── data.py
│   ├── events.py
│   ├── map.py
│   ├── parking.py
│   └── recommendation.py
└── utils
    ├── __init__.py
    └── helpers.py

3 directories, 16 files
timon@MBP-TT backend % cd ..
timon@MBP-TT southpark % tree .
.
├── README.md
├── backend
│   ├── app.py
│   ├── config.py
│   ├── extensions.py
│   ├── models.py
│   ├── requirements.txt
│   ├── routes
│   │   ├── __init__.py
│   │   ├── allocation.py
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── data.py
│   │   ├── events.py
│   │   ├── map.py
│   │   ├── parking.py
│   │   └── recommendation.py
│   └── utils
│       ├── __init__.py
│       └── helpers.py
├── database
│   ├── backups
│   │   └── southpark_db_120724.sql
│   ├── diagrams
│   │   └── database_schema.png
│   ├── migrations
│   │   ├── create_tables.sql
│   │   └── create_views.sql
│   └── seed
│       ├── entities_seed_data.sql
│       ├── events_data.csv
│       ├── events_data_seed.sql
│       ├── events_data_to_sql.py
│       ├── filtered_event.py
│       ├── filtered_events.csv
│       ├── filtered_events_data_seed.sql
│       ├── filtered_out_event_ids.csv
│       └── original_events.csv
└── frontend
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── robots.txt
    ├── src
    │   ├── App.jsx
    │   ├── assets
    │   │   ├── 404.gif
    │   │   ├── favicon.ico
    │   │   ├── icons
    │   │   │   ├── facebook.svg
    │   │   │   ├── instagram.svg
    │   │   │   ├── linkedin.svg
    │   │   │   ├── x.svg
    │   │   │   ├── xing.svg
    │   │   │   └── youtube.svg
    │   │   ├── logo.svg
    │   │   ├── logo_white.svg
    │   │   └── team
    │   │       ├── eric.jpeg
    │   │       ├── kenny.jpeg
    │   │       ├── tolkien.jpeg
    │   │       └── tuong.jpeg
    │   ├── components
    │   │   ├── auth
    │   │   │   ├── Account.jsx
    │   │   │   ├── Login.jsx
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   ├── Register.jsx
    │   │   │   └── styles
    │   │   │       └── auth.css
    │   │   ├── common
    │   │   │   ├── BreadCrumbs.jsx
    │   │   │   ├── Footer.jsx
    │   │   │   ├── Header.jsx
    │   │   │   ├── InfoHover.jsx
    │   │   │   ├── InfoText.jsx
    │   │   │   ├── LoadingAnimation.jsx
    │   │   │   ├── LoggerHOC.jsx
    │   │   │   ├── MobileWarning.jsx
    │   │   │   ├── Navigation.jsx
    │   │   │   ├── NotFound.jsx
    │   │   │   ├── PermissionPopup.jsx
    │   │   │   ├── SearchAppBar.jsx
    │   │   │   ├── UserMenu.jsx
    │   │   │   └── styles
    │   │   │       └── common.css
    │   │   ├── controls
    │   │   │   ├── DateRangePicker.jsx
    │   │   │   └── styles
    │   │   │       └── controls.css
    │   │   ├── dashboard
    │   │   │   ├── CapacityUtilizationBarChart.jsx
    │   │   │   ├── CriticalCapacityTable.jsx
    │   │   │   ├── Dashboard.jsx
    │   │   │   └── styles
    │   │   │       └── dashboard.css
    │   │   ├── events
    │   │   │   ├── Events.jsx
    │   │   │   ├── FilterDropdown.jsx
    │   │   │   ├── HallEntranceIcons.jsx
    │   │   │   ├── addEditEvent
    │   │   │   │   ├── AddEvent.jsx
    │   │   │   │   ├── Allocations.jsx
    │   │   │   │   ├── EditEvent.jsx
    │   │   │   │   ├── Event.jsx
    │   │   │   │   ├── EventDemandTable.jsx
    │   │   │   │   └── EventMapSection.jsx
    │   │   │   ├── allocation
    │   │   │   │   ├── AddAllocationPopup.jsx
    │   │   │   │   ├── AllocateParkingSpaces.jsx
    │   │   │   │   ├── Allocation.jsx
    │   │   │   │   ├── Demand.jsx
    │   │   │   │   └── Recommendation.jsx
    │   │   │   └── styles
    │   │   │       └── events.css
    │   │   ├── hooks
    │   │   │   ├── logger.js
    │   │   │   ├── refreshToken.js
    │   │   │   └── useAuth.js
    │   │   ├── map
    │   │   │   ├── EntrancePopup.jsx
    │   │   │   ├── EventsMap.jsx
    │   │   │   ├── EventsMapParkingLotPopup.jsx
    │   │   │   ├── HallPopup.jsx
    │   │   │   ├── HeatMap.jsx
    │   │   │   ├── HeatMapParkingLotPopup.jsx
    │   │   │   ├── MapLegend.jsx
    │   │   │   ├── MapPage.jsx
    │   │   │   ├── NoEventsOverlay.jsx
    │   │   │   ├── OccupanciesBarChart.jsx
    │   │   │   ├── TimelineSlider.jsx
    │   │   │   └── styles
    │   │   │       └── map.css
    │   │   ├── parking_spaces
    │   │   │   ├── AddCapacity.jsx
    │   │   │   ├── AddParkingSpace.jsx
    │   │   │   ├── EditCapacity.jsx
    │   │   │   ├── EditParkingSpace.jsx
    │   │   │   ├── ParkingSpace.jsx
    │   │   │   ├── ParkingSpaceCapacityTable.jsx
    │   │   │   ├── ParkingSpaceOccupationTable.jsx
    │   │   │   ├── ParkingSpaces.jsx
    │   │   │   └── styles
    │   │   │       └── parkingSpaces.css
    │   │   └── team
    │   │       ├── Team.jsx
    │   │       └── styles
    │   │           └── TeamComponent.css
    │   ├── index.jsx
    │   └── styles
    │       ├── index.css
    │       └── muiCustomTheme.jsx
    └── vite.config.js
```

# Development

This section provides guidelines for setting up the project effectively.

## Setting up the Environment

To begin working with this project, you need to set up your local environment first.

### Cloning the Repository

Start by cloning the repository to your local machine. Open a terminal and run the following command:

```bash

git  clone  https://github.com/schwarzjakob/southpark/

cd  southpark

```

### Setting Up a Python Virtual Environment

#### Using venv

After cloning the repository, set up a Python virtual environment by running:

```bash

python3  -m  venv  venv

source  venv/bin/activate  # On Windows use `venv\Scripts\activate`

pip  install  -r  backend/requirements.txt

```

Make sure the virtual environment is running while you are working on the project.

#### Using conda

For users who prefer using conda, you can set up a virtual environment by running:

```bash

conda  create  --name  env-name  python=3.x

# Replace 'env-name' with your environment name and '3.x' with the desired Python version

conda  activate  env-name

pip  install  -r  backend/requirements.txt

```

Ensure the conda environment is active while working on the project.

### Setting up the Backend

To connect to the database, the repo already contains a `backend/.env` file to store the `DATABASE_URL` which links to our [Neon Database](https://console.neon.tech/).

The `.env` it will look like the following code snippet:

```bash

DATABASE_URL=postgresql://neondb_owner:EYShfa1td0IW@ep-shy-frost-a2a25knj.eu-central-1.aws.neon.tech/parking_sapce_management_system?sslmode=require

```

#### Start the Backend

```bash

python3  backend/app.py

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

### User Registration

### Standard Account Creation

- Visit the `http://localhost:5173/` page in your browser.

- Use a random user name, email, password and the access token `mmt` to create a **standard account without edit-rights**.

  - Standard accounts can access the basic features of the software but are restricted from making changes to critical components like events or parking lots.

### Admin Account Creation

- Visit the `http://localhost:5173/` page in your browser.

- Use a random user name, email, password and the access token `southpark_admin!` to create a **admin account with edit-rights**.

- Admin accounts have full permissions, including the ability to create and edit events, manage parking lots, and make other administrative changes.

### Usage Instructions

- **Standard Users**: Can view and interact with available features but cannot modify core system components.

- **Admin Users**: Have the ability to manage and configure various aspects of the system, ensuring smooth operation and maintenance.

## Common Issue Troubleshooting

**Database Connection Error**: Ensure .env file and the DATABASE_URI is correctly set.

**Module Not Found**: Verify all dependencies are installed and the virtual environment is activated.

**Permission Denied**: Ensure proper permissions for database access and file operations.

**500 Internal Server Error**: This could be due to various reasons including server-side errors, incorrect dataset format, or misconfiguration. Check server logs for specific error messages and ensure data import was executed as described.

**Server Not Starting**: If the server fails to start, verify that all required dependencies are installed, and the virtual environment is activated. Also, ensure there are no syntax errors in the server code and that the correct Python version is being used.

**Dataset Upload Errors**: If dataset uploads are failing, ensure the files are correctly formatted and that the server has permission to read these files. Check for any size limits set on file uploads and verify that the correct endpoints are being used for the uploads.

**CORS Issues**: If the client cannot communicate with the server, ensure that Cross-Origin Resource Sharing (CORS) is correctly configured on the server. You can use the Flask-CORS library to handle this.

**API Endpoint Issues**: Verify server is running that the API endpoints are correctly defined and accessible. Use tools like Postman to manually test endpoints and check for correct responses.

**Client-Side Errors**: If the client-side application is not functioning correctly, check the browser console for errors. Ensure all npm dependencies are correctly installed and that the application is being served on the correct port.

**Database Import Errors**: If there are issues importing data into the database, ensure that the SQL scripts were correct executed. Check for any constraints or permissions issues that might be preventing the data import.

**Environment Variable Issues**: Ensure that all necessary environment variables are set correctly. Ensure .env contains correct local database settings and is located in the correct directory and is being loaded properly.
