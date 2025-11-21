// Content script to interact with Geopunt page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractParcelData') {
    handleExtractParcelData(request, sendResponse);
    return true; // Will respond asynchronously
  }
});

async function handleExtractParcelData(request, sendResponse) {
  try {
    // Step 1: Click Kadastrale informatie dropdown
    const kadastraleClicked = await clickKadastraleInformatie();
    if (!kadastraleClicked) {
      throw new Error('Could not find or click Kadastrale informatie dropdown');
    }

    // Step 2: Extract CaPaKey value
    const capakey = await extractCapakeyValue();
    if (!capakey) {
      throw new Error('Could not extract CaPaKey value');
    }

    // Step 3: Get center coordinates from API
    const coordinates = await getCenterCoordinates(capakey);
    if (!coordinates) {
      throw new Error('Could not get center coordinates from API');
    }

    sendResponse({
      success: true,
      capakey: capakey,
      coordinates: coordinates
    });
  } catch (error) {
    console.error('Error extracting parcel data:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function clickKadastraleInformatie() {
  const selectors = [
    "//button[contains(., 'Kadastrale informatie')]",
    "//button[contains(@class, 'geopunt-map-sidebar-accordion__toggle')]",
    "//h3[contains(., 'Kadastrale informatie')]/ancestor::button"
  ];

  for (const selector of selectors) {
    try {
      const element = await waitForElement(selector, 5000);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        element.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Kadastrale informatie dropdown clicked');
        return true;
      }
    } catch (error) {
      console.log(`Selector ${selector} failed:`, error);
      continue;
    }
  }
  return false;
}

async function extractCapakeyValue() {
  const capakeySelectors = [
    "//dt[contains(., 'CaPaKey:')]/following-sibling::dd//a",
    "//div[contains(@class, 'vl-properties__list--kadastraal')]//a[contains(@class, 'geopunt-map-kadastraal-capakey-link')]",
    "//a[contains(@href, '/capakey/')]"
  ];

  for (const selector of capakeySelectors) {
    try {
      const element = await waitForElement(selector, 3000);
      if (element) {
        let capakeyValue = element.textContent.trim();
        capakeyValue = capakeyValue.replace(/\s+/g, ' ');
        
        if (capakeyValue) {
          console.log('Extracted CaPaKey:', capakeyValue);
          return capakeyValue;
        }
      }
    } catch (error) {
      console.log(`CaPaKey selector ${selector} failed:`, error);
      continue;
    }
  }
  return null;
}

async function getCenterCoordinates(capakey) {
  try {
    const encodedCapakey = encodeURIComponent(capakey);
    const url = `https://geo.api.vlaanderen.be/capakey/v2/parcel/${encodedCapakey}?geometry=full&srs=31370&status=actual`;
    
    console.log('Fetching coordinates from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (data.geometry && data.geometry.center) {
      let centerData = data.geometry.center;
      
      if (typeof centerData === 'string') {
        centerData = JSON.parse(centerData);
      }
      
      if (centerData.coordinates && centerData.coordinates.length === 2) {
        const coordinates = {
          x_lambert: parseFloat(centerData.coordinates[0]),
          y_lambert: parseFloat(centerData.coordinates[1])
        };
        console.log('Extracted coordinates:', coordinates);
        return coordinates;
      }
    }
    
    throw new Error('Could not find center coordinates in response');
  } catch (error) {
    console.error('Error getting center coordinates:', error);
    return null;
  }
}

function waitForElement(xpath, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkElement() {
      const result = document.evaluate(
        xpath, 
        document, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      );
      
      const element = result.singleNodeValue;
      
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element not found with XPath: ${xpath}`));
      } else {
        setTimeout(checkElement, 100);
      }
    }
    
    checkElement();
  });
}