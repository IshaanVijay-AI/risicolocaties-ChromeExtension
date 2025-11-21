import requests

url = "https://beheer-risicolocaties.ovam.be/geoserver/BROL/wfs"
headers = {"Content-Type": "text/xml"}

xml_data = """
<wfs:GetFeature service="WFS" version="2.0.0"
  xmlns:wfs="http://www.opengis.net/wfs/2.0"
  xmlns:fes="http://www.opengis.net/fes/2.0"
  xmlns:gml="http://www.opengis.net/gml/3.2"
  xmlns:BROL="http://BROL">
  <wfs:Query typeNames="BROL:risicolocatie">
    <fes:Filter>
      <fes:Intersects>
        <fes:ValueReference>geometry</fes:ValueReference>
        <gml:Polygon srsName="http://www.opengis.net/def/crs/EPSG/0/31370">
          <gml:exterior>
            <gml:LinearRing>
              <gml:posList>
                112109.05131306499 208880.10721898451 
                112303.24273719639 208880.10721898451 
                112303.24273719639 209121.10133115202 
                112109.05131306499 209121.10133115202 
                112109.05131306499 208880.10721898451
              </gml:posList>
            </gml:LinearRing>
          </gml:exterior>
        </gml:Polygon>
      </fes:Intersects>
    </fes:Filter>
  </wfs:Query>
</wfs:GetFeature>
"""

response = requests.post(url, headers=headers, data=xml_data)

# Save response to a text file in the same folder
with open("response.txt", "w", encoding="utf-8") as f:
    f.write(response.text)

print("Response saved to response.txt")
