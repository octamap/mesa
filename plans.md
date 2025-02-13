

Plans
- Better HMR for edits to HTML and css inside html
  - Currently does not do HMR update when editing css within html file imported using import("...?raw")
  - Also generally does not do HMR updates for scoped css 