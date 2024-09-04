# Ingestion Server

## Overview

The Ingestion Server is designed to gather, process, and store the Rocket.Chat codebase in a graph database like Neo4j. This process can be triggered automatically through a webhook from the Rocket.Chat repository or a CI/CD pipeline. Additionally, the process can be initiated manually as needed.

## Workflow

1. **Clone the Repository**: 
   - Fetch the latest version of the Rocket.Chat codebase from the official repository. This ensures that the most recent code changes are included in the processing.

2. **Analyze Codebase**:
   - Perform Abstract Syntax Tree (AST) analysis on the cloned codebase. AST analysis helps in understanding the structure of the code and extracting relevant information such as functions, classes, and dependencies.

3. **Generate Node Batches**:
   - Transform the analyzed code into a series of JSON files. Each file represents a batch of nodes, capturing different elements and relationships within the codebase. This modular approach helps in managing large datasets and simplifies the processing.

4. **Process Nodes**:
   - Sequentially send each JSON batch to the Rocket.Chat application for further processing. The application will handle the integration and management of these nodes within the graph database. This step ensures that each batch is properly ingested and stored in Neo4j.
