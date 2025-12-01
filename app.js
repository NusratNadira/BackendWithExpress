 
const express = require('express')
var cors = require('cors')
const app = express()
 
var dynamicCorsOptions = function (req, callback) {
  var corsOptions;
  if (req.path.startsWith('/')) {
    corsOptions = {
      origin: 'http://localhost:3000', // Allow only a specific origin
      credentials: true,            // Enable cookies and credentials
    };
  } else {
    corsOptions = { origin: '*' };   // Allow all origins for other routes
  }
  callback(null, corsOptions);
};
 
app.use(cors(dynamicCorsOptions));
 
const port = 4000
const userRoutes = require('./routes/users')
 
// JSON parser MUST be before routes
app.use(express.json());
 
app.get('/', (req, res) => {
  res.send('Hello World! Naimur')
})
 
app.use('/user', require('./routes/users'));
 
app.use('/static', express.static('public'));
 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
 
 