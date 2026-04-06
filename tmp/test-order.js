fetch("http://localhost:3000/api/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    restaurant_id: "7d0d8bb0-dc21-4ea9-b903-f368ddb806d2", // Need to get a valid UUID
    table_code: "1",
    subtotal: 100,
    service_charge: 5,
    tax: 5,
    total: 110,
    items: [
      {
        menu_item_id: "some-uuid",
        name: "Test",
        price: 100,
        qty: 1
      }
    ]
  })
}).then(res => res.json()).then(console.log).catch(console.error);
