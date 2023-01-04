require('dotenv').config();
const express = require("express");
const app = express();
const port = process.env.API_PORT;
const userRouter = require('./routes/user.router');
const accountRouter = require('./routes/account.router');
const fdRouter = require('./routes/fd.router');
const branchRouter = require('./routes/branch.router');
const jwt = require("jsonwebtoken");

// parse incoming requests as JSON
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

// check jwt token of the request 
// if jwt token is valid, then call next() to continue the request and send relevant path segment to the router
// if jwt token is invalid, then send 401 response
// allow all requests, POST request to /api/v1/user/auth and POST request to /api/v1/user to pass without jwt token
app.use((req, res, next) => {
  if (
    req.path === "/api/v1/user/auth"  && req.method === "POST"||
    req.path === "/api/v1/user" && req.method === "POST" 
  ) {
    next();
    return;
  }
  const token = req.rawHeaders[1].split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" }); 
    return;
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { 
    if (err) {
      res.status(401).json({ message: "Unauthorized!" });
      return;
    }
    req.user_id = decoded.user_id;
    next();
  });
});

// mount all routes on /api path
app.use("/api/v1/user", userRouter);
app.use("/api/v1/branch", branchRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/fd", fdRouter);
// when no route is matched by now, it must be a 404 <- wildcard route
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
  return;
});


/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});
app.listen(port, () => {
  console.log(`Bank app listening at http://localhost:${port}`);
});
