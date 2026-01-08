const ChartRenderer = {
    charts: {},

    defaultOptions: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#000000',
                borderColor: '#333333',
                borderWidth: 1,
                titleColor: '#ffffff',
                bodyColor: '#888888',
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return context.parsed.y.toLocaleString();
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: '#1a1a1a',
                    drawBorder: false
                },
                ticks: {
                    color: '#666666',
                    font: {
                        size: 11,
                        family: "'SF Mono', monospace"
                    }
                }
            },
            y: {
                grid: {
                    color: '#1a1a1a',
                    drawBorder: false
                },
                ticks: {
                    color: '#666666',
                    font: {
                        size: 11,
                        family: "'SF Mono', monospace"
                    }
                }
            }
        }
    },

    renderRevenueChart(data) {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    data: data.map(d => d.revenue / 1000000),
                    borderColor: '#0070f3',
                    backgroundColor: 'rgba(0, 112, 243, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#0070f3',
                    pointBorderColor: '#000000',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        ticks: {
                            ...this.defaultOptions.scales.y.ticks,
                            callback: function(value) {
                                return '$' + value.toFixed(1) + 'M';
                            }
                        }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    tooltip: {
                        ...this.defaultOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return '$' + context.parsed.y.toFixed(2) + 'M';
                            }
                        }
                    }
                }
            }
        });
    },

    renderOrdersChart(data) {
        const ctx = document.getElementById('orders-chart');
        if (!ctx) return;

        if (this.charts.orders) {
            this.charts.orders.destroy();
        }

        this.charts.orders = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    data: data.map(d => d.orders),
                    backgroundColor: '#00ff00',
                    borderWidth: 0
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        ticks: {
                            ...this.defaultOptions.scales.y.ticks,
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    },

    renderDeliveryChart(onTimeRate) {
        const ctx = document.getElementById('delivery-chart');
        if (!ctx) return;

        if (this.charts.delivery) {
            this.charts.delivery.destroy();
        }

        const lateRate = 100 - onTimeRate;

        this.charts.delivery = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['On-time', 'Late'],
                datasets: [{
                    data: [onTimeRate, lateRate],
                    backgroundColor: ['#00ff00', '#ff0000'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#888888',
                            font: {
                                size: 12,
                                family: "'SF Mono', monospace"
                            },
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        ...this.defaultOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.toFixed(2) + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    renderLeadTimeChart(data) {
        const ctx = document.getElementById('leadtime-chart');
        if (!ctx) return;

        if (this.charts.leadtime) {
            this.charts.leadtime.destroy();
        }

        this.charts.leadtime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.range),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: '#ffff00',
                    borderWidth: 0
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    x: {
                        ...this.defaultOptions.scales.x,
                        ticks: {
                            ...this.defaultOptions.scales.x.ticks,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },

    renderSatisfactionChart(data) {
        const ctx = document.getElementById('satisfaction-chart');
        if (!ctx) return;

        if (this.charts.satisfaction) {
            this.charts.satisfaction.destroy();
        }

        const colors = ['#ff0000', '#ff6b00', '#ffff00', '#00ff00', '#00ff00'];

        this.charts.satisfaction = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.score),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    x: {
                        ...this.defaultOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Rating',
                            color: '#666666',
                            font: {
                                size: 11,
                                family: "'SF Mono', monospace"
                            }
                        }
                    },
                    y: {
                        ...this.defaultOptions.scales.y,
                        ticks: {
                            ...this.defaultOptions.scales.y.ticks,
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    },

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
};
