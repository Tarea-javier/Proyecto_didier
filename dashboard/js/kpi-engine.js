const KPIEngine = {
    calculate(data) {
        const orders = DataProcessor.getOrdersWithCustomers();
        const items = DataProcessor.getOrderItemsWithProducts();

        return {
            core: this.calculateCoreKPIs(orders, data),
            temporal: this.calculateTemporalMetrics(orders),
            geographic: this.calculateGeographicMetrics(orders),
            categories: this.calculateCategoryMetrics(items),
            operational: this.calculateOperationalMetrics(orders, data)
        };
    },

    calculateCoreKPIs(orders, data) {
        const totalGMV = orders.reduce((sum, order) => sum + (order.payment_value || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalGMV / totalOrders : 0;
        
        const uniqueCustomers = new Set(
            data.customers.map(c => c.customer_unique_id)
        ).size;

        return {
            totalGMV,
            totalOrders,
            avgOrderValue,
            uniqueCustomers,
            ordersPerCustomer: totalOrders / uniqueCustomers
        };
    },

    calculateTemporalMetrics(orders) {
        const monthly = DataProcessor.groupByMonth(orders);
        
        const monthlyData = monthly.map(m => ({
            month: m.month,
            revenue: m.orders.reduce((sum, o) => sum + (o.payment_value || 0), 0),
            orders: m.orders.length,
            avgOrderValue: m.orders.length > 0 ? 
                m.orders.reduce((sum, o) => sum + (o.payment_value || 0), 0) / m.orders.length : 0
        }));

        const growthRates = [];
        for (let i = 1; i < monthlyData.length; i++) {
            const prev = monthlyData[i - 1].revenue;
            const curr = monthlyData[i].revenue;
            growthRates.push(prev > 0 ? ((curr - prev) / prev) * 100 : 0);
        }

        return {
            monthly: monthlyData,
            growthRates,
            avgGrowthRate: growthRates.length > 0 ? 
                growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0
        };
    },

    calculateGeographicMetrics(orders) {
        const byState = DataProcessor.groupByState(orders);
        
        const stateMetrics = byState.map(s => ({
            state: s.state,
            revenue: s.orders.reduce((sum, o) => sum + (o.payment_value || 0), 0),
            orders: s.orders.length,
            avgOrderValue: s.orders.length > 0 ? 
                s.orders.reduce((sum, o) => sum + (o.payment_value || 0), 0) / s.orders.length : 0
        })).sort((a, b) => b.revenue - a.revenue);

        const totalRevenue = stateMetrics.reduce((sum, s) => sum + s.revenue, 0);
        
        return {
            byState: stateMetrics,
            top10: stateMetrics.slice(0, 10),
            concentration: stateMetrics.slice(0, 3).reduce((sum, s) => sum + s.revenue, 0) / totalRevenue * 100
        };
    },

    calculateCategoryMetrics(items) {
        const byCategory = DataProcessor.groupByCategory(items);
        
        const categoryMetrics = byCategory.map(c => ({
            category: c.category,
            revenue: c.items.reduce((sum, i) => sum + (i.price || 0), 0),
            items: c.items.length,
            avgPrice: c.items.length > 0 ? 
                c.items.reduce((sum, i) => sum + (i.price || 0), 0) / c.items.length : 0
        })).sort((a, b) => b.revenue - a.revenue);

        return {
            byCategory: categoryMetrics,
            top10: categoryMetrics.slice(0, 10)
        };
    },

    calculateOperationalMetrics(orders, data) {
        const validLeadTimes = orders
            .filter(o => o.lead_time_days !== null && o.lead_time_days >= 0)
            .map(o => o.lead_time_days);

        const avgLeadTime = validLeadTimes.length > 0 ? 
            validLeadTimes.reduce((a, b) => a + b, 0) / validLeadTimes.length : 0;

        const onTimeOrders = orders.filter(o => o.on_time === true).length;
        const totalWithDelivery = orders.filter(o => o.on_time !== null).length;
        const onTimeRate = totalWithDelivery > 0 ? (onTimeOrders / totalWithDelivery) * 100 : 0;

        const reviews = data.reviews.filter(r => r.review_score);
        const avgReviewScore = reviews.length > 0 ? 
            reviews.reduce((sum, r) => sum + r.review_score, 0) / reviews.length : 0;

        const reviewDistribution = [1, 2, 3, 4, 5].map(score => ({
            score,
            count: reviews.filter(r => r.review_score === score).length
        }));

        const leadTimeDistribution = this.createHistogram(validLeadTimes, 0, 50, 10);

        return {
            avgLeadTime,
            onTimeRate,
            onTimeOrders,
            totalWithDelivery,
            avgReviewScore,
            reviewDistribution,
            leadTimeDistribution
        };
    },

    createHistogram(data, min, max, bins) {
        const binSize = (max - min) / bins;
        const histogram = Array(bins).fill(0);

        data.forEach(value => {
            if (value >= min && value <= max) {
                const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
                histogram[binIndex]++;
            }
        });

        return histogram.map((count, i) => ({
            range: `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`,
            count
        }));
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },

    formatNumber(value) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },

    formatPercent(value) {
        return `${value.toFixed(2)}%`;
    }
};
