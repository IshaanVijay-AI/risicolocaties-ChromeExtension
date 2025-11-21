// State management
let state = {
  capakey: null,
  coordinates: null,
  isProcessing: false
};

// DOM elements
const statusElement = document.getElementById('status');
const capakeyDisplay = document.getElementById('capakey-display');
const coordinatesDisplay = document.getElementById('coordinates-display');
const extractDataBtn = document.getElementById('extractData');
const getRiskLocationsBtn = document.getElementById('getRiskLocations');
const triggerAutomationBtn = document.getElementById('triggerAutomation');
const resultsElement = document.getElementById('results');

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  setupEventListeners();
  updateUI();
});

function setupEventListeners() {
  extractDataBtn.addEventListener('click', extractParcelData);
  getRiskLocationsBtn.addEventListener('click', getRiskLocations);
  triggerAutomationBtn.addEventListener('click', triggerFullAutomation);
}

async function loadState() {
  try {
    const result = await chrome.storage.local.get(['capakey', 'coordinates']);
    state.capakey = result.capakey || null;
    state.coordinates = result.coordinates || null;
    updateUI();
  } catch (error) {
    console.error('Error loading state:', error);
  }
}

function updateUI() {
  // Update status
  if (state.isProcessing) {
    setStatus('Processing...', 'processing');
  } else if (state.capakey && state.coordinates) {
    setStatus('Data extracted successfully', 'success');
  } else {
    setStatus('Ready', 'ready');
  }

  // Update capakey display
  if (state.capakey) {
    capakeyDisplay.textContent = `CaPaKey: ${state.capakey}`;
    capakeyDisplay.style.display = 'block';
  } else {
    capakeyDisplay.style.display = 'none';
  }

  // Update coordinates display
  if (state.coordinates) {
    coordinatesDisplay.textContent = `Coordinates: ${state.coordinates.x_lambert}, ${state.coordinates.y_lambert}`;
    coordinatesDisplay.style.display = 'block';
  } else {
    coordinatesDisplay.style.display = 'none';
  }

  // Update buttons
  getRiskLocationsBtn.disabled = !state.coordinates;
}

function setStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

function setProcessing(processing) {
  state.isProcessing = processing;
  extractDataBtn.disabled = processing;
  getRiskLocationsBtn.disabled = processing || !state.coordinates;
  triggerAutomationBtn.disabled = processing;
  updateUI();
}

async function extractParcelData() {
  setProcessing(true);
  setStatus('Extracting parcel data...', 'processing');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractParcelData'
    });
    
    if (response.success) {
      state.capakey = response.capakey;
      state.coordinates = response.coordinates;
      
      await chrome.storage.local.set({
        capakey: state.capakey,
        coordinates: state.coordinates
      });
      
      setStatus('Data extracted successfully!', 'success');
      showResults('Parcel data extracted successfully.');
    } else {
      throw new Error(response.error || 'Failed to extract data');
    }
  } catch (error) {
    console.error('Error extracting data:', error);
    setStatus('Error extracting data', 'error');
    showResults(`Error: ${error.message}`);
  } finally {
    setProcessing(false);
  }
}

async function getRiskLocations() {
  if (!state.coordinates) {
    showResults('No coordinates available. Please extract parcel data first.');
    return;
  }

  setProcessing(true);
  setStatus('Getting risk locations...', 'processing');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getRiskLocations',
      coordinates: state.coordinates,
      capakey: state.capakey
    });

    if (response.success) {
      setStatus('Risk locations retrieved!', 'success');
      
      const riskData = response.data;
      let resultsHtml = `
        <strong>Risk Locations Found: ${riskData.risk_locations_found}</strong><br>
        <strong>Coordinates (Lambert72):</strong> ${riskData.coordinates.lambert72.x_lambert}, ${riskData.coordinates.lambert72.y_lambert}<br>
        <strong>Coordinates (WGS84):</strong> ${riskData.coordinates.wgs84.lon}, ${riskData.coordinates.wgs84.lat}<br>
      `;

      if (riskData.risk_locations_found > 0) {
        resultsHtml += '<br><strong>Risk Locations:</strong><br>';
        riskData.risk_locations.forEach((location, index) => {
          resultsHtml += `${index + 1}. ID: ${location.id}<br>`;
          if (location.properties) {
            Object.entries(location.properties).forEach(([key, value]) => {
              resultsHtml += `&nbsp;&nbsp;${key}: ${value}<br>`;
            });
          }
          resultsHtml += '<br>';
        });
      }

      showResults(resultsHtml);
    } else {
      throw new Error(response.error || 'Failed to get risk locations');
    }
  } catch (error) {
    console.error('Error getting risk locations:', error);
    setStatus('Error getting risk locations', 'error');
    showResults(`Error: ${error.message}`);
  } finally {
    setProcessing(false);
  }
}

async function triggerFullAutomation() {
  setProcessing(true);
  setStatus('Running full automation...', 'processing');

  try {
    // First extract parcel data
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const extractionResponse = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractParcelData'
    });
    
    if (!extractionResponse.success) {
      throw new Error(extractionResponse.error || 'Failed to extract parcel data');
    }

    // Store the extracted data
    state.capakey = extractionResponse.capakey;
    state.coordinates = extractionResponse.coordinates;
    
    await chrome.storage.local.set({
      capakey: state.capakey,
      coordinates: state.coordinates
    });

    // Then get risk locations
    if (state.coordinates) {
      const riskResponse = await chrome.runtime.sendMessage({
        action: 'getRiskLocations',
        coordinates: state.coordinates,
        capakey: state.capakey
      });

      if (riskResponse.success) {
        setStatus('Full automation completed!', 'success');
        
        const riskData = riskResponse.data;
        let resultsHtml = `
          <strong>Full Automation Complete!</strong><br>
          <strong>CaPaKey:</strong> ${state.capakey}<br>
          <strong>Risk Locations Found:</strong> ${riskData.risk_locations_found}<br>
        `;

        if (riskData.risk_locations_found > 0) {
          resultsHtml += `<br><strong>Found ${riskData.risk_locations_found} risk location(s)</strong>`;
        }

        showResults(resultsHtml);
      } else {
        throw new Error(riskResponse.error || 'Failed to get risk locations');
      }
    }
  } catch (error) {
    console.error('Error in full automation:', error);
    setStatus('Automation failed', 'error');
    showResults(`Error: ${error.message}`);
  } finally {
    setProcessing(false);
  }
}

function showResults(message) {
  resultsElement.innerHTML = message;
  resultsElement.style.display = 'block';
}