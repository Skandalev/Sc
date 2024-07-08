const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.json());

let products = [];

// Endpoint to trigger scraping
app.post('/scrape', async (req, res) => {
    const url = 'xxxxxx'; // Replace with your stable URL

    try {
        products = await scrapeWebsite(url);
        console.log(products);
        res.status(200).send(products);
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).send({ error: error.message });
    }
});

// Read (R)
app.get('/products', (req, res) => {
    res.status(200).send(products);
});

// Update (U)
app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const product = products.find(p => p.id === id);
    if (product) {
        product.name = name;
        product.description = description;
        res.status(200).send(product);
    } else {
        res.status(404).send({ error: 'Product not found' });
    }
});

// Delete (D)
app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);

    if (index !== -1) {
        products.splice(index, 1);
        res.status(200).send({ message: 'Product deleted' });
    } else {
        res.status(404).send({ error: 'Product not found' });
    }
});

async function scrapeWebsite(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Adjust the selector based on the structure of the website you are scraping
    const scrapedProducts = await page.evaluate(() => {
        const productElements = document.querySelectorAll('.jet-listing-grid__item'); // Adjust the selector to match your website's structure
        return Array.from(productElements).map((product, index) => {
            const nameElement = product.querySelector('.elementor-element-b989ae5 h2.elementor-heading-title a'); // Adjust the selector
            const descriptionElement = product.querySelector('.elementor-element-af38a72 .elementor-widget-container'); // Adjust the selector
            const imageElement = product.querySelector('.jet-listing-dynamic-image__img');
            return {
                id: String(index), // Assign a unique ID for each product
                name: nameElement ? nameElement.innerText : 'No name found',
                img: imageElement ? imageElement.src: 'no img found',
                description: descriptionElement ? descriptionElement.innerText : 'No description found'
            };
        });
    });

    await browser.close();
    return scrapedProducts;
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
