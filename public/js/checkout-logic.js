
//Will grab order from the window to display in div id="order-totals"
function loadOrder() {
  const items = JSON.parse(localStorage.getItem("checkoutItems")) || [];
  const container = document.getElementById("order-summary");
  const totalsDiv = document.getElementById("order-totals");

  let subtotal = 0;

  items.forEach(item => {
    const safeName = item.name.toLowerCase().replace(/\s+/g, '_');
    const imageSrc = `/tea_images/${safeName}.png`;

    const div = document.createElement("div");
    div.className = "order-item";
    div.innerHTML = `
      <img src="${imageSrc}" alt="${item.name}" class="order-image">
      <div class="order-details">
        <p>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</p>
        <p>Flavor: ${item.flavor}, Sugar: ${item.sugar}, Ice: ${item.ice}</p>
        <p>Addons: ${item.addons.join(", ")}</p>
      </div>
    `;
    container.appendChild(div);

    subtotal += item.price;
  });

  const taxRate = 0.0825;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  totalsDiv.innerHTML = `
    <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
    <p><strong>Tax (8.25%):</strong> $${tax.toFixed(2)}</p>
    <p><strong>Total:</strong> $${total.toFixed(2)}</p>
  `;
}

//Calls the "/submit-order" in index.js to finalize the transaction and send the transaction to the database
//Also clears window data and, on customers only, will lead back to the login screen
function finalizeTransaction(){
    const items = JSON.parse(localStorage.getItem("checkoutItems") || "[]");

  if (items.length === 0) {
    alert("No items to submit.");
    return;
  }

  const now = new Date();
  const isoDate = now.toISOString(); 

  fetch("/cashier/submit-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: items,
      tip: 0.00,
      date: isoDate
    })
  })
  .then(res => {
    if (res.ok) {
      localStorage.removeItem("checkoutItems");
      window.location.href = "/login";
    } else {
      alert("Failed to finalize order.");
    }
  })
  .catch(err => {
    console.error("Error submitting order:", err);
    alert("Server error. Try again.");
  });

    localStorage.clear();
    window.location.href = "/cashier";
}

// helper function to force call loadOrder() on loading checkou view
window.onload = function() {
    loadOrder();
};