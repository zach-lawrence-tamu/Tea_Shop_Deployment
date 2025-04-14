//scripting for checkout menu

let selecteditem = {};
let cart = [];

const iceLevelMap = {
  0: "None",
  1: "Light",
  2: "Regular",
  3: "Extra"
};

function openPopup(teaType = "none", teaPrice=0.0){
    const overlay = document.getElementById("popup-overlay");
    overlay.classList.add("active");
  
    const popup = document.getElementById("popup");
    popup.classList.add("active");
    popup.dataset.itemId = teaType;
    popup.dataset.price = teaPrice;
}

function updateCheckout(){
    const overlay = document.getElementById("popup-overlay");
    const popup = document.getElementById("popup");
  
    const teaType = popup.dataset.itemId;
    const teaPrice = popup.dataset.price;
    const quantity = document.getElementById("Quantity").value;
    const flavor = document.getElementById("flavor-display").innerText;
    const sugar = document.querySelector("#sugar-slider input").value;
    const ice = document.querySelector("#ice-slider input").value;
  
    const addons = Array.from(document.querySelectorAll("input[name='addon']:checked"))
      .map(cb => cb.id);
  
    const item = {
      name: teaType,
      teaPrice,
      quantity,
      flavor,
      sugar,
      ice,
      addons,
    };
  
    if (!window.checkoutItems) window.checkoutItems = [];
    window.checkoutItems.push(item);
  
    const container = document.getElementById("checkout-items");
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${item.name} - ${item.quantity}x ($${item.price})</p>
      <p>Flavor: ${item.flavor}, Sugar: ${item.sugar}, Ice: ${item.ice}</p>
      <p>Addons: ${item.addons.join(", ")}</p>
    `;
    container.appendChild(div);
  
    overlay.classList.remove("active");


    /*RESET VALUES*/ 
    document.getElementById("flavor-display").innerHTML="Choose a flavor";
    document.getElementById("Quantity").innerHTML=null;
}

function returnToMenu(){
  const overlay = document.getElementById("popup-overlay");
  overlay.classList.remove("active");

  const popup = document.getElementById("popup");
  popup.classList.remove("active");
}

function flavorDropdownUpdate(selectedflavor){
  document.getElementById("flavor-display").innerHTML = selectedflavor;
}

function updateIceSlider(){
  document.getElementById("ice-level").innerHTML = iceLevelMap[document.querySelector("#ice-slider input").value];
}