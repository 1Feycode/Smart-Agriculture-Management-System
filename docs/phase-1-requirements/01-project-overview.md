# 01. Project Overview

## Project name
Smart Agriculture Management System (SAMS)

## Project purpose and problem statement
The Smart Agriculture Management System (SAMS) is a web-based agricultural information platform designed to improve access to reliable, timely, and organized agricultural information for farmers and related stakeholders. In many rural and semi-rural communities, farmers often lack dependable guidance on crop selection, soil conditions, fertilizer use, weather conditions, and market-price information. Information is frequently spread across agricultural offices, experts, markets, and informal sources, making decisions harder and increasing uncertainty in production planning.

The system addresses this problem by bringing the most relevant agricultural information and workflows into one centralized web platform.

## Proposed solution
SAMS will provide a centralized web application for:
- Farmer and farm registration and profile management
- Crop information and production guidance
- Soil information and soil-test record management
- Fertilizer recommendation and review workflows
- Weather information and alerts
- Agricultural market-price information and comparison
- Expert question-and-answer services
- Notifications and reporting

## General and specific objectives
### General objective
To design and develop a web-based system that improves farmers' access to agricultural information and supports informed agricultural planning and management.

### Specific objectives
- Provide farmer registration and profile management.
- Provide organized information about agricultural crops and production practices.
- Support fertilizer guidance based on available soil, crop, and location information.
- Provide location-based weather information and forecasts.
- Provide agricultural product market-price information.
- Facilitate communication between farmers and agricultural experts.
- Provide administrators with tools to manage users and agricultural information.
- Improve access to reliable, traceable, and timely agricultural information.

## Target users and stakeholders
- Farmers and farm managers
- Agricultural experts and extension professionals
- Agricultural data managers
- System administrators
- Project supervisors and analysts
- Agricultural offices and public agricultural institutions
- Local market actors
- Weather information providers
- Farmers' associations
- Testers and quality reviewers

## System scope
### In scope for version 1
- User registration, login, logout, and role-based access
- Farmer profile and farm registration management
- Crop and soil information management
- Fertilizer recommendation requests and expert review
- Weather information lookup and alerts
- Market-price lookup, recording, and comparison
- Expert question submission and answer workflows
- User notifications and dashboard reporting
- Administrative user and content management

### Out-of-scope features for version 1
- Full-scale AI-based recommendation engine
- Native mobile application development
- Offline-first synchronization for field use
- Local-language support beyond a future enhancement plan
- Advanced remote-sensing or satellite analytics
- Large-scale integration with all agricultural value-chain systems

## Technology stack
- Frontend: React
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- File storage: Firebase Storage
- Hosting: Firebase Hosting
- Supporting tools: browser-based web application, secure data access rules, role-based UI flows, and Firebase security configuration

## Firebase free-tier constraints and design implications
Firebase free-tier services impose practical limits on storage, reads, writes, and bandwidth. These constraints affect implementation design.

- Firestore read/write quotas must be considered when designing frequently queried market and weather views.
- Most data should be normalized and query-specific to reduce expensive repeated reads.
- Authentication should use Firebase Authentication rather than a custom auth service.
- Storage should be used only for necessary images and documents, with upload size limits and compression.
- Hosting should serve the frontend static assets, with minimal server-side logic.
- Weather and market data should be cached where possible to reduce repeated calls to external APIs.
- Role-based security rules must be strict to protect private farm and user information.

## Key assumptions, constraints, risks, and limitations
### Assumptions
- The system will run as a web application accessed through modern browsers.
- Farmers will primarily use smartphones and low-bandwidth connections.
- Weather and market data will be sourced from supported external providers or data managers.
- Agricultural experts and data managers will review and validate key information.

### Constraints
- The project is limited to a React + Firebase-based architecture.
- The system must operate within practical free-tier limitations.
- User access must be controlled through roles and Firestore security rules.
- Some agricultural knowledge and recommendation logic will require expert review and validation.

### Risks and limitations
- External weather or market data providers may be unavailable or inconsistent.
- Data quality issues may arise if prices or soil-test values are entered without validation.
- Farmers may have limited digital literacy or poor network connectivity.
- Data ownership and access policies for private farm data may need stakeholder clarification.
- Some highly detailed agricultural recommendations may require stronger domain rules than a basic web version can provide.

### Items to be confirmed with stakeholders
- Exact weather data source and alert policy
- Final farm and crop data fields to be collected in production
- Approval process for expert-reviewed fertilizer recommendations
- Rules for market-price verification and source attribution
- Whether local-language support is required in version 1 or later
- Final role ownership and permission policy
