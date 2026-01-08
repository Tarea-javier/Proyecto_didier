const DataProcessor = {
    data: {
        orders: [],
        customers: [],
        orderItems: [],
        payments: [],
        products: [],
        reviews: [],
        translation: []
    },

    async loadAllData() {
        const files = [
            { name: 'orders', path: 'data/olist_orders_dataset.csv' },
            { name: 'customers', path: 'data/olist_customers_dataset.csv' },
            { name: 'orderItems', path: 'data/olist_order_items_dataset.csv' },
            { name: 'payments', path: 'data/olist_order_payments_dataset.csv' },
            { name: 'products', path: 'data/olist_products_dataset.csv' },
            { name: 'reviews', path: 'data/olist_order_reviews_dataset.csv' },
            { name: 'translation', path: 'data/product_category_name_translation.csv' }
        ];

        const promises = files.map(file => this.loadCSV(file.name, file.path));
        await Promise.all(promises);
        this.processData();
        return this.data;
    },

    loadCSV(name, path) {
        return new Promise((resolve, reject) => {
            Papa.parse(path, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    this.data[name] = results.data;
                    resolve();
                },
                error: (error) => {
                    console.error(`Error loading ${name}:`, error);
                    reject(error);
                }
            });
        });
    },

    processData() {
        this.processOrders();
        this.mergeTranslations();
    },

    processOrders() {
        this.data.orders = this.data.orders.map(order => {
            const purchase = new Date(order.order_purchase_timestamp);
            const delivered = new Date(order.order_delivered_customer_date);
            const estimated = new Date(order.order_estimated_delivery_date);

            return {
                ...order,
                purchase_date: purchase,
                delivered_date: delivered,
                estimated_date: estimated,
                year: purchase.getFullYear(),
                month: purchase.getMonth() + 1,
                year_month: `${purchase.getFullYear()}-${String(purchase.getMonth() + 1).padStart(2, '0')}`,
                lead_time_days: delivered && !isNaN(delivered) ? 
                    (delivered - purchase) / (1000 * 60 * 60 * 24) : null,
                on_time: delivered && estimated && !isNaN(delivered) && !isNaN(estimated) ? 
                    delivered <= estimated : null
            };
        }).filter(order => order.order_status === 'delivered');
    },

    mergeTranslations() {
        const translationMap = {};
        this.data.translation.forEach(item => {
            translationMap[item.product_category_name] = item.product_category_name_english;
        });

        this.data.products = this.data.products.map(product => ({
            ...product,
            category_english: translationMap[product.product_category_name] || product.product_category_name
        }));
    },

    getOrdersWithPayments() {
        const paymentsByOrder = {};
        this.data.payments.forEach(payment => {
            if (!paymentsByOrder[payment.order_id]) {
                paymentsByOrder[payment.order_id] = 0;
            }
            paymentsByOrder[payment.order_id] += payment.payment_value;
        });

        return this.data.orders.map(order => ({
            ...order,
            payment_value: paymentsByOrder[order.order_id] || 0
        }));
    },

    getOrdersWithCustomers() {
        const customerMap = {};
        this.data.customers.forEach(customer => {
            customerMap[customer.customer_id] = customer;
        });

        return this.getOrdersWithPayments().map(order => ({
            ...order,
            customer_state: customerMap[order.customer_id]?.customer_state,
            customer_city: customerMap[order.customer_id]?.customer_city
        }));
    },

    getOrderItemsWithProducts() {
        const productMap = {};
        this.data.products.forEach(product => {
            productMap[product.product_id] = product;
        });

        return this.data.orderItems.map(item => ({
            ...item,
            category: productMap[item.product_id]?.category_english,
            product_name: productMap[item.product_id]?.product_category_name
        }));
    },

    groupByMonth(orders) {
        const grouped = {};
        orders.forEach(order => {
            const key = order.year_month;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(order);
        });
        return Object.keys(grouped).sort().map(key => ({
            month: key,
            orders: grouped[key]
        }));
    },

    groupByState(orders) {
        const grouped = {};
        orders.forEach(order => {
            const state = order.customer_state;
            if (!state) return;
            if (!grouped[state]) {
                grouped[state] = [];
            }
            grouped[state].push(order);
        });
        return Object.entries(grouped).map(([state, orders]) => ({
            state,
            orders
        }));
    },

    groupByCategory(items) {
        const grouped = {};
        items.forEach(item => {
            const category = item.category || 'Unknown';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });
        return Object.entries(grouped).map(([category, items]) => ({
            category,
            items
        }));
    }
};
