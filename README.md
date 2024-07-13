# Project SouthPark

Project SouthPark is a hands-on initiative that brings together Messe München and students from the MMT program at LMU Munich. The project's mission is to develop a practical MVP for optimizing parking space allocation during high-traffic events. This collaboration serves as a real-world learning opportunity for MMT students, while providing Messe München with innovative solutions to manage event logistics more effectively.

## Table of Contents

- [Project SouthPark](#project-southpark)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
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
  - [Project Management](#project-management)
    - [Branching Strategy](#branching-strategy)

## Features

- **Map Interface**: The map view in the parking space management system provides an interactive and dynamic visualization of parking space occupancy and event details. Users can view different areas such as parking spaces, entrances, and halls, with overlays and tooltips displaying real-time information about current events and their impact on parking availability. The map supports a gradient color scheme to represent various event allocations, as well as specific patterns for areas under construction. Users can easily switch between a heatmapThe map supports a gradient color scheme to represent various event allocations and uses specific patterns for areas under construction. Users can easily switch between a heatmap view, which color-codes parking spaces based on occupancy levels (occupied vs. free), and an event map view, which highlights the locations and details of current events. Additionally, the timeline slider allows navigation through different dates, showcasing historical and future occupancy data and event schedules, enhancing the overall user experience and functionality.
  
- **Dashboard**: The dashboard in the parking space management system provides a comprehensive overview of capacity utilization, offering a bar chart and critical capacity table to visualize and monitor parking space usage. The bar chart displays the percentage of total capacity being utilized over a selected time range, with data dynamically fetched and updated. Users can adjust the date range and year to view historical or future data, while the table highlights critical days when demand exceeds capacity or is close to the limit. This functionality ensures that users can make timely investments or source external parking spaces to minimize costs, allowing for efficient and cost-effective parking space management.
  
- **Events Management**: The events management feature of the parking space management system provides a comprehensive table view of all events, allowing users to filter by entrances, halls, allocated parking spaces, and event status. Users can search for events by name and paginate through the filtered results. Each event is displayed with its name, color, specific phases (assembly, runtime, disassembly), and selected halls and entrances. Status icons indicate the allocation status, making it easy to identify fully allocated or unallocated events. Additionally, users can add and edit events by specifying details such as the event name, color, date ranges for different phases, and selected halls and entrances. The system dynamically updates hall availability based on selected dates and prevents the selection of occupied halls. Users can view event demands, allocations, and their statuses to enable effective planning and adjustments. This feature ensures well-organized event logistics with flexibility for managing changes and optimal space utilization.

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

# Development

This section provides guidelines for setting up the project effectively.

## Setting up the Environment

To begin working with this project, you need to set up your local environment first.

### Cloning the Repository

Start by cloning the repository to your local machine. Open a terminal and run the following command:

```bash
git clone https://github.com/schwarzjakob/southpark/
cd southpark
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
.
├── .gitignore
├── .vscode
│   ├── extensions.json
│   └── settings.json
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
    └── src
        ├── App.jsx
        ├── assets
        │   ├── 404.gif
        │   ├── favicon.ico
        │   ├── icons
        │   │   ├── facebook.svg
        │   │   ├── instagram.svg
        │   │   ├── linkedin.svg
        │   │   ├── x.svg
        │   │   ├── xing.svg
        │   │   └── youtube.svg
        │   ├── logo.svg
        │   ├── logo_white.svg
        │   └── team
        │       ├── eric.jpeg
        │       ├── kenny.jpeg
        │       ├── tolkien.jpeg
        │       └── tuong.jpeg
        ├── components
        │   ├── auth
        │   │   ├── Account.jsx
        │   │   ├── Login.jsx
        │   │   ├── ProtectedRoute.jsx
        │   │   ├── Register.jsx
        │   │   └── styles
        │   │       └── auth.css
        │   ├── common
        │   │   ├── BreadCrumbs.jsx
        │   │   ├── Footer.jsx
        │   │   ├── Header.jsx
        │   │   ├── InfoHover.jsx
        │   │   ├── InfoText.jsx
        │   │   ├── LoadingAnimation.jsx
        │   │   ├── LoggerHOC.jsx
        │   │   ├── MobileWarning.jsx
        │   │   ├── Navigation.jsx
        │   │   ├── NotFound.jsx
        │   │   ├── PermissionPopup.jsx
        │   │   ├── SearchAppBar.jsx
        │   │   ├── UserMenu.jsx
        │   │   └── styles
        │   │       └── common.css
        │   ├── controls
        │   │   ├── DateRangePicker.jsx
        │   │   └── styles
        │   │       └── controls.css
        │   ├── dashboard
        │   │   ├── CapacityUtilizationBarChart.jsx
        │   │   ├── CriticalCapacityTable.jsx
        │   │   ├── Dashboard.jsx
        │   │   └── styles
        │   │       └── dashboard.css
        │   ├── events
        │   │   ├── Events.jsx
        │   │   ├── FilterDropdown.jsx
        │   │   ├── HallEntranceIcons.jsx
        │   │   ├── addEditEvent
        │   │   │   ├── AddEvent.jsx
        │   │   │   ├── Allocations.jsx
        │   │   │   ├── EditEvent.jsx
        │   │   │   ├── Event.jsx
        │   │   │   ├── EventDemandTable.jsx
        │   │   │   └── EventMapSection.jsx
        │   │   ├── allocation
        │   │   │   ├── AddAllocationPopup.jsx
        │   │   │   ├── AllocateParkingSpaces.jsx
        │   │   │   ├── Allocation.jsx
        │   │   │   ├── Demand.jsx
        │   │   │   └── Recommendation.jsx
        │   │   └── styles
        │   │       └── events.css
        │   ├── hooks
        │   │   ├── logger.js
        │   │   ├── refreshToken.js
        │   │   └── useAuth.js
        │   ├── map
        │   │   ├── EntrancePopup.jsx
        │   │   ├── EventsMap.jsx
        │   │   ├── EventsMapParkingLotPopup.jsx
        │   │   ├── HallPopup.jsx
        │   │   ├── HeatMap.jsx
        │   │   ├── HeatMapParkingLotPopup.jsx
        │   │   ├── MapLegend.jsx
        │   │   ├── MapPage.jsx
        │   │   ├── NoEventsOverlay.jsx
        │   │   ├── OccupanciesBarChart.jsx
        │   │   ├── TimelineSlider.jsx
        │   │   └── styles
        │   │       └── map.css
        │   ├── parking_spaces
        │   │   ├── AddCapacity.jsx
        │   │   ├── AddParkingSpace.jsx
        │   │   ├── EditCapacity.jsx
        │   │   ├── EditParkingSpace.jsx
        │   │   ├── ParkingSpace.jsx
        │   │   ├── ParkingSpaceCapacityTable.jsx
        │   │   ├── ParkingSpaceOccupationTable.jsx
        │   │   ├── ParkingSpaces.jsx
        │   │   └── styles
        │   │       └── parkingSpaces.css
        │   └── team
        │       ├── Team.jsx
        │       └── styles
        │           └── TeamComponent.css
        ├── index.jsx
        └── styles
            ├── index.css
            └── muiCustomTheme.jsx
```

## Project Management

### Branching Strategy

Effective use of Git branches can help manage the development process smoothly. Here’s how we structure our branches:

1. **Development Branch**

   - **Purpose**: Used for integrating various features and conducting all development work.
   - **Naming**: `develop`

2. **Feature Branches**

   - **Purpose**: Each new feature should be developed in its own branch to ensure that the `develop` branch always remains stable.
   - **Naming**: `feature/<feature-name>`
   - **Example**: `feature/backend-algorithm`

3. **Bugfix Branches**

   - **Purpose**: Quick fixes for bugs found in production are addressed here before merging into the main and development branches.
   - **Naming**: `bugfix/<bug-description>`
   - **Example**: `bugfix/routing-error-fix`

4. **Documentation Branches**

   - **Purpose**: Updates to documentation or comments.
   - **Naming**: `docs/<change-description>`
   - **Example**: `docs/update-readme`

5. **Refactoring Branches**

   - **Purpose**: Making code improvements without adding new features or fixing bugs.
   - **Naming**: `refactor/<description>`
   - **Example**: `refactor/optimize-event-search`