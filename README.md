VDE Dataset Viewer

![VDE Dataset Viewer](./assets/datasetView.png)

## Description
The VDE Dataset Viewer is a tool designed to help users visualize and explore datasets.

Supported Formats:
* [Dataset-JSON v1.1](https://github.com/cdisc-org/DataExchange-DatasetJson)
* NDJSON representation of Dataset-JSON 1.1
* Compressed Dataset-JSON 1.1
* XPORT v5
* SAS7BDAT


API Specification: [DataExchange-DatasetJson-API](https://github.com/cdisc-org/DataExchange-DatasetJson-API)

## Features
* Reading large size datasets
* Multiplatform: Windows, Linux (and MacOS if someone with Mac packages it)
* Filtering with value autocomplete
* Sorting
* Row and column navigation
* Metadata info
* Cell selection
* Automatic updates
* Automated testing
* API access

## Viewing Customization Settings
* Numeric date format
* Number rounding
* Dynamic cell height
* Automatic width estimation
* Encoding control

## Development
To develop the VDE Dataset Viewer, follow these steps:
1. Clone the repository: `git clone https://github.com/defineEditor/vde-dataset-viewer.git`
2. Navigate to the project directory: `cd vde-dataset-viewer`
3. Install the dependencies: `npm install`
4. Start the development mode: `npm run start`

## Testing
The VDE Dataset Viewer uses Jest for testing. Tests are located in the `__tests__` folder. To run the tests, use:
1. Execute all tests : `npm test`
2. Run specific tests: `npm test -- <test-file-name>`

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
