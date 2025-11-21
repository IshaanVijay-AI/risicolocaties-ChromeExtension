# Geopunt Risk Location Finder Chrome Extension

A Chrome extension that extracts parcel information from [Geopunt.be](https://www.geopunt.be/) and queries risk locations from the OVAM WFS service—all within the same browser tab.

---


## Installation

### Manual Installation

1. Download or clone this repository.  
2. Open Chrome and navigate to `chrome://extensions/`.  
3. Enable **Developer mode** in the top-right corner.  
4. Click **Load unpacked** and select the extension folder.  
5. The extension will appear in your toolbar.
## Features

- **Parcel Data Extraction**: Automatically extracts CaPaKey and coordinates from selected parcels on Geopunt.be.  
- **Risk Location Query**: Queries the OVAM WFS service for risk locations near the extracted coordinates.  
- **Seamless Integration**: Works directly within the Geopunt.be website without opening new windows.  
- **Real-time Status**: Displays current extraction status and results in the popup interface.

---
## Usage

### Step-by-Step Guide

1. Navigate to [Geopunt](https://www.geopunt.be/).  
2. Use the map to select a parcel of interest.  
3. Open the extension by clicking the **Geopunt Risk Finder** icon in Chrome's toolbar.  

#### Extract Parcel Data

- Click **Extract Parcel Data** to:  
  - Open the "Kadastrale informatie" dropdown.  
  - Extract the CaPaKey value.  
  - Fetch center coordinates from the CAPAKEY API.

#### Query Risk Locations

- Click **Get Risk Locations** to:  
  - Query OVAM's WFS service with the coordinates.  
  - Display found risk locations with details.

#### Full Automation

- Click **Full Automation** to run both steps sequentially automatically.

---



## How It Works

### Architecture

The extension uses a multi-component architecture:

- **Popup Interface (`popup.html/js/css`)**: User interface with buttons and status display.  
- **Content Script (`content.js`)**: Interacts with Geopunt.be page to extract data.  
- **Background Service (`background.js`)**: Handles API calls to external services.  
- **Manifest (`manifest.json`)**: Extension configuration and permissions.

### Data Flow

1. User navigates to Geopunt.be and selects a parcel.  
2. Click the extension icon to open the popup.  
3. Use buttons to trigger data extraction and risk location queries.  
4. Results are displayed in real-time within the popup.

---



---

## File Structure

```
geopunt-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Popup user interface
├── popup.js           # Popup functionality
├── styles.css         # Popup styling
├── background.js      # Background service worker
└── content.js         # Content script for Geopunt interaction
```

---



### Buttons Description

| Button Name            | Function                                                                 |
|------------------------|-------------------------------------------------------------------------|
| Extract Parcel Data     | Extracts CaPaKey and coordinates from the current Geopunt page          |
| Get Risk Locations      | Queries risk locations using previously extracted coordinates          |
| Full Automation         | Runs the complete workflow automatically                                 |

---

## Technical Details

### APIs Used

- **Geopunt.be**: Source for parcel selection and initial data.  
- **CAPAKEY API** (`geo.api.vlaanderen.be`): Provides parcel geometry and center coordinates.  
- **OVAM WFS Service** (`beheer-risicolocaties.ovam.be`): Provides risk location data.

### Data Processing

- **Coordinate Extraction**: Uses Lambert72 coordinate system (EPSG:31370).  
- **Coordinate Transformation**: Converts to WGS84 for display purposes.  
- **Risk Location Filtering**: Queries locations within 500-meter radius of parcel center.

### Permissions

- `activeTab`: To interact with Geopunt.be.  
- `storage`: To save state between sessions.  
- `scripting`: To inject content scripts.  
- Host permissions for Geopunt.be and external APIs.

---

## Troubleshooting

### Common Issues

- **"Could not find Kadastrale informatie dropdown"**  
  - Ensure a parcel is selected on the map.  
  - Wait for the page to fully load.

- **"No coordinates available"**  
  - Parcel data extraction must complete successfully first.  
  - Ensure a valid parcel is selected.

- **Extension not working**  
  - Verify you are on the official Geopunt.be website.  
  - Refresh the page.  
  - Check Chrome extensions page for errors.

### Debugging

- Open Chrome Developer Tools → **Console** for messages from the extension.  
- Check **Network** tab for API call failures.

---

## Development

### Building from Source

1. Clone the repository.  
2. Make modifications as needed.  
3. Load unpacked extension in Chrome as described above.

### File Descriptions

| File              | Description                                    |
|------------------|------------------------------------------------|
| manifest.json     | Defines extension structure and permissions   |
| popup.html        | Main user interface                            |
| popup.js          | Handles button clicks and state management    |
| content.js        | Contains Geopunt interaction logic            |
| background.js     | Manages API calls to external services        |
| styles.css        | Popup styling and layout                       |
