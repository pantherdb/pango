# PAN-GO Site and Data Pipeline

## Introduction

This project streamlines the process of converting specific PAINT IBA release data into a JSON format that can be indexed into Elasticsearch. It comprises four main components: data conversion, data loading, API setup, and front-end site development. Below, you will find a high-level overview of each component, setup instructions, and links to detailed documentation for each part.

## Prerequisites

- Docker and Docker Compose
- Python 3.x
- Node.js and Angular (for the front-end)

## Project Components

### 1. Data Conversion

The Data Conversion component converts data related to a specific PAINT IBA release into JSON files suitable for Elasticsearch. This includes extracting and structuring annotation data from GAF files, managing ontology with ROBOT tools, and preparing gene lists.

**Key Operations:**
- **Annotations**: Generate `human_iba_annotations.json` from a GAF file
- **Ontology**: Produce `full_go_annotated.json`
- **Gene List**: Generate `human_iba_gene_info.json` containing distinct gene information.

For more detailed steps and usage instructions, visit [Data Conversion README](data_conversion/) 

### 2. Loader (Elasticsearch Loader)

The Loader component manages the loading of processed data into Elasticsearch, ensuring that the data is accurately indexed and efficiently stored. This involves fetching article metadata, preprocessing annotations, and handling the actual indexing into Elasticsearch.

**Setup and Operation:**
- **Initial Setup**: Install necessary Python packages and set up environment variables to configure the system properly:
    ```bash
    cp .env-example .env  # Setup environment variables
    ```

- **Fetching Article Metadata**: Retrieve unique PMIDs from `human_iba_annotations.json` and use the NCBI eUtils API to fetch article metadata needed for processing:
    ```bash
    python3 -m src.get_articles -a ./data/test_data/sample_human_iba_annotations.json -o /download/articles.json
    ```
    Note: Due to API rate limits, the script includes delays to manage request frequency as recommended by NCBI guidelines [NCBI API](https://www.ncbi.nlm.nih.gov/books/NBK25497/).

- **Data Preprocessing**: Before indexing, preprocess the data to replace term IDs with their metadata, associate gene IDs with gene metadata, and include article metadata. Determine the nature of each annotation (direct or via homology).
    ```bash
    python3 -m src.clean_annotations -a Annotations_Json -t Terms_Json -art Articles_Json -g Genes_Json -o Output_of_Clean_Annotation
    ```

- **Creating the Index**: Load the cleaned data into Elasticsearch using the following script:
    ```bash
    python3 -m src.index_es -a $clean_annotations
    ```

For more detailed setup and operational instructions, visit [Loader README](loader).


### 3. API (FastAPI with GraphQL)

The API component is powered by FastAPI and GraphQL, providing a robust interface for handling complex data interactions with Elasticsearch. It offers a high-performance, flexible API setup ideal for both development and production environments.

**Setup and Operation:**
- **Environment Setup**: Begin by installing the required Python packages and setting up the necessary environment variables:
    ```bash
    cp .env-example .env  # Configure environment variables
    ```

- **Running the Server**: Utilize Uvicorn to run the API server. For development, you can enable live reloading, but remember to disable this in production:
    ```bash
    python3 -m main  # Run the server, ensure reload is disabled for production
    ```

For further details on setting up and running the API, refer to the [API README](api).


### 4. Site (Angular Front-End)

A modern web application built with React, TypeScript, and Vite provides a user-friendly interface to interact with the data through web requests to the API.

**Development Setup:**
- Node.js environment setup.

Front-end development guidelines and setup instructions are detailed at [Site's README](site-react).

## Getting Started

To begin using this pipeline, ensure all prerequisites are installed. Then, clone this repository and follow the setup instructions in each component's detailed documentation:

```bash
   git clone https://github.com/pantherdb/pango
   cd pango
```

