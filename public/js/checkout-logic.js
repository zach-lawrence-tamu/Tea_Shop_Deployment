
//Will grab order from the window to display in div id="order-summary"
function loadOrder(){
    const items = JSON.parse(localStorage.getItem("checkoutItems")) || [];
    const container = document.getElementById("order-summary");

    items.forEach(item => {
      const div = document.createElement("div");
      div.innerHTML = `
        <p>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</p>
        <p>Flavor: ${item.flavor}, Sugar: ${item.sugar}, Ice: ${item.ice}</p>
        <p>Addons: ${item.addons.join(", ")}</p>
      `;
      container.appendChild(div);
    });
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
    window.location.href = "/";
}

// helper function to force call loadOrder() on loading checkou view
window.onload = function() {
    loadOrder();
};