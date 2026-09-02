require("dotenv").config();
const jwt = require("./node_modules/jsonwebtoken");

const token = jwt.sign(
  { id: "af22db51-1f96-4a9c-9213-e30da89e96a6", sub: "af22db51-1f96-4a9c-9213-e30da89e96a6", role: "DELIVERY_PARTNER" },
  "super-secret-jwt-key-foodhub-2026-enterprise",
  { expiresIn: "1h" }
);
console.log("JWT Token:", token);
console.log("\n--- Test this against LIVE backend ---");
console.log("curl -s -H \"Authorization: Bearer TOKEN\" https://foodhub-backend-enq2.onrender.com/api/v1/delivery/current | head -c 2000");
