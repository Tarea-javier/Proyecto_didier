const App = {
    kpis: null,

    async init() {
        this.updateStatus('Loading data', 'loading');
        
        try {
            const data = await DataProcessor.loadAllData();
            this.updateStatus('Processing', 'loading');
            
            this.kpis = KPIEngine.calculate(data);
            this.updateStatus('Active', 'success');
            
            this.render();
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateStatus('Error', 'error');
            this.showError(error.message);
        }
    },

    render() {
        this.renderCoreKPIs();
        this.renderTemporalCharts();
        this.renderGeographicMetrics();
        this.renderCategoryMetrics();
        this.renderOperationalMetrics();
    },

    renderCoreKPIs() {
        const { totalGMV, totalOrders, avgOrderValue, uniqueCustomers } = this.kpis.core;

        document.getElementById('kpi-gmv').textContent = 
            KPIEngine.formatCurrency(totalGMV / 1000000) + 'M';
        
        document.getElementById('kpi-orders').textContent = 
            KPIEngine.formatNumber(totalOrders);
        
        document.getElementById('kpi-aov').textContent = 
            KPIEngine.formatCurrency(avgOrderValue);
        
        document.getElementById('kpi-customers').textContent = 
            KPIEngine.formatNumber(uniqueCustomers);
    },

    renderTemporalCharts() {
        const { monthly } = this.kpis.temporal;
        ChartRenderer.renderRevenueChart(monthly);
        ChartRenderer.renderOrdersChart(monthly);
    },

    renderGeographicMetrics() {
        const { top10 } = this.kpis.geographic;
        const tbody = document.querySelector('#states-table tbody');
        
        tbody.innerHTML = top10.map(state => `
            <tr>
                <td>${state.state}</td>
                <td class="text-right">${KPIEngine.formatCurrency(state.revenue / 1000)}K</td>
                <td class="text-right">${KPIEngine.formatNumber(state.orders)}</td>
            </tr>
        `).join('');
    },

    renderCategoryMetrics() {
        const { top10 } = this.kpis.categories;
        const tbody = document.querySelector('#categories-table tbody');
        
        tbody.innerHTML = top10.map(category => `
            <tr>
                <td>${category.category}</td>
                <td class="text-right">${KPIEngine.formatCurrency(category.revenue / 1000)}K</td>
                <td class="text-right">${KPIEngine.formatNumber(category.items)}</td>
            </tr>
        `).join('');
    },

    renderOperationalMetrics() {
        const { onTimeRate, avgLeadTime, avgReviewScore, reviewDistribution, leadTimeDistribution } = this.kpis.operational;

        document.getElementById('ontime-rate').textContent = 
            KPIEngine.formatPercent(onTimeRate);
        
        document.getElementById('lead-time-avg').textContent = 
            avgLeadTime.toFixed(1);
        
        document.getElementById('review-avg').textContent = 
            avgReviewScore.toFixed(2);

        ChartRenderer.renderDeliveryChart(onTimeRate);
        ChartRenderer.renderLeadTimeChart(leadTimeDistribution);
        ChartRenderer.renderSatisfactionChart(reviewDistribution);
    },

    updateStatus(text, type) {
        const statusEl = document.getElementById('data-status');
        if (!statusEl) return;

        statusEl.textContent = text;
        statusEl.className = 'status';
        
        if (type === 'success') {
            statusEl.style.color = 'var(--status-success)';
        } else if (type === 'error') {
            statusEl.style.color = 'var(--status-error)';
        } else if (type === 'loading') {
            statusEl.style.color = 'var(--status-warning)';
        }
    },

    showError(message) {
        const container = document.querySelector('.container');
        const errorEl = document.createElement('div');
        errorEl.className = 'error';
        errorEl.textContent = `Error: ${message}`;
        container.insertBefore(errorEl, container.firstChild);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
