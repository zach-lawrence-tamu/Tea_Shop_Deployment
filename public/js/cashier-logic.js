//scripting for checkout menu

let selecteditem = {};
let cart = [];

//These maps will change the slider inputs to its respective inputs
//Are hard coded as these values cannot change
const iceLevelMap = {
  0: "None",
  1: "Light",
  2: "Regular",
  3: "Extra"
};
const sugarLevelMap ={
  0: "0%",
  20: "20%",
  40: "50%",
  60: "80%",
  80: "100%",
  100: "120%"
}
/*LOGIC FOR POPUP*/
function openPopup(teaType = "none", teaPrice=0.0){
    const overlay = document.getElementById("popup-overlay");
    overlay.classList.add("active");
  
    const popup = document.getElementById("popup");
    popup.classList.add("active");
    popup.dataset.itemId = teaType;
    popup.dataset.price = teaPrice;
}
//Will grab all data from the popup, turn it to the correct values, 
//add it to window data, then display in div id="checkout-menu"
function updateCheckout(){
    const overlay = document.getElementById("popup-overlay");
    const popup = document.getElementById("popup");
  
    const teaType = popup.dataset.itemId;
    const teaPrice = popup.dataset.price;
    const quantity = document.getElementById("Quantity").value;
    const flavor = document.getElementById("flavor-display").innerText;
    const sugar = document.querySelector("#sugar-slider input").value;
    const ice = document.querySelector("#ice-slider input").value;
    const totalPrice = (parseFloat(teaPrice) + getAddonTotal())*quantity;
  
    const addons = Array.from(document.querySelectorAll("input[name='addon']:checked"))
      .map(cb => cb.dataset.name);
  
    const item = {
      name: teaType,
      price: totalPrice,
      quantity: quantity,
      flavor: flavor,
      sugar: sugarLevelMap[sugar],
      ice: iceLevelMap[ice],
      addons: addons,
      teaPrice: teaPrice
    };
  

    let items = JSON.parse(localStorage.getItem("checkoutItems")) || [];
    if (typeof window.editingIndex === "number") {
      items[window.editingIndex] = item;
      delete window.editingIndex;
    } else {
      items.push(item);
    }
    localStorage.setItem("checkoutItems", JSON.stringify(items));
    loadOrder();
    overlay.classList.remove("active");


    /*RESET VALUES*/ 
    document.getElementById("flavor-display").innerHTML="Choose a flavor &darr;";
    document.getElementById("Quantity").value="";
    document.getElementById("sugar-level").innerHTML="100%";
    document.querySelector("#sugar-slider input").value=80;
    document.getElementById("ice-level").innerHTML="Regular";
    document.querySelector("#ice-slider input").value=2;
    document.querySelectorAll("input[type='checkbox']:checked").forEach((element)=>
    {
      element.click();
    });
}

function returnToMenu(){
  const overlay = document.getElementById("popup-overlay");
  overlay.classList.remove("active");

  const popup = document.getElementById("popup");
  popup.classList.remove("active");

  /*RESET VALUES*/
  document.getElementById("flavor-display").innerHTML="Choose a flavor &darr;";
  document.getElementById("Quantity").value="";
  document.getElementById("sugar-level").innerHTML="100%";
  document.querySelector("#sugar-slider input").value=100;
  document.getElementById("ice-level").innerHTML="Regular";
  document.querySelector("#ice-slider input").value=2;
  document.querySelectorAll("input[type='checkbox']:checked").forEach((element)=>
  {
    element.click();
  });
}

//Helper function: gets total based on addons selected
function getAddonTotal() {
  let total = 0;
  const checkedAddons = document.querySelectorAll('.addon-checkbox:checked');
  console.log("Checked Addons:", checkedAddons);

  checkedAddons.forEach(cb => {
    const name = cb.dataset.name;
    const priceStr = cb.dataset.price;
    const price = parseFloat(priceStr);
    console.log(`Addon: ${name}, Price (raw): ${priceStr}, Parsed: ${price}`);

    if (!isNaN(price)) {
      total += price;
    } else {
      console.warn(`Invalid price for addon "${name}": ${priceStr}`);
    }
  });
  return total;
}

//next 3 function update their respective inputs so that when the user changes the input, 
//it is reflected in the popup
function flavorDropdownUpdate(selectedflavor){
  document.getElementById("flavor-display").innerHTML = selectedflavor;
}

function updateIceSlider(){
  document.getElementById("ice-level").innerHTML = iceLevelMap[document.querySelector("#ice-slider input").value];
}

function updateSugarSlider(){
  document.getElementById("sugar-level").innerHTML= sugarLevelMap[document.querySelector("#sugar-slider input").value];
}

//In case a user goes back from checkout.ejs... 
//updates div id="checkout.ejs" to reflect current order
function loadOrder() {
  const items = JSON.parse(localStorage.getItem("checkoutItems")) || [];
  const container = document.getElementById("checkout-items");
  container.innerHTML = ""; // Clear the display

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}
         <button onclick="removeFromCart(${index})">❌</button></p>
         <button onclick="editCartItem(${index})">✏️ Edit</button>
      <p>Flavor: ${item.flavor}, Sugar: ${item.sugar}, Ice: ${item.ice}</p>
      <p>Addons: ${item.addons.join(", ")}</p>
    `;
    container.appendChild(div);
  });
}
// helper function to force call loadOrder() on loading cashier view
window.onload = function() {
  loadOrder();
};

//Logic to remove items from the cart
function removeFromCart(index) {
  let items = JSON.parse(localStorage.getItem("checkoutItems")) || [];

  if (index >= 0 && index < items.length) {
    items.splice(index, 1);
    localStorage.setItem("checkoutItems", JSON.stringify(items));
    loadOrder();
  }
}

//Logic to reopen order if customers want to edit it
function editCartItem(index) {
  const items = JSON.parse(localStorage.getItem("checkoutItems")) || [];
  const item = items[index];
  if (!item) return;

  window.editingIndex = index;

  openPopup(item.name, item.teaPrice); 
  
  document.getElementById("Quantity").value = item.quantity;
  document.getElementById("flavor-display").innerHTML = item.flavor;

  const sugarValue = Object.keys(sugarLevelMap).find(key => sugarLevelMap[key] === item.sugar);
  document.querySelector("#sugar-slider input").value = sugarValue || 80;
  document.getElementById("sugar-level").innerHTML = item.sugar;

  const iceValue = Object.keys(iceLevelMap).find(key => iceLevelMap[key] === item.ice);
  document.querySelector("#ice-slider input").value = iceValue || 2;
  document.getElementById("ice-level").innerHTML = item.ice;

}