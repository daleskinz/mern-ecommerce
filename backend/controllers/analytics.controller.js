import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";


export const getAnalyticsData = async () => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
        {
            $group: {
                _id:null, // groups all documents together,
                totalSales: { $sum:1 },
                totalRevenue: { $sum:"$totalAmount" },
        },
    },
    ]);

    const { totalSales, totalRevenue }= salesData[0] || { totalSales: 0, totalRevenue: 0 };   

    return {
        users: totalUsers,
        products: totalProducts,
        totalSales, 
        totalRevenue,
    };
};

export const getDailySalesData = async (startDate, endDate) => {
    try {
        const dailySalesData = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // year, month, date
                    sales: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },  
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
    
        // Example of dailySalesData...
        // [ Monday Sales
        //     { 
        //         _id: "09-09-2024",
        //          sales: 12,
        //           revenue: 1450.75
        //     },
        // ]
    
            // [ Tuesday Sales etc
            //     { 
            //         _id: "10-09-2024",
            //          sales: 2,
            //           revenue: 280.45
            //     },
            // ]
    
            const dateArray = getDatesInRange(startDate, endDate); 
            //  console.log(dateArray); // [ "2024-09-09", "2024-09-10", "2024-09-11" ... ]
    
            return dateArray.map(date => {
                const foundData = dailySalesData.find((item) => item._id === date);
    
                return {
                    date,
                    sales: foundData?.sales || 0,
                    revenue: foundData?.revenue || 0,
                };
            });
    } catch (error) {
        throw error;
    }
};

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};