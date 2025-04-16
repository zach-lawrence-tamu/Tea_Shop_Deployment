//scripting for checkout menu

let selecteditem = {};
let cart = [];

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

function updateCheckout(){
    const overlay = document.getElementById("popup-overlay");
    const popup = document.getElementById("popup");
  
    const teaType = popup.dataset.itemId;
    const teaPrice = popup.dataset.price;
    const quantity = document.getElementById("Quantity").value;
    const flavor = document.getElementById("flavor-display").innerText;
    const sugar = document.querySelector("#sugar-slider input").value;
    const ice = document.querySelector("#ice-slider input").value;

    const totalPrice = (parseFloat(teaPrice)+getAddonTotal())*quantity;
  
    const addons = Array.from(document.querySelectorAll("input[name='addon']:checked"))
      .map(cb => cb.dataset.name);
  
    const item = {
      name: teaType,
      price: totalPrice,
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

function getAddonTotal() {
  let total = 0;
  document.querySelectorAll('.addon-checkbox:checked').forEach(cb => {
    const price = parseFloat(cb.dataset.price);
    if (!isNaN(price)) {
      total += price;
    }
  });
  console.log(total);
  return total;
}


function flavorDropdownUpdate(selectedflavor){
  document.getElementById("flavor-display").innerHTML = selectedflavor;
}

function updateIceSlider(){
  document.getElementById("ice-level").innerHTML = iceLevelMap[document.querySelector("#ice-slider input").value];
}

function updateSugarSlider(){
  document.getElementById("sugar-level").innerHTML= sugarLevelMap[document.querySelector("#sugar-slider input").value];
}
/*END LOGIC FOR POPUP*/