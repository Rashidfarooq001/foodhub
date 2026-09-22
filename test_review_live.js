const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjcxYjZlNy1iNDgzLTQ2OTItOThiYS1iNzZlNWM3MGE4ODgiLCJwaG9uZSI6Iis5MTkzMjA2NDYyOTIiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3ODk5MTI3MjcsImV4cCI6MTc5MDUxNzUyN30.6IFc4OkffyZrXx1SNw94iuiVyFKLkJSTghsynL9pLDw";
fetch("https://api.zaykafood.online/api/v1/orders/889b12a3-01e0-4443-a93b-6f0114a54760/review", {
  method: 'POST',
  headers: { 
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ rating: 5, isAnonymous: true })
}).then(async res => {
  console.log("Status:", res.status);
  console.log("Body:", await res.json());
});
