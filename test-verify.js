const http = require("http");
const body = JSON.stringify({preAuthToken:"dummy-token", otp:"1234"});
const req = http.request({
  hostname:"localhost",
  port: 4000,
  path:"/api/v1/auth/admin/login/verify-otp",
  method:"POST",
  headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)}
}, r=>{
  let b="";
  r.on("data",d=>b+=d);
  r.on("end",()=>console.log(b));
});
req.end(body);
