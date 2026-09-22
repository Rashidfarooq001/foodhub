const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjcxYjZlNy1iNDgzLTQ2OTItOThiYS1iNzZlNWM3MGE4ODgiLCJwaG9uZSI6Iis5MTkzMjA2NDYyOTIiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3ODk5MTI3MjcsImV4cCI6MTc5MDUxNzUyN30.6IFc4OkffyZrXx1SNw94iuiVyFKLkJSTghsynL9pLDw";
fetch("https://api.zaykafood.online/api/v1/orders/history?status=ALL", {
  headers: { "Authorization": `Bearer ${token}` }
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data[0], null, 2));
});
