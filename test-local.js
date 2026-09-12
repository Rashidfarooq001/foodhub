const http = require("http");
const body = JSON.stringify({password1:"9999888877776666", password2:"88887777"});
const req = http.request({
  hostname:"localhost",
  port: 4000,
  path:"/api/v1/auth/admin/login",
  method:"POST",
  headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)}
}, r=>{
  let b="";
  r.on("data",d=>b+=d);
  r.on("end",()=>console.log(b));
});
req.end(body);
