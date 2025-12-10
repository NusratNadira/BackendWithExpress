const express = require('express')
var cors = require('cors')

const app = express()

var dynamicCorsOptions = function (req, callback) {
  var corsOptions;
  if (req.path.startsWith('/')) {
    corsOptions = {
      origin: 'http://localhost:3000',
      credentials: true,
    };
  } else {
    corsOptions = { origin: '*' };
  }
  callback(null, corsOptions);
};

app.use(cors(dynamicCorsOptions));

const port = 4000;

// Routes
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const designationRoutes = require('./routes/designation');
const productRoutes = require('./routes/products'); 
const productTypesRoutes = require('./routes/productTypes'); 

app.use(express.json());

// Register route handlers
app.use('/users', userRoutes);
app.use('/departments', departmentRoutes);
app.use('/designation', designationRoutes);
app.use('/products', productRoutes); // ✔ plural
app.use('/productTypes', productTypesRoutes); // ✔ plural

// Default route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
