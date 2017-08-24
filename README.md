# PolyMapper
Simple tool to store information mapped to geo location in a local JSON file rather than on a server.

# Usage
- Open `index.html` in a browser
- Enable Drawing via the button on the top left
- Draw a polygon on the map by clicking points ( `ESC` will remove the last point )
- Disable Drawing Once One/Many Polygons Have Been Created
- Clicking on drawn polygons will bring up the detail modal
    - Add fields via `+Add Field` button
    - Fill in detail For these fields
    - Remove Fields via respective `X` button
    - Close Modal to store the information to that polygon, re-clicking the polygon will bring that data back up
- Once complete, click `Save To File` to write the data to a JSON file to store locally on your computer
- To Reload a previously saved file, select the file with the file selector on the top left & click `Load`

# Notes:
The purpose of this is to manage and store this information locallt on a clients computer, no data is ever transferred between the client side and any server, even when this page is hosted on a web-server as all actions are performed via the browser client-side JS.
