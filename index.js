const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// E-Commerce Companies' base URL
const BASE_URL = 'http://20.244.56.144/test/companies';
const COMPANIES = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];

// Helper function to fetch products from a company
async function fetchProducts(company, category, topN, minPrice, maxPrice) {
    const url = `${BASE_URL}/${company}/categories/${category}/products?top=${topN}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzIxOTc1MDYyLCJpYXQiOjE3MjE5NzQ3NjIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjdlZmZkY2U3LWY5ODEtNDA4Yi05NzRkLThiMzJkMTBiYjU5YSIsInN1YiI6InZlamVuZGxhc2hhbnRoaXJtYWlAZ21haWwuY29tIn0sImNvbXBhbnlOYW1lIjoiVmlnbmFuJ3MgTmlydWxhIEluc3RpdHV0ZSBvZiBUZWNobm9sb2d5IGFuZCBTY2llbmNlIGZvciBXb21lbiIsImNsaWVudElEIjoiN2VmZmRjZTctZjk4MS00MDhiLTk3NGQtOGIzMmQxMGJiNTlhIiwiY2xpZW50U2VjcmV0Ijoid1h1bWFleEt1bklzUEZPayIsIm93bmVyTmFtZSI6InZlamFuZGxhIHNhbnRoaXJtYWkiLCJvd25lckVtYWlsIjoidmVqZW5kbGFzaGFudGhpcm1haUBnbWFpbC5jb20iLCJyb2xsTm8iOiIyMU5OMUEwNUM3In0.gXc44LdQi0Hyq4GZ-WNzM3WuAAgbtU9nvRt-fLGdFCo}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching products from ${company}:`, error.message);
        return [];
    }
}

// Route to get top products for a category
app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { top, page = 1, sort = 'rating', minPrice = 0, maxPrice = 1000000 } = req.query;

    // Validate 'top' parameter
    const topN = parseInt(top, 10);
    if (isNaN(topN) || topN <= 0) {
        return res.status(400).json({ error: 'Invalid value for "top". It must be a positive integer.' });
    }

    // Validate 'minPrice' and 'maxPrice'
    const minPriceNum = parseFloat(minPrice);
    const maxPriceNum = parseFloat(maxPrice);
    if (isNaN(minPriceNum) || isNaN(maxPriceNum) || minPriceNum < 0 || maxPriceNum < 0) {
        return res.status(400).json({ error: 'Invalid price range.' });
    }

    // Pagination setup
    const pageSize = topN > 10 ? 10 : topN;
    const offset = (page - 1) * pageSize;

    let products = [];

    // Fetch products from each company
    for (const company of COMPANIES) {
        const companyProducts = await fetchProducts(company, categoryname, topN, minPriceNum, maxPriceNum);
        products = [...products, ...companyProducts];
    }



    // Add unique IDs and sort products
    products = products.map(product => ({
        ...product,
        id: uuidv4() // Generate a unique ID for each product
    }));

    // Sorting
    if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price') {
        products.sort((a, b) => a.price - b.price);
    } else if (sort === 'company') {
        products.sort((a, b) => a.company.localeCompare(b.company));
    } else if (sort === 'discount') {
        products.sort((a, b) => b.discount - a.discount);
    }

    // Pagination
    products = products.slice(offset, offset + pageSize);

    res.json(products);
});

// Route to get details of a specific product
app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;

    if (!productid) {
        return res.status(400).json({ error: 'Product ID is required.' });
    }

    let productDetails = null;

    // Fetch products from each company to find the product by ID
    for (const company of COMPANIES) {
        const companyProducts = await fetchProducts(company, categoryname, 100, 0, 1000000);
        productDetails = companyProducts.find(product => product.id === productid);

        if (productDetails) break;
    }

    if (productDetails) {
        res.json(productDetails);
    } else {
        res.status(404).json({ error: 'Product not found.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
