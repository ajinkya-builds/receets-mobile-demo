const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the admin directory
app.use(express.static(path.join(__dirname, 'admin')));

// Serve the index.html for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.listen(port, () => {
  console.log(`Receets demo server running at http://localhost:${port}`);
});
