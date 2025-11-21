1. Point Query (Inside Parcel)
xml
<fes:Intersects>
  <fes:ValueReference>geometry</fes:ValueReference>
  <gml:Point srsName="http://www.opengis.net/def/crs/EPSG/0/31370">
    <gml:pos>112200.0 209000.0</gml:pos>  <!-- Single point inside -->
  </gml:Point>
</fes:Intersects>
What this returns:

Only risk locations that contain or touch that specific point

Misses risk locations that are:

Partially inside the parcel but don't cover your point

On the edges/corners of your parcel

Large risk areas that intersect the parcel but don't cover your specific point

2. Polygon Query (Full Parcel Geometry)
xml
<fes:Intersects>
  <fes:ValueReference>geometry</fes:ValueReference>
  <gml:Polygon srsName="http://www.opengis.net/def/crs/EPSG/0/31370">
    <gml:exterior>
      <gml:LinearRing>
        <gml:posList>112109.05131306499 208880.10721898451 112303.24273719639 208880.10721898451 112303.24273719639 209121.10133115202 112109.05131306499 209121.10133115202 112109.05131306499 208880.10721898451</gml:posList>
      </gml:LinearRing>
    </gml:exterior>
  </gml:Polygon>
</fes:Intersects>
What this returns:

All risk locations that have any spatial relationship with your parcel:

Completely inside the parcel

Partially overlapping the parcel

Touching the boundary

Large risk areas that intersect any part of the parcel
