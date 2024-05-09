import { PriceDraft, ProductDraft } from "@commercetools/platform-sdk";

const json = '{"publish":"true","translations":[{"region":"en","product_name":"Test product","search_key":"test-product"},{"region":"nl-NL","product_name":"Test product","search_key":"test-product"}],"date":"2017-01-01","variants":[{"stock_unit":"UUDDHE XX OOOOOOOOI","prices":{"USD":[{"country":"DEFAULT","amount":"100.00","currency":"$"},{"country":"DEFAULT","amount":"200.00","currency":"$"},{"country":"US","amount":"90.00","currency":"$"}],"EUR":[{"country":"DEFAULT","amount":"100.00","currency":"EUR"}]}}]}';

console.log(productCreate(json))

function productCreate(json: string) {
    const product: ProductDraft = transformProduct(JSON.parse(json)) as ProductDraft;

    return product;
}

function transformProduct(product: any): ProductDraft {
    const { translations, variants, date = new Date() } = product;

    const localProduct: ProductDraft = {
        productType: {
            typeId: "product-type",
            id: "test-id",
        },
        name: {
            en: translations[0].product_name
        },
        slug: {
            en: translations[0].search_key
        },
        masterVariant: {
            sku: setSKU(variants[0].stock_unit),
            prices: setPrices(variants[0].prices),
            attributes: [
                {
                    name: "created_at",
                    value: date,
                }
            ]
        }
    } as ProductDraft;

    return localProduct;
}


/**
 * DO NOT DELETE
 * Function to set the sku of a product
 * @param sku Original sku of an incoming object 
 * @returns The sku of the product for the commercetools platform
 */
function setSKU(sku: string): string {
    return sku.split(' ').join('-')
}

function transformPrices(prices: any) {
    const transformedPrices: any = {};

    // Iterate through each currency in the prices object
    for (const currency in prices) {
        if (prices.hasOwnProperty(currency)) {
            const countryPrices = prices[currency];

            // Initialize currency object in the transformedPrices if not already present
            transformedPrices[currency] = {};

            // Iterate through each price entry for the current currency
            for (let i = 0; i < countryPrices.length; i++) {
                const price = countryPrices[i];
                const country = price.country;
                const amount = parseFloat(price.amount);

                // If country is not set or if it's 'DEFAULT', set it to 'DEFAULT'
                const countryKey = country ? country : 'DEFAULT';

                // Check if there's already a price for the current country
                if (!transformedPrices[currency][countryKey] || amount < transformedPrices[currency][countryKey].amount) {
                    // If not, or if the current amount is lower, update the price in the transformedPrices
                    transformedPrices[currency][countryKey] = {
                        country: price.country,
                        amount: price.amount,
                        currency: price.currency
                    };
                }
            }
        }
    }

    return transformedPrices;
}

function convertPricesToPriceDraft(pricesObject: any) {
    const pricesArray = [];

    // Iterate through each currency in the prices object
    for (const currency in pricesObject) {
        if (pricesObject.hasOwnProperty(currency)) {
            const countryPrices = pricesObject[currency];

            // Iterate through each country in the current currency
            for (const country in countryPrices) {
                if (countryPrices.hasOwnProperty(country)) {
                    const price = countryPrices[country];

                    // Add the PriceDraft object to the prices array
                    pricesArray.push({
                        value: {
                            centAmount: parseFloat(price.amount) * 100, // Convert amount to cents
                            currencyCode: price.currency,
                        },
                        // NOTE: made few changes in the format from README file. Check readme file's line 53 and 55
                        country: country === 'DEFAULT' ? '' : country, 

                    });
                }
            }
        }
    }

    return pricesArray;
}

/**
 * DO NOT DELETE
 * Function to set the prices of a product
 * @param prices Pricing object of an incoming object
 * @returns Returns a priceDraft object for the commercetools platform
 */
function setPrices(prices: any) :PriceDraft[] {
    return convertPricesToPriceDraft(transformPrices(prices));
}
