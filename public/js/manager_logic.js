var stored_id;

var add = function () {
    fetch('add');
    fetch('hitNum')
        .then(response => response.json())
        .then(data => document.getElementById('hits').innerText = data)
        .catch(error => console.log(error));
}

var display_inventory_modifier = function (id, ingredient, amount, cost_per_amount) {
    console.log("mod: ", id, ingredient, amount, cost_per_amount);
    stored_id = id;

    document.getElementById('ingredient').value = ingredient;
    document.getElementById('amount').value = amount;
    document.getElementById('cost-per').value = cost_per_amount;

    document.getElementById('window-header').innerText = "Modify Inventory Item";
    document.getElementById('add-inventory-window-button').style.display = "none";
    document.getElementById('modify-inventory-window-button').style.display = "block";

    document.getElementById("menu-item-forms").style.display = "none";
    document.getElementById("inventory-forms").style.display = "block";
    document.getElementById("addon-forms").style.display = "none";
    document.getElementById("flavor-forms").style.display = "none";
}

var display_inventory_adder = function () {
    display_inventory_modifier("", "", "", "");
    console.log("inventory adder");
    document.getElementById('window-header').innerText = "Add Inventory Item";

    document.getElementById('add-inventory-window-button').style.display = "block";
    document.getElementById('modify-inventory-window-button').style.display = "none";
}

var display_menu_item_modifier = function (id, name, price) {
    stored_id = id;
    document.getElementById('tea-type').value = name;
    document.getElementById('tea-price').value = price;

    document.getElementById('window-header').innerText = "Modify Menu Item";
    document.getElementById('add-menu-window-button').style.display = "none";
    document.getElementById('modify-menu-window-button').style.display = "block";

    document.getElementById("inventory-forms").style.display = "none";
    document.getElementById("menu-item-forms").style.display = "block";
    document.getElementById("addon-forms").style.display = "none";
    document.getElementById("flavor-forms").style.display = "none";
}

var display_menu_item_adder = function () {
    display_menu_item_modifier();
    document.getElementById('tea-type').value = "";
    document.getElementById('tea-price').value = "";
    document.getElementById('add-menu-window-button').style.display = "block";
    document.getElementById('modify-menu-window-button').style.display = "none";

    document.getElementById('window-header').innerText = "Add Menu Item";

}

var display_addon_modifier = function (id, name, price) {
    stored_id = id;
    document.getElementById('addon-name').value = name;
    document.getElementById('addon-price').value = price;

    document.getElementById('window-header').innerText = "modify Addon";

    document.getElementById('add-addon-window-button').style.display = "none";
    document.getElementById('modify-addon-window-button').style.display = "block";

    document.getElementById("inventory-forms").style.display = "none";
    document.getElementById("menu-item-forms").style.display = "none";
    document.getElementById("addon-forms").style.display = "block";
    document.getElementById("flavor-forms").style.display = "none";
}

var display_addon_adder = function () {
    display_addon_modifier();
    document.getElementById('addon-name').value = "";
    document.getElementById('addon-price').value = "";

    document.getElementById('window-header').innerText = "Add New Addon";

    document.getElementById('add-addon-window-button').style.display = "block";
    document.getElementById('modify-addon-window-button').style.display = "none";
}

var display_flavor_adder = function () {
    document.getElementById('flavor-name').value = "";
    document.getElementById('window-header').innerText = "Add New Flavor";
    document.getElementById("inventory-forms").style.display = "none";
    document.getElementById("menu-item-forms").style.display = "none";
    document.getElementById("addon-forms").style.display = "none";
    document.getElementById("flavor-forms").style.display = "block";
}

async function delete_with_post(id, route_name, page) {
    fetch(route_name, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "id": id })
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });

    await fetch(page);
    console.log("test");
    window.location.reload();
}

async function delete_inventory(id) {
    console.log("function: ", id);
    delete_with_post(id, 'delete_inventory');
}

async function delete_menu_item(id) {
    console.log("delete menu", id);
    delete_with_post(id, 'delete_menu_item');
}

async function delete_addon(id) {
    console.log("delete addon", id);
    delete_with_post(id, 'delete_addon');
}

async function delete_flavor(id) {
    console.log("delete flavor", id);
    delete_with_post(id, 'delete_flavor');
}

async function add_modify_post(form_name, route_name, page) {
    console.log("add_mod", stored_id);

    var form = document.getElementById(form_name);
    var form_data = new FormData(form);

    var checkbox = document.getElementById('employee-access');
    if (checkbox != null)
    {
        form_data.set('employee-access-form', checkbox.checked);
    }

    const data = Object.fromEntries(form_data.entries());

    fetch(route_name, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "id": stored_id, "data": data })
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });

    await fetch(page);
    console.log("test");
    window.location.reload();
}

async function modify_inventory() {
    add_modify_post('inventory-forms', 'modify_inventory', 'menu_inventory');
}

async function add_inventory() {
    await fetch('max_inventory_id')
        .then(response => response.json())
        .then(data => stored_id = data + 1)
        .catch(error => console.log(error));

    add_modify_post('inventory-forms', 'add_inventory', 'menu_inventory');
}

async function modify_menu_item() {
    console.log("mod menu stored: ", stored_id);
    add_modify_post('menu-item-forms', 'modify_menu_item', 'menu_inventory');
}

async function add_menu_item() {
    await fetch('max_menu_id')
        .then(response => response.json())
        .then(data => stored_id = data + 1)
        .catch(error => console.log(error));

    add_modify_post('menu-item-forms', 'add_menu_item', 'menu_inventory');
}

async function modify_addon() {
    add_modify_post('addon-forms', 'modify_addon', 'menu_inventory');
}

async function add_addon() {
    await fetch('max_addon_id')
        .then(response => response.json())
        .then(data => stored_id = data + 1)
        .catch(error => console.log(error));

    add_modify_post('addon-forms', 'add_addon', 'menu_inventory');
}

async function add_flavor() {
    await fetch('max_flavor_id')
        .then(response => response.json())
        .then(data => stored_id = data + 1)
        .catch(error => console.log(error));

    add_modify_post('flavor-forms', 'add_flavor', 'menu_inventory');
}

async function delete_employee(id) {
    delete_with_post(id, 'delete_employee', 'employees');
}

async function modify_employee() {
    add_modify_post('employee-forms', 'modify_employee', 'employees');
}

async function add_employee() {
    await fetch('max_employee_id')
        .then(response => response.json())
        .then(data => stored_id = data + 1)
        .catch(error => console.log(error));

    add_modify_post('employee-forms', 'add_employee', 'employees');
}

var display_employee_data = function (id, hours, manager_access, password) {
    stored_id = id;

    document.getElementById('window-header').innerText = "View Employee Data";
    document.getElementById('employee-number-p').innerText = "Employee #" + id;
    document.getElementById('employee-hours-p').innerText = "Weekly Hours Worked: " + hours;
    document.getElementById('employee-access-p').innerText = "Manager Access: " + manager_access;
    document.getElementById('employee-password-p').innerText = "Password: " + password;

    document.getElementById("employee-view").style.display = "block";
    document.getElementById("employee-forms").style.display = "none";
}

var display_employee_modifier = function (id, hours, manager_access, password) {
    stored_id = id;

    document.getElementById('window-header').innerText = "Modify Employee Data";
    document.getElementById('employee-number').innerText = "Employee #" + id;

    document.getElementById('employee-hours').value = hours;
    document.getElementById('employee-access').checked = (manager_access === 'true');
    document.getElementById('employee-password').value = password;

    document.getElementById('add-window-button').style.display = "none";
    document.getElementById('modify-window-button').style.display = "block";

    document.getElementById("employee-view").style.display = "none";
    document.getElementById("employee-forms").style.display = "block";
}

var display_employee_adder = function () {
    display_employee_modifier("");
    document.getElementById('window-header').innerText = "Add Employee";
    document.getElementById('employee-number').innerText = "";

    document.getElementById('employee-hours').value = "";
    document.getElementById('employee-access').checked = false;
    document.getElementById('employee-password').value = "";

    document.getElementById('add-window-button').style.display = "block";
    document.getElementById('modify-window-button').style.display = "none";
}

var display_x_report = function () {
    
}

var display_z_report = function () {
    
}