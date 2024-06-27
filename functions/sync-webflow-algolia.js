const { builder } = require('@netlify/functions');
const Webflow = require('webflow-api');
const algoliasearch = require('algoliasearch');
require('dotenv').config();

async function syncWebflowAlgolia(event, context) {
  const webflow = new Webflow({ token: process.env.WEBFLOW_API_TOKEN });
  const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
  const index = algolia.initIndex('all_collections');

  const collectionIds = process.env.WEBFLOW_COLLECTION_IDS.split(',');

  try {
    let allRecords = [];

    for (const collectionId of collectionIds) {
      // Fetch items from Webflow CMS for each collection
      const items = await webflow.items({ collectionId });

      // Format items for Algolia
      const records = items.map(item => ({
        objectID: `${collectionId}_${item._id}`,
        collectionId: collectionId,
        Name: item.name,
        Slug: item.slug,
        'Collection ID': item['collection-id'],
        'Locale ID': item['locale-id'],
        'Item ID': item['item-id'],
        'Created On': item['created-on'],
        'Updated On': item['updated-on'],
        'Published On': item['published-on'],
        Region: item.region,
        Country: item.country,
        'Featured Image': item['featured-image']?.url,
        'Image Caption': item['image-caption'],
        Heading: item.heading,
        'City Guide?': item['city-guide'],
        'Show on home?': item['show-on-home']
      }));

      allRecords = allRecords.concat(records);
    }

    // Upload all records to Algolia
    await index.saveObjects(allRecords);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data synced successfully', count: allRecords.length }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to sync data' }),
    };
  }
}

const handler = builder(syncWebflowAlgolia);

module.exports = { handler };

