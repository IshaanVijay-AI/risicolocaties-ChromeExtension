// Background service worker for API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRiskLocations') {
    handleRiskLocationsRequest(request, sendResponse);
    return true; // Will respond asynchronously
  }
});

async function handleRiskLocationsRequest(request, sendResponse) {
  try {
    const wfsClient = new OVAMWFSClient();
    const { coordinates, capakey } = request;
    
    const wfsResponse = await wfsClient.queryRiskLocationsDirectLambert(
      coordinates.x_lambert, 
      coordinates.y_lambert, 
      500
    );
    
    const riskLocations = wfsClient.parseRiskLocations(wfsResponse);
    const lonLat = wfsClient.transformer.transform(coordinates.x_lambert, coordinates.y_lambert);
    
    sendResponse({
      success: true,
      data: {
        coordinates: {
          lambert72: coordinates,
          wgs84: { lon: lonLat[0], lat: lonLat[1] }
        },
        capakey: capakey,
        risk_locations_found: riskLocations.length,
        risk_locations: riskLocations
      }
    });
  } catch (error) {
    console.error('Error in background risk location request:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

class OVAMWFSClient {
  constructor() {
    this.base_url = "https://beheer-risicolocaties.ovam.be/geoserver/BROL/wfs";
    // Simple transformer for Lambert72 to WGS84 (in a real extension, you might want a proper library)
    this.transformer = {
      transform: (x, y) => {
        // Simplified transformation - in production use a proper coordinate transformation library
        // This is a very rough approximation for demonstration
        const lon = (x / 100000) - 0.1;
        const lat = (y / 100000) - 0.1;
        return [lon, lat];
      }
    };
  }

  async queryRiskLocationsDirectLambert(x_lambert, y_lambert, buffer_meters = 0) {
    const minx = x_lambert - buffer_meters;
    const miny = y_lambert - buffer_meters;  
    const maxx = x_lambert + buffer_meters;
    const maxy = y_lambert + buffer_meters;
    
    const bbox = `${minx},${miny},${maxx},${maxy}`;
    
    const params = {
      "service": "WFS",
      "version": "2.0.0",
      "request": "GetFeature",
      "typeName": "BROL:risicolocatie", 
      "outputFormat": "application/json",
      "bbox": bbox,
      "srsname": "EPSG:31370"
    };
    
    const url = new URL(this.base_url);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Lambert72 query failed:', error);
      throw error;
    }
  }

  parseRiskLocations(wfs_data) {
    const features = [];
    
    for (const feature of wfs_data.features || []) {
      const props = feature.properties || {};
      const geometry = feature.geometry || {};
      
      const cleaned_feature = {
        'id': feature.id,
        'geometry_type': geometry.type,
        'coordinates': geometry.coordinates,
        'properties': Object.fromEntries(
          Object.entries(props).filter(([_, v]) => v !== null)
        )
      };
      features.push(cleaned_feature);
    }
    
    return features;
  }
}