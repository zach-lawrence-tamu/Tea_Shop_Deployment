let myChart = null;

function updateChartData(labels, values) {
    if (myChart) {
        myChart.data.labels = labels;
        myChart.data.datasets[0].data = values;
        myChart.update();
        return;
    }

    const ctx = document.getElementById('myChart').getContext('2d');

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Inventory Amount Used',
                data: values,
                backgroundColor: generateBarColors(values.length),
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
}

function generateBarColors(count) {
    const colors = [
        '#007bff', '#28a745', '#ffc107', '#dc3545',
        '#17a2b8', '#6f42c1', '#fd7e14', '#20c997',
        '#6610f2', '#e83e8c'
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}
