//Report page - added by Pranita
let currentPage = 1;
let rowsPerPage = 20;

function fetchReportDataTable(page = 1, limit = 20) {
    const url = `/api/report-data-table?page=${page}&limit=${limit}`;

    $.get(url, function(data) {
        const tbody = $('#report-table tbody');
        tbody.empty();  // Clear any existing rows

        data.forEach((item) => {
            const orderDate = new Date(item.orderdate).toLocaleDateString('en-GB');
            const city = item.storelocation.split(',')[0];

            const row = `
                <tr>
                    <td>${item.orderid}</td>
                    <td>${item.storeid}</td>
                    <td>${orderDate}</td>
                    <td>${item.salespersonname}</td>
                    <td>${item.productname}</td>
                    <td>${item.category}</td>
                    <td>${item.orderstatus}</td>
                    <td>${item.profit}</td>
                    <td>${item.quantity}</td>
                    <td>${city}</td>
                    <td>${item.costofgoodssold}</td>
                    <td>${item.paymentmethod}</td>
                </tr>
            `;
            tbody.append(row);
        });
    });
}

function exportTableToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.autoTable({
        html: '#report-table',
        theme: 'grid'
    });
    doc.save('table.pdf');
}

function exportTableToExcel() {
    const table = document.getElementById('report-table');
    const workbook = XLSX.utils.table_to_book(table);
    XLSX.writeFile(workbook, 'table.xlsx');
}

function exportTableToCSV() {
    const table = document.getElementById('report-table');
    const csv = Papa.unparse(table);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'table.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', function() {
    fetchReportDataTable(currentPage, rowsPerPage);

    $('#rowsPerPage').change(function() {
        rowsPerPage = parseInt(this.value, 10);
        currentPage = 1; // Reset to first page
        fetchReportDataTable(currentPage, rowsPerPage);
    });

    $('#prevPage').click(function() {
        if (currentPage > 1) {
            currentPage--;
            fetchReportDataTable(currentPage, rowsPerPage);
        }
    });

    $('#nextPage').click(function() {
        currentPage++;
        fetchReportDataTable(currentPage, rowsPerPage);
    });

    $('#exportPDF').click(function() {
        exportTableToPDF();
    });

    $('#exportExcel').click(function() {
        exportTableToExcel();
    });

    $('#exportCSV').click(function() {
        exportTableToCSV();
    });
});

//Orders Page Financial Analyst
$(document).ready(function () {
    // Function to handle search and populate order info
    function searchOrder() {
    const orderId = $('#order-search').val();
    const storeId = $('#store-id').val(); // Assume there is an input for store ID

    if (orderId) {
        let url = '/api/order-info/' + orderId;
        if (storeId) {
            url += '?store_id=' + storeId;
        }

        $.get(url, function(data) {
            if (data.error) {
                alert(data.error);  // Display an alert if order not found
            } else {
                $('#order-id').text(data.orderid);
                $('#order-date').text(formatDate(data.orderdate));
                $('#order-status').text(data.orderstatus);
                $('#delivery-date').text(formatDate(data.deliverydate));
                $('#shipping-cost').text(formatCurrency(data.shippingcost));
                $('#quantity').text(data.quantity);
                $('#total-price').text(formatCurrency(data.totalprice));
            }
        });
    } else {
        // Clear the order info table if no order ID is entered
        $('#order-id').text('');
        $('#order-date').text('');
        $('#order-status').text('');
        $('#delivery-date').text('');
        $('#shipping-cost').text('');
        $('#quantity').text('');
        $('#total-price').text('');
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
    if (value == null) return '';
    return `${parseFloat(value).toFixed(2)} ₹`;
}

    
    // Trigger search on button click
    $('#search-button').on('click', function() {
        searchOrder();
    });

    // Fetch and display customer feedback pie chart
    function fetchCustomerFeedback(storeId = null) {
    let url = '/api/financial-analyst/customer-feedback';
    if (storeId) {
        url += '?store_id=' + storeId;
    }
    $.get(url, function(data) {
        const labels = data.map(item => item.customerfeedback);
        const feedbackCounts = data.map(item => item.feedbackcount);

        const ctx = document.getElementById('customerFeedbackChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Customer Feedback',
                    data: feedbackCounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                        // Add more colors as needed
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right', // Position the legend to the right of the pie chart
                        align: 'center',   // Align legend items to center
                        labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#ffffff', // Set the font color to white
                        align: 'end',
                        anchor: 'end',
                        formatter: (value, context) => {
                            // Assuming labels are numbers from 1 to 5
                            return `${context.chart.data.labels[context.dataIndex]} (${value})`;
                        },
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    });
}

// Fetch and display average order value over time line chart -- 11-07-24
    function fetchAverageOrderValueOverTime() {
    $.get('api/sales-manager/average-order-value-over-time', function(data) {
        const labels = data.map(item => new Date(item.order_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        const averageOrderValues = data.map(item => item.average_order_value);

        const ctx = document.getElementById('averageOrderValueChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Order Value',
                    data: averageOrderValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false,
                            fontColor: '#000' // Set y-axis tick color
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Average Order Value',
                            fontColor: '#000' // Set y-axis label color
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontColor: '#000' // Set x-axis tick color
                        }
                    }]
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            fontColor: '#000' // Set legend label color
                        }
                    }
                }
            }
        });
    });
}

    // Fetch and display order status distribution bar chart
    function fetchOrderStatusDistribution(storeId = null) {
        let url = '/api/financial-analyst/order-status-distribution';
        if (storeId) {
            url += '?store_id=' + storeId;
        }
        $.get(url, function(data) {
            const labels = data.map(item => item.orderstatus);
            const orderCounts = data.map(item => item.ordercount);

            const ctx = document.getElementById('orderStatusChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Order Status Distribution',
                        data: orderCounts,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: false,
                                min: 340000, // Set minimum limit
                                stepSize: 2000, // Set step size
                                fontColor: 'white' // Set y-axis tick color to white
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'Order Count',
                                fontColor: 'white' // Set y-axis label color to white
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                fontColor: 'white' // Set x-axis tick color to white
                            }
                        }]
                    },
                    plugins: {
                        legend: {
                            position: 'bottom', // Position the legend at the bottom
                            align: 'center',    // Align the legend items to center
                            labels: {
                                boxWidth: 10,
                                usePointStyle: true, // Use point style for legend items
                                padding: 20, // Adjust padding between legend items
                                fontColor: 'white' // Set font color for legend items
                            }
                        }
                    }
                }
            });
        });
    }

    // Fetch and display order volume over time line chart
    function fetchOrderVolumeOverTime(storeId = null) {
        let url = '/api/financial-analyst/order-volume-over-time';
        if (storeId) {
            url += '?store_id=' + storeId;
        }
        $.get(url, function(data) {
            const aggregatedData = aggregateDataFor3Months1(data); // Adjusted aggregation for 3 months
            const labels = aggregatedData.labels;
            const orderCounts = aggregatedData.orderCounts;

            const ctx = document.getElementById('orderVolumeChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Order Volume Over Time',
                        data: orderCounts,
                        borderColor: '#36A2EB',
                        fill: false,
                    }]
                },
                options: {
                    scales: {
                        xAxes: [{
                            type: 'time',
                            time: {
                                unit: 'month',
                                tooltipFormat: 'MMM YYYY',
                                displayFormats: {
                                    month: 'MMM YYYY'
                                },
                                unitStepSize: 6 // interval of 6 months
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'Month/Year',
                                fontColor: 'white' // Set x-axis label color to white
                            },
                            ticks: {
                                fontColor: 'white' // Set x-axis tick color to white
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: false,
                                min: 600,
                                fontColor: 'white' // Set y-axis tick color to white
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'Order Volume',
                                fontColor: 'white' // Set y-axis label color to white
                            }
                        }]
                    },
                    legend: {
                        labels: {
                            fontColor: 'white' // Set legend text color to white
                        }
                    }
                }
            });
        });
    }

    // Fetch and display profit by order date line chart
function fetchProfitByOrderDate(storeId = null) {
    let url = '/api/financial-analyst/profit-by-orderdate';
    if (storeId) {
        url += '?store_id=' + storeId;
    }
    $.get(url, function(data) {
        const aggregatedData = aggregateDataFor3Months(data); // Adjusted aggregation for 3 months
        const labels = aggregatedData.labels;
        const totalProfits = aggregatedData.totalProfits;

        const ctx = document.getElementById('profitOrderChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Profit by Order Date',
                    data: totalProfits,
                    borderColor: '#FF6384',
                    fill: false,
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'month',
                            tooltipFormat: 'MMM YYYY',
                            displayFormats: {
                                month: 'MMM YYYY'
                            },
                            unitStepSize: 6 // interval of 6 months
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Month/Year',
                            fontColor: 'white' // Set x-axis label color to white
                        },
                        ticks: {
                            fontColor: 'white' // Set x-axis tick color to white
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: false,
                            min: 600,
                            fontColor: 'white', // Set y-axis tick color to white
                            callback: function(value, index, values) {
                                return (value / 10000000).toFixed(2) ; // Convert to crores
                            }
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Total Profit (in Cr)',
                            fontColor: 'white' // Set y-axis label color to white
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let value = tooltipItem.yLabel;
                            return 'Profit: ' + (value / 10000000).toFixed(2) + ' Cr'; // Convert to crores
                        }
                    }
                },
                legend: {
                    labels: {
                        fontColor: 'white' // Set legend text color to white
                    }
                }
            }
        });
    });
}

    // Function to aggregate data for a 3-month interval (Profit by Order Date)
    function aggregateDataFor3Months(data) {
        const aggregatedData = {};
        data.forEach(item => {
            const date = new Date(item.orderdate);
            const yearMonth = date.getFullYear() + '-' + ('0' + (Math.floor(date.getMonth() / 3) * 3 + 1)).slice(-2); // Group by quarter
            if (!aggregatedData[yearMonth]) {
                aggregatedData[yearMonth] = 0;
            }
            aggregatedData[yearMonth] += item.totalprofit;
        });

        const labels = Object.keys(aggregatedData);
        const totalProfits = Object.values(aggregatedData);

        return { labels, totalProfits };
    }

    // Function to aggregate data for a 3-month interval (Order Volume)
    function aggregateDataFor3Months1(data) {
        const aggregatedData = {};
        data.forEach(item => {
            const date = new Date(item.orderdate);
            const yearMonth = date.getFullYear() + '-' + ('0' + (Math.floor(date.getMonth() / 3) * 3 + 1)).slice(-2); // Group by quarter
            if (!aggregatedData[yearMonth]) {
                aggregatedData[yearMonth] = 0;
            }
            aggregatedData[yearMonth] += item.ordercount;
        });

        const labels = Object.keys(aggregatedData);
        const orderCounts = Object.values(aggregatedData);

        return { labels, orderCounts };
    }

    // Initial fetch for charts
    fetchCustomerFeedback();
    fetchOrderStatusDistribution();
    fetchOrderVolumeOverTime();
    fetchProfitByOrderDate();

    // Fetch charts on store selection change
    $('#store-id').on('change', function() {
        const storeId = $(this).val();
        fetchCustomerFeedback(storeId);
        fetchOrderStatusDistribution(storeId);
        fetchOrderVolumeOverTime(storeId);
        fetchProfitByOrderDate(storeId);
    });
});

//Orders Page Sales Manager
// Fetch and display average order value over time line chart
function fetchAverageOrderValueOverTime() {
    $.get('api/sales-manager/average-order-value-over-time', function(data) {
        const labels = data.map(item => new Date(item.order_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        const averageOrderValues = data.map(item => item.average_order_value);

        const ctx = document.getElementById('averageOrderValueChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Order Value',
                    data: averageOrderValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false,
                            fontColor: 'white' // Set y-axis tick color
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Average Order Value',
                            fontColor: 'white' // Set y-axis label color
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontColor: 'white' // Set x-axis tick color
                        },
                        unitStepSize: 4
                    }]
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            fontColor: 'white' // Set legend label color
                        }
                    }
                }
            }
        });
    });
}

$(document).ready(function() {
    fetchAverageOrderValueOverTime();
  });

//Data Metrics Financial Analyst
// Function to fetch data from API and update graphs
async function fetchDataAndUpdateGraphs() {
    try {
        const response = await fetch('/api/financial-analyst/data-metrics');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const data = await response.json();

        // Update KPI values
        document.getElementById('total-sales').innerText = formatCurrency(data.kpi.total_sales);
        document.getElementById('total-profit').innerText = formatCurrency(data.kpi.total_profit);
        document.getElementById('total-orders').innerText = (data.kpi.total_orders / 100_000).toFixed(2) + 'L'; // Lakhs
        document.getElementById('total-shipping').innerText = formatCurrency(data.kpi.total_shipping);

        // Update Gross Margin
        if (typeof data.kpi.gross_margin === 'number' && !isNaN(data.kpi.gross_margin)) {
            document.getElementById('gross-margin').innerText = data.kpi.gross_margin.toFixed(2) + '%'; // Gross Margin
        } else {
            document.getElementById('gross-margin').innerText = 'N/A';
        }

        // Update Revenue Over Time chart
        updateRevenueOverTimeChart(data.revenue_over_time);

        // Update Sales by Region chart
        updateSalesByRegionChart(data.sales_by_region);

        // Update Profit Distribution by Category chart
        updateProfitDistributionChart(data.profit_distribution);

        // Update Profit Over Time chart
        updateProfitOverTimeChart(data.profit_over_time);

        // Update Revenue vs Profit by Product Category chart
        updateRevenueVsProfitByCategoryChart(data.revenue_vs_profit);
    } catch (error) {
        console.error('Error fetching or updating data:', error);
    }
}

// Function to format currency values in lakhs (1 lakh = 100,000)
function formatCurrency(value) {
    const valueInLakhs = value / 100_000;
    return '₹' + valueInLakhs.toFixed(2) + 'L';
}

// Update Revenue Over Time chart
function updateRevenueOverTimeChart(data) {
    const labels = data.map(entry => new Date(entry.month).toISOString().slice(0, 7)); // YYYY-MM format
    const revenueData = data.map(entry => entry.total_revenue / 10000000); // Convert to crores

    const ctx = document.getElementById('revenueOverTimeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue Over Time',
                data: revenueData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'MMM YYYY',
                        displayFormats: {
                            month: 'MMM YYYY'
                        },
                        unitStepSize: 6 // interval of 6 months
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Month/Year',
                        fontColor: 'white'
                    },
                    ticks: {
                        fontColor: 'white'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        fontColor: 'white',
                        callback: function(value) {
                            return value.toFixed(2); // Show two decimal places
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Revenue (in Crores)',
                        fontColor: 'white'
                    }
                }]
            },
            legend: {
                labels: {
                    fontColor: 'white'
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        let value = tooltipItem.yLabel;
                        return tooltipItem.label + ': ' + value.toFixed(2) + ' Crores'; // Format as Crores
                    }
                }
            }
        }
    });
}

// Update Sales by Region chart (Bar chart)
function updateSalesByRegionChart(data) {
    const labels = data.map(entry => entry.country);
    const salesData = data.map(entry => entry.total_sales / 10000000); // Convert to crores

    const ctx = document.getElementById('salesByRegionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales by Region',
                data: salesData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    ticks: {
                        fontColor: 'white' // Set x-axis tick color to white
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        min: 0, // Start y-axis from 0
                        fontColor: 'white',
                        callback: function(value) {
                            return value.toFixed(2); // Show two decimal places
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Sales (in Crores)',
                        fontColor: 'white' // Set y-axis label color to white
                    }
                }]
            },
            legend: {
                labels: {
                    fontColor: 'white' // Set legend text color to white
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        let value = tooltipItem.yLabel;
                        return tooltipItem.label + ': ' + value.toFixed(2) + ' Crores'; // Format as Crores
                    }
                }
            }
        }
    });
}

// Update Profit Distribution by Category chart
function updateProfitDistributionChart(data) {
    const labels = data.map(entry => entry.category);
    const profitData = data.map(entry => entry.total_profit / 10000000); // Convert to crores

    const ctx = document.getElementById('profitDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit Distribution by Category',
                data: profitData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'left',
                    align: 'start',
                    labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        padding: 20,
                        fontColor: 'white'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            let value = tooltipItem.raw;
                            return tooltipItem.label + ': ' + value.toFixed(2) + ' Cr'; // Display as crores
                        }
                    }
                }
            },
            layout: {
                padding: {
                    left: 50
                }
            }
        }
    });
}

// Update Profit Over Time chart
function updateProfitOverTimeChart(data) {
    const labels = data.map(entry => new Date(entry.month).toISOString().slice(0, 7)); // YYYY-MM format
    const profitData = data.map(entry => entry.total_profit / 10000000); // Convert to crores

    const ctx = document.getElementById('profitOverTimeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit Over Time',
                data: profitData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'MMM YYYY',
                        displayFormats: {
                            month: 'MMM YYYY'
                        },
                        unitStepSize: 6 // interval of 6 months
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Month/Year',
                        fontColor: 'white'
                    },
                    ticks: {
                        fontColor: 'white'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        fontColor: 'white',
                        callback: function(value) {
                            return value.toFixed(2); // Round off to 2 decimal places
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Profit (in Crores)',
                        fontColor: 'white'
                    }
                }]
            },
            legend: {
                labels: {
                    fontColor: 'white'
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        return tooltipItem.dataset.label + ': ' + tooltipItem.yLabel.toFixed(2) + ' Cr';
                    }
                }
            }
        }
    });
}

// Update Revenue vs Profit by Product Category chart
function updateRevenueVsProfitByCategoryChart(data) {
    const labels = data.map(entry => entry.category);
    const revenueData = data.map(entry => entry.total_revenue / 10000000); // Convert to crores
    const profitData = data.map(entry => entry.total_profit / 10000000); // Convert to crores

    const ctx = document.getElementById('revenueVsProfitByCategoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: revenueData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }, {
                label: 'Profit',
                data: profitData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    stacked: false,
                    ticks: {
                        fontColor: 'white'
                    }
                }],
                yAxes: [{
                    stacked: false,
                    ticks: {
                        beginAtZero: true,
                        fontColor: 'white',
                        callback: function(value) {
                            return value.toFixed(2); // Round off to 2 decimal places
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Revenue/Profit (in Crores)',
                        fontColor: 'white'
                    }
                }]
            },
            legend: {
                labels: {
                    fontColor: 'white'
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        return tooltipItem.dataset.label + ': ' + tooltipItem.yLabel.toFixed(2) + ' Cr';
                    }
                }
            }
        }
    });
}

// Function to generate random colors
function generateColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 75%)`;
        colors.push(color);
    }
    return colors;
}

// Call the function to fetch data and update graphs
fetchDataAndUpdateGraphs();

//Product Page Financial Analyst

$(document).ready(function () {
    // Task 3.1: Implement the product search bar to search by Product ID and update the Product Info Table.
    function searchProductById() {
        const productId = $('#product1-search').val();
        const storeId = $('#store-id').val(); // Assuming you have an input field for store ID

        if (productId) {
            const url = storeId ? `/api/product-info/${productId}?store_id=${storeId}` : `/api/product-info/${productId}`;

            $.get(url, function(data) {
                if (data.error) {
                    alert(data.error);  // Display an alert if product not found
                } else {
                    $('#product-id1').text(data.productid);
                    $('#product-name1').text(data.productname);
                    $('#category1').text(data.category);
                    $('#sub-category1').text(data.subcategory);
                    $('#unit-price1').text(data.unitprice +' '+ '₹');
                    $('#quantity1').text(data.quantity);
                    $('#Cost-of-Goods1').text(data.costofgoodssold);
                    $('#profit1').text(data.profit +' ' +'₹');
                }
            });
        } else {
            // Clear the product info table if no product ID is entered
            $('#product-id1').text('');
            $('#product-name1').text('');
            $('#category1').text('');
            $('#sub-category1').text('');
            $('#unit-price1').text('');
            $('#quantity1').text('');
            $('#Cost-of-Goods1').text('');
            $('#profit1').text('');
        }
    }
    
    // Task 3.3: Develop a pie chart for Customer Feedback analysis, filtering by StoreID.
    function fetchCustomerFeedbackPieChart(storeId = null) {
        let url = '/api/financial-analyst/customer-feedback';
        if (storeId) {
            url += '?store_id=' + storeId;
        }
        $.get(url, function(data) {
            const labels = data.map(item => item.customerfeedback);
            const feedbackCounts = data.map(item => item.feedbackcount);
    
            const ctx = document.getElementById('customerFeedbackPieChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Customer Feedback',
                        data: feedbackCounts,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)'
                            // Add more colors as needed
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'left', // Position on the left side
                            align: 'start', // Align the legend items at the start
                            labels: {
                                boxWidth: 10,
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        }
                    }
                }
            });
        });
    }
    
    // Task 3.4: Create a table for Top Products, filtering by StoreID.
function fetchTopProductsTable(storeId = null) {
    const url = '/api/top-products';

    $.get(url, function(data) {
        const tbody = $('#top-products-table1 tbody');
        tbody.empty();  // Clear any existing rows

        data.forEach((item, index) => {
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.productname}</td>
                    <td>${item.category}</td>
                    <td>${item.totalprice} ₹</td>
                </tr>
            `;
            tbody.append(row);
        });
    });
}


    // Task 3.5: Implement a bar chart for Profit by Category, filtering by StoreID.
    function fetchProfitByCategoryBarChart(storeId = null) {
        let url = '/api/financial-analyst/profit-by-category';
        if (storeId) {
            url += '?store_id=' + storeId;
        }
        $.get(url, function(data) {
            const labels = data.map(item => item.category);
            const profitData = data.map(item => item.total_profit);

            const ctx = document.getElementById('profitByCategoryBarChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Profit by Category',
                        data: profitData,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                            // Add more colors as needed
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                            // Add more colors as needed
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        xAxes: [{
                            ticks: {
                                fontColor: '#ffffff', // Set x-axis tick color to white
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                fontColor: '#ffffff', // Set y-axis tick color to white
                            }
                        }]
                    }
                }
            });
        });
    }

    // Task 3.6: Develop a bar chart for Profit by Product, filtering by StoreID.
    function fetchProfitByProductBarChart(storeId = null) {
        let url = '/api/financial-analyst/profit-by-product';
        if (storeId) {
            url += '?store_id=' + storeId;
        }
        $.get(url, function(data) {
            const labels = data.map(item => item.productname);
            const profitData = data.map(item => item.total_profit);

            const ctx = document.getElementById('profitByProductBarChartFA').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Profit by Product',
                        data: profitData,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        xAxes: [{
                            ticks: {
                                fontColor: '#ffffff', // Set x-axis tick color to white
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                fontColor: '#ffffff', // Set y-axis tick color to white
                            }
                        }]
                    }
                }
            });
        });
    }

    // Task 3.1: Implement product search functionality on button click
    $(document).ready(function() {
        $('#search-button1').click(searchProductById);
    });
    
    
      // Trigger search on button click
      $('#search-button1').on('click', function() {
        searchProductById();
      });
    
    // Task 3.3: Fetch customer feedback pie chart on page load
    fetchCustomerFeedbackPieChart();

    // Task 3.4: Fetch top products table on page load
    fetchTopProductsTable();

    // Task 3.5: Fetch profit by category bar chart on page load
    fetchProfitByCategoryBarChart();

    // Task 3.6: Fetch profit by product bar chart on page load
    fetchProfitByProductBarChart();

    // Optional: Implement chart refresh on store selection change
    $('#store-id').on('change', function() {
        const storeId = $(this).val();
        fetchCustomerFeedbackPieChart(storeId);
        fetchTopProductsTable(storeId);
        fetchProfitByCategoryBarChart(storeId);
        fetchProfitByProductBarChart(storeId);
    });
});

//Product Page Sales Manager
function fetchProductInfo() {
    const productId = $('#product-search').val();
    const storeId = $('#store-id').val(); // Assuming you have an input field for store ID

    if (productId) {
        const url = storeId ? `/api/product-info/${productId}?store_id=${storeId}` : `/api/product-info/${productId}`;

        $.get(url, function(data) {
            if (data.error) {
                alert(data.error);  // Display an alert if product not found
            } else {
                $('#product-id').text(data.productid);
                $('#product-name').text(data.productname);
                $('#category').text(data.category);
                $('#sub-category').text(data.subcategory);
                $('#unit-price').text(data.unitprice + ' ' + '₹');
                $('#quantity').text(data.quantity);
                $('#Cost-of-Goods').text(data.costofgoodssold);
                $('#profit').text(data.profit + ' ' + '₹');
            }
        });
    } else {
        // Clear the product info table if no product ID is entered
        $('#product-id').text('');
        $('#product-name').text('');
        $('#category').text('');
        $('#sub-category').text('');
        $('#unit-price').text('');
        $('#quantity').text('');
        $('#Cost-of-Goods').text('');
        $('#profit').text('');
    }
}

$(document).ready(function() {
    $('#search-button').click(fetchProductInfo);
});


  // Trigger search on button click
  $('#search-button').on('click', function() {
      fetchProductInfo();
  });

  function fetchCustomerFeedback() {
    const url = '/api/sales-manager/customer-feedback';
    $.get(url, function(data) {
        const labels = data.map(item => item.customerfeedback);
        const feedbackCounts = data.map(item => item.feedbackcount);

        const ctx = document.getElementById('customerFeedback').getContext('2d'); // Corrected ID
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Customer Feedback',
                    data: feedbackCounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                        // Add more colors as needed
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'left', // Position on the left side
                        align: 'start', // Align the legend items at the start
                        labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    });
}

$(document).ready(function() {
    fetchCustomerFeedback();
});




  // Fetch and display profit by product category and subcategory chart
  function fetchTopProducts() {
    const url = '/api/top-products';

    $.get(url, function(data) {
        const tbody = $('#top1-products-table tbody');
        tbody.empty();  // Clear any existing rows

        data.forEach((item, index) => {
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.productname}</td>
                    <td>${item.category}</td>
                    <td>${item.totalprice} ₹</td>
                </tr>
            `;
            tbody.append(row);
        });
    });
}

$(document).ready(function() {
    fetchTopProducts();  // Fetch top products when the page loads
});
// Predefined set of vibrant colors
const colors = [
  'rgba(255, 99, 132, 0.6)',
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)',
  'rgba(255, 159, 64, 0.6)'
];

function getRandomColor(index) {
  return colors[index % colors.length];
}

function fetchProfitByProductChart() {
  let url = '/api/sales-manager/revenue_over_time';

  $.get(url, function(data) {
      const categories = [...new Set(data.map(item => item.category))];
      const subcategories = [...new Set(data.map(item => item.subcategory))];
      const dataset = subcategories.map((subcat, index) => {
          return {
              label: subcat,
              data: categories.map(cat => {
                  const item = data.find(d => d.category === cat && d.subcategory === subcat);
                  return item ? item.totalprofit : 0;
              }),
              backgroundColor: getRandomColor(index),
              borderColor: getRandomColor(index),
              borderWidth: 1
          };
      });

      const ctx = document.getElementById('profitByProductBarChart1').getContext('2d');
      new Chart(ctx, {
          type: 'bar',
          data: {
              labels: categories,
              datasets: dataset
          },
          options: {
              scales: {
                  x: {
                      stacked: true
                  },
                  y: {
                      stacked: true,
                      beginAtZero: true
                  }
              },
              plugins: {
                  legend: {
                      display: true,
                      position: 'top',
                      align: 'start'
                  }
              },
              responsive: true,
              maintainAspectRatio: false
          }
      });
  });
}

function fetchSalesByProductChart() {
  const url = '/api/sales-manager/sales-by-category';

  $.get(url, function(data) {
      const categories = [...new Set(data.map(item => item.category))];
      const subcategories = [...new Set(data.map(item => item.subcategory))];
      const dataset = subcategories.map((subcat, index) => {
          return {
              label: subcat,
              data: categories.map(cat => {
                  const item = data.find(d => d.category === cat && d.subcategory === subcat);
                  return item ? item.totalsales : 0;
              }),
              backgroundColor: getRandomColor(index),
              borderColor: getRandomColor(index),
              borderWidth: 1
          };
      });

      const ctx = document.getElementById('salesByProductBarChart').getContext('2d');
      new Chart(ctx, {
          type: 'bar',
          data: {
              labels: categories,
              datasets: dataset
          },
          options: {
              scales: {
                  x: {
                      stacked: true
                  },
                  y: {
                      stacked: true,
                      beginAtZero: true
                  }
              },
              plugins: {
                  legend: {
                      display: true,
                      position: 'top',
                      align: 'start'
                  }
              },
              responsive: true,
              maintainAspectRatio: false
          }
      });
  });
}

$(document).ready(function() {
  fetchProfitByProductChart();
  fetchSalesByProductChart();
});

// code from -13/07/24

//Data Metric Page Sales Manager

document.addEventListener('DOMContentLoaded', function() {
    fetchKPIValues();
    fetchCustomerFeedback1();
    fetchRevenueOverTimeChart1();
    fetchSalesByProductChart1();
    fetchOrderStatusDistributionPieChart1();
    fetchProfitMarginOverTimeChart1();
    fetchTopProducts1();
});

async function fetchKPIValues() {
    try {
        const response = await fetch('/api/kpi-values');
        const data = await response.json();

        document.getElementById('total-sales1').innerText = formatCurrencyInLakhs(data[0].total_sales);
        document.getElementById('total-profit1').innerText = formatCurrencyInLakhs(data[0].total_profit);
        document.getElementById('total-orders1').innerText = formatNumberInLakhs(data[0].total_orders);
        document.getElementById('gross-margin1').innerText = ((data[0].total_profit / data[0].total_sales) * 100).toFixed(2) + '%';

    } catch (error) {
        console.error('Error fetching KPI values:', error);
    }
}

async function fetchCustomerFeedback1() {
    const url = '/api/sales-manager/customer-feedback';
    $.get(url, function(data) {
        const labels = data.map(item => item.customerfeedback);
        const feedbackCounts = data.map(item => item.feedbackcount);

        const ctx = document.getElementById('customerFeedbackChart1').getContext('2d'); // Corrected ID
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Customer Feedback',
                    data: feedbackCounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                        // Add more colors as needed
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'left', // Position on the left side
                        align: 'start', // Align the legend items at the start
                        labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    });
}

async function fetchRevenueOverTimeChart1() {
    try {
        const response = await fetch('/api/sales-manager/sales-over-time');
        const data = await response.json();

        const filteredData = data.filter((_, index) => index % 6 === 0); // Keep every 6th data point

        const revenueData = {
            labels: filteredData.map(item => {
                const date = new Date(item.orderdate);
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });  // Format as "Mon YYYY"
            }),
            datasets: [{
                label: 'Revenue',
                data: filteredData.map(item => item.totalsales),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false,
                tension: 0.1
            }]
        };

        const config = {
            type: 'line',
            data: revenueData,
            options: {
                maintainAspectRatio: false,  // Ensure this line is present
                scales: {
                    x: {
                        type: 'category',  // Ensure the x-axis is of type category
                        ticks: {
                            autoSkip: false,  // Disable auto-skip to manage tick spacing manually
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrencyInLakhs(value);
                            },
                        }
                    }
                }
            }
        };

        const ctx = document.getElementById('revenueovertimechart1').getContext('2d');
        ctx.canvas.height = 300; // Set the height of the canvas
        new Chart(ctx, config);

    } catch (error) {
        console.error('Error fetching revenue over time:', error);
    }
}

function formatCurrencyInLakhs(value) {
    value = value / 100000; // Convert to lakhs
    return '₹' + value.toFixed(2) + ' L';
}


async function fetchSalesByProductChart1() {
    const url = '/api/sales-manager/sales-by-category';

  $.get(url, function(data) {
      const categories = [...new Set(data.map(item => item.category))];
      const subcategories = [...new Set(data.map(item => item.subcategory))];
      const dataset = subcategories.map((subcat, index) => {
          return {
              label: subcat,
              data: categories.map(cat => {
                  const item = data.find(d => d.category === cat && d.subcategory === subcat);
                  return item ? item.totalsales : 0;
              }),
              backgroundColor: getRandomColor(index),
              borderColor: getRandomColor(index),
              borderWidth: 1
          };
      });

      const ctx = document.getElementById('salesByProductBarChart1').getContext('2d');
      new Chart(ctx, {
          type: 'bar',
          data: {
              labels: categories,
              datasets: dataset
          },
          options: {
              scales: {
                  x: {
                      stacked: true
                  },
                  y: {
                      stacked: true,
                      beginAtZero: true
                  }
              },
              plugins: {
                  legend: {
                      display: true,
                      position: 'top',
                      align: 'start'
                  }
              },
              responsive: true,
              maintainAspectRatio: false
          }
      });
  });
}

// Fetch and display profit by product category and subcategory chart
async function fetchTopProducts1() {
    const url = '/api/top-products';

    $.get(url, function(data) {
        const tbody = $('#top-products-table tbody');
        tbody.empty();  // Clear any existing rows

        data.forEach((item, index) => {
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.productname}</td>
                    <td>${item.category}</td>
                    <td>${item.totalprice} ₹</td>
                </tr>
            `;
            tbody.append(row);
        });
    });
}


async function fetchOrderStatusDistributionPieChart1() {
    try {
        const response = await fetch('/api/sales-manager/order-status-distribution');
        const data = await response.json();

        const statusData = {
            labels: data.map(item => item.orderstatus),
            datasets: [{
                label: 'Order Status',
                data: data.map(item => item.ordercount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        };

        const config = {
            type: 'pie',
            data: statusData,
            options: {}
        };

        const ctx = document.getElementById('orderStatusChart1').getContext('2d');
        new Chart(ctx, config);

    } catch (error) {
        console.error('Error fetching order status distribution:', error);
    }
}

async function fetchProfitMarginOverTimeChart1() {
    try {
        const response = await fetch('/api/sales-manager/profit-margin-over-time');
        const data = await response.json();

        const filteredData = data.filter((_, index) => index % 6 === 0); // Keep every 6th data point

        const profitData = {
            labels: filteredData.map(item => {
                const date = new Date(item.orderdate);
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });  // Format as "Mon YYYY"
            }),
            datasets: [{
                label: 'Profit Margin',
                data: filteredData.map(item => item.totalprofit),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: false,
                tension: 0.1
            }]
        };

        const config = {
            type: 'line',
            data: profitData,
            options: {
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',  // Ensure the x-axis is of type category
                        ticks: {
                            autoSkip: false,  // Disable auto-skip to manage tick spacing manually
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrencyInLakhs(value);
                            }
                        }
                    }
                }
            }
        };

        const ctx = document.getElementById('profitMarginOverTimeChart1').getContext('2d');
        new Chart(ctx, config);

    } catch (error) {
        console.error('Error fetching profit margin over time:', error);
    }
}

function formatCurrencyInLakhs(value) {
    value = value / 100000; // Convert to lakhs
    return '₹' + value.toFixed(2) + ' L';
}

function formatNumberInLakhs(value) {
    value = value / 100000; // Convert to lakhs
    return value.toFixed(2) + ' L';
}  
//for the reports page --14-0-24
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners for filter changes, pagination, and export options
    document.getElementById('time-period').addEventListener('change', applyFilters);
    document.getElementById('category').addEventListener('change', applyFilters);
    document.getElementById('product-name').addEventListener('change', applyFilters);
    document.getElementById('salesperson-name').addEventListener('change', applyFilters);
    document.getElementById('order-status').addEventListener('change', applyFilters);
    document.getElementById('price-range').addEventListener('change', applyFilters);
    document.getElementById('discount').addEventListener('change', applyFilters);
    document.getElementById('sales-by-product').addEventListener('change', applyFilters);
    document.getElementById('profit').addEventListener('change', applyFilters);
    document.getElementById('store-location').addEventListener('change', applyFilters);
    document.getElementById('store-performance').addEventListener('change', applyFilters);
    document.getElementById('shipping-cost').addEventListener('change', applyFilters);
    document.getElementById('payment-method').addEventListener('change', applyFilters);

    // Initialize pagination and export options
    updatePagination();
});

function applyFilters() {
    // Collect all the selected filter values
    var timePeriod = document.getElementById('time-period').value;
    var category = document.getElementById('category').value;
    var productName = document.getElementById('product-name').value;
    var salespersonName = document.getElementById('salesperson-name').value;
    var orderStatus = document.getElementById('order-status').value;
    var priceRange = document.getElementById('price-range').value;
    var discount = document.getElementById('discount').value;
    var salesByProduct = document.getElementById('sales-by-product').value;
    var profit = document.getElementById('profit').value;
    var storeLocation = document.getElementById('store-location').value;
    var storePerformance = document.getElementById('store-performance').value;
    var shippingCost = document.getElementById('shipping-cost').value;
    var paymentMethod = document.getElementById('payment-method').value;

    // Prepare the data object to send to the server
    var filterData = {
        timePeriod: timePeriod,
        category: category,
        productName: productName,
        salespersonName: salespersonName,
        orderStatus: orderStatus,
        priceRange: priceRange,
        discount: discount,
        salesByProduct: salesByProduct,
        profit: profit,
        storeLocation: storeLocation,
        storePerformance: storePerformance,
        shippingCost: shippingCost,
        paymentMethod: paymentMethod
    };

    // Send the AJAX request to the server
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/apply-filters', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            // Update the report table with the filtered data
            updateReportTable(response.data);
            // Update the pagination controls
            updatePagination(response.totalRecords);
        }
    };
    xhr.send(JSON.stringify(filterData));
}

function updatePagination(totalRecords) {
    // Calculate the total number of pages
    var rowsPerPage = parseInt(document.getElementById('rows-per-page').value);
    var totalPages = Math.ceil(totalRecords / rowsPerPage);

    // Update the page navigation controls
    document.getElementById('page-number').textContent = currentPage;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;

    // Update the "Records Found" display
    document.getElementById('records-found').textContent = 'Records Found: ' + totalRecords;
}

function exportData(format) {
    // Collect the current filter settings
    var filterData = getFilterData(); // This function should collect all filter settings

    // Send the AJAX request to the server for export
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/export-data', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            // Handle the exported data (e.g., open a new window with the exported file)
            var exportUrl = response.exportUrl;
            window.open(exportUrl, '_blank');
        }
    };
    xhr.send(JSON.stringify({ format: format, filterData: filterData }));
}

// Function to toggle the custom date inputs
function toggleCustomDate() {
    var timePeriod = document.getElementById('time-period').value;
    if (timePeriod === 'custom-date') {
        document.getElementById('custom-date').style.display = 'block';
    } else {
        document.getElementById('custom-date').style.display = 'none';
    }
}

// Initialize the custom date toggle
toggleCustomDate();

function changePage(direction) {
    var currentPage = parseInt(document.getElementById('page-number').textContent);
    var newPage = currentPage + direction;

    // Fetch the data for the new page
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/get-page-data?page=' + newPage, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            // Update the report table with the new page data
            updateReportTable(response.data);
            // Update the pagination controls
            updatePagination(response.totalRecords);
        }
    };
    xhr.send();
}

//for getting the name of the store for sales-manager name box header part 14-07-24
document.addEventListener('DOMContentLoaded', function() {
    // Assuming you have a function to fetch the store info from the server
    function getStoreInfo() {
        // Send an AJAX request to the server to get the store info
        // For example, using the Fetch API
        fetch('/get-store-info', {
            method: 'GET',
            credentials: 'include' // If you need cookies for authentication
        })
        .then(response => response.json())
        .then(data => {
            // Update the store info in the navbar
            document.getElementById('store-info').textContent = data.storeName + ' (' + data.storeId + ')';
        })
        .catch(error => {
            console.error('Error fetching store info:', error);
        });
    }

    // Call the function to get the store info when the page loads
    getStoreInfo();
});