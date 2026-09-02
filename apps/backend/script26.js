const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYjljZTU2Zi0xN2FkLTQ4MTEtYjk1Ni0yYjBlYTBhOTM4YjgiLCJpZCI6ImRiOWNlNTZmLTE3YWQtNDgxMS1iOTU2LTJiMGVhMGE5MzhiOCIsInJvbGUiOiJERUxJVkVSWV9QQVJUTkVSIiwiaWF0IjoxNzg4MzYzNjI3LCJleHAiOjE3ODgzNjcyMjd9.aiRUK9xOeSCOMeY8YmVs7Cjn-CmH2117bW88aHnVWvo';

async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/v1/delivery/current', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.text();
    console.log('STATUS:', res.status);
    console.log('DATA:', data);
  } catch (err) {
    console.error(err);
  }
}
test();
