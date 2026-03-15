/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    // purchase — это одна из записей в поле items из чека в data.purchase_records
    // _product — это продукт из коллекции data.products
    const { discount, sale_price, quantity } = purchase;
    discount = 1 - (purchase.discount / 100);
    revenue = sale_price * quantity * discount;
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (index === 0) {
        return .15;
    } else if (index == 2
        || index == 3
    ) {
        return 0.1;
    } else if (index === (total - 1)) {
        return 0;
    } else { // Для всех остальных
        return .05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.customers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.customers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue != "function"
        || typeof calculateBonus != "function"
        || !calculateRevenue
        || !calculateBonus
    ) {
        throw new Error('Некорректно переданы функции');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        // Заполним начальными данными
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((result, item) => ({
        ...result,
        [item.id]: item
    }), {});  // Ключом будет id, значением — запись из sellerStats
    const productIndex = data.products.reduce((result, item) => ({
        ...result,
        [item.sku]: item
    }), {}); // Ключом будет sku, значением — запись из data.products

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж
        seller.sales_count += 1;
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * record.items.length();
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = options.calculateRevenue(item, record.product);
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца
            seller.profit += profit;
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += 1;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    data.purchase_records.forEach(record => {
        // Код предыдущих шагов
    });

    // Сортируем продавцов по прибыли
    sellerStats.sort((a, b) => {
        if (a.profit < b.profit) {
            return -1;
        }
        if (a.profit > b.profit) {
            return 1;
        }
        return 0;
    });

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = options.calculateBonus(index, seller.length(), seller.profit);// Считаем бонус
        seller.top_products = Object.entries(seller.products_sold).map(() => ({
            sku, quantity
        }));
        seller.top_products.sort((a, b) => {
            if (a < b) {
                return -1;
            }

            else if (a > b) {
                return 1;
            }

            else {
                return 0;
            }
        });
        seller.top_products.slice(0, 9);
        // Формируем топ-10 товаров
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
            name: seller.name,// Строка, имя продавца
        revenue: seller.revenue,// Число с двумя знаками после точки, выручка продавца
            profit: seller.profit,// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
            top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: seller.bonus// Число с двумя знаками после точки, бонус продавца
}));
}
