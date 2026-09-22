const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjcxYjZlNy1iNDgzLTQ2OTItOThiYS1iNzZlNWM3MGE4ODgiLCJwaG9uZSI6Iis5MTkzMjA2NDYyOTIiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3ODk5MTI3MjcsImV4cCI6MTc5MDUxNzUyN30.6IFc4OkffyZrXx1SNw94iuiVyFKLkJSTghsynL9pLDw";
fetch("https://api.zaykafood.online/api/v1/orders/history?status=ALL", {
  headers: { "Authorization": `Bearer ${token}` }
}).then(res => res.text()).then(text => {
  console.log("Raw response (first 300 chars):", text.substring(0, 300));
  try {
    const data = JSON.parse(text);
    console.log("IsArray:", Array.isArray(data));
    console.log("Length:", data.length);
  } catch(e) {
    console.log("Not JSON!");
  }
});
