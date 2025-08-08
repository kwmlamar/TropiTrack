const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('Setting up Stripe products and prices...');

    // Create products and prices for each plan
    const plans = [
      {
        name: 'TropiTrack Starter',
        description: 'Perfect for small crews - Up to 15 workers, 3 active projects, time tracking & approvals',
        amount: 3900, // $39.00 in cents
        priceId: 'starter_monthly'
      },
      {
        name: 'TropiTrack Professional',
        description: 'For growing companies - Up to 50 workers, unlimited projects, advanced payroll features',
        amount: 8900, // $89.00 in cents
        priceId: 'professional_monthly'
      },
      {
        name: 'TropiTrack Enterprise',
        description: 'For large operations - Unlimited workers, multi-company access, advanced analytics',
        amount: 17900, // $179.00 in cents
        priceId: 'enterprise_monthly'
      }
    ];

    const createdPrices = {};

    for (const plan of plans) {
      console.log(`\nCreating product: ${plan.name}`);
      
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });

      console.log(`✅ Created product: ${product.id}`);

      // Create monthly price
      const price = await stripe.prices.create({
        unit_amount: plan.amount,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        product: product.id,
        lookup_key: plan.priceId, // This helps identify the price later
      });

      console.log(`✅ Created price: ${price.id} (${plan.amount / 100} USD/month)`);
      
      createdPrices[plan.priceId] = {
        productId: product.id,
        priceId: price.id,
        amount: plan.amount,
        name: plan.name
      };
    }

    console.log('\n🎉 All products and prices created successfully!');
    console.log('\nPrice IDs to use in your application:');
    console.log('=====================================');
    
    for (const [key, value] of Object.entries(createdPrices)) {
      console.log(`${key}: ${value.priceId}`);
    }

    console.log('\n📝 Update your checkout page with these price IDs:');
    console.log(`
const PRICE_IDS = {
  starter: '${createdPrices.starter_monthly?.priceId}',
  professional: '${createdPrices.professional_monthly?.priceId}',
  enterprise: '${createdPrices.enterprise_monthly?.priceId}',
};
    `);

    return createdPrices;

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Please set your STRIPE_SECRET_KEY environment variable');
    console.log('You can find your secret key at: https://dashboard.stripe.com/apikeys');
    process.exit(1);
  }

  setupStripeProducts();
}

module.exports = { setupStripeProducts };
