const ctx = document.getElementById('myChart');

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Vanilla', 'Choclate', 'Milk', 'Tea', 'Sugar', 'Strawberries', 'Blueberries'],
        datasets: [{
            label: 'Inventory Amount Used',
            data: [128, 190, 330, 1200, 900, 300, 1010],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});