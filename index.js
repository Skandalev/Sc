const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

// Function to log in using Puppeteer
const login = async (page) => {
  await page.goto('https://www.aladincorp.com/login', { waitUntil: 'networkidle2' });

  // Replace with provided username and password
  await page.type('#eael-user-login', 'xxxxx');
  await page.type('#eael-user-password', 'xxxxxx');

  // Uncomment the following lines if "Remember Me" checkbox needs to be checked
  // await page.click('#rememberme');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('#eael-login-submit')
  ]);

  console.log('Logged in successfully!');
};

app.get('/scrape', async (req, res) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Log in before proceeding to scrape
    await login(page);

    // Once logged in, navigate to the desired page to scrape
    await page.goto('https://www.aladincorp.com/shop', { waitUntil: 'networkidle2' });

    // Wait for the product elements to load
    await page.waitForSelector('.jet-listing-grid__item');

    // Scrape product information
    const products = await page.evaluate(() => {
      const productElements = document.querySelectorAll('.jet-listing-grid__item');
      return Array.from(productElements).map(el => {
        const titleElement = el.querySelector('.elementor-heading-title.elementor-size-default a');
        const imageElement = el.querySelector('.jet-listing-dynamic-image__img');
        const priceElement = el.querySelector('.elementor-element-6900ad8 .woocommerce-Price-amount bdi');

        // Extract itemNumber using regex
        const itemNumberElement = el.querySelector('.elementor-element-af38a72 .elementor-widget-container');
        let itemNumber = null;
        if (itemNumberElement) {
          const textContent = itemNumberElement.textContent.trim();
          const match = textContent.match(/מק״ט\s*:\s*(\S+)/);
          if (match && match.length > 1) {
            itemNumber = match[1];
          }
        }

        // Extract price information using regex
        let price = null;
        if (priceElement) {
          const priceText = priceElement.textContent.trim();
          const regex = /₪\s*([\d,]+)/;
          const match = priceText.match(regex);
          if (match && match.length > 1) {
            const priceValue = match[1].replace(',', ''); // Remove commas from the price string
            price = parseFloat(priceValue);
          }
        }

        return {
          title: titleElement ? titleElement.textContent.trim() : null,
          image: imageElement ? imageElement.src : null,
          price: price !== null ? price : null,
          itemNumber: itemNumber
        };
      });
    });

    await browser.close();

    res.json({ products });
  } catch (error) {
    console.error('Scraping failed:', error);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
