async function test() {
  const r = await fetch('https://merchant.zaykafood.online/api/v1/orders');
  console.log(r.status);
}
test();
