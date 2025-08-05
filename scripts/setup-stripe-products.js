const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    name: 'TropiTrack Starter',
    description: 'Essential workforce management for small teams. Includes up to 10 workers, basic timesheet tracking, QR code clock-in, payroll calculations, project management, and mobile app access. Perfect for small construction companies and contractors.',
    slug: 'starter',
    monthlyPrice: 3900, // $39.00 in cents
    yearlyPrice: 37400, // $374.00 in cents
    features: [
      'Up to 10 workers',
      'Basic timesheet tracking',
      'QR code clock-in',
      'Payroll calculations',
      'Project management',
      'Mobile app access',
      '1GB storage',
      '1,000 API calls/month'
    ]
  },
  {
    name: 'TropiTrack Professional',
    description: 'Advanced workforce management for growing companies. Includes up to 50 workers, advanced timesheet features, biometric authentication, advanced payroll, project analytics, team management, and priority support. Ideal for medium-sized construction firms and service businesses.',
    slug: 'professional',
    monthlyPrice: 8900, // $89.00 in cents
    yearlyPrice: 85400, // $854.00 in cents
    features: [
      'Up to 50 workers',
      'Advanced timesheet features',
      'Biometric authentication',
      'Advanced payroll',
      'Project analytics',
      'Team management',
      'Priority support',
      '10GB storage',
      '10,000 API calls/month'
    ]
  },
  {
    name: 'TropiTrack Enterprise',
    description: 'Complete workforce management solution for large organizations. Includes unlimited workers, multi-company access, advanced analytics, equipment tracking, API access, custom integrations, and dedicated support. Perfect for large construction companies and multi-site operations.',
    slug: 'enterprise',
    monthlyPrice: 17900, // $179.00 in cents
    yearlyPrice: 171800, // $1,718.00 in cents
    features: [
      'Unlimited workers',
      'Multi-company access',
      'Advanced analytics',
      'Equipment tracking',
      'API access',
      'Custom integrations',
      'Dedicated support',
      '100GB storage',
      '100,000 API calls/month'
    ]
  }
];

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products for TropiTrack...\n');

  for (const product of products) {
    try {
      console.log(`📦 Creating product: ${product.name}`);
      
      // Create the product
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: {
          slug: product.slug,
          features: JSON.stringify(product.features)
        }
      });

      console.log(`✅ Product created: ${stripeProduct.id}`);

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.monthlyPrice,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          plan_slug: product.slug,
          billing_cycle: 'monthly'
        }
      });

      console.log(`💰 Monthly price created: ${monthlyPrice.id} - $${(product.monthlyPrice / 100).toFixed(2)}/month`);

      // Create yearly price
      const yearlyPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.yearlyPrice,
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        metadata: {
          plan_slug: product.slug,
          billing_cycle: 'yearly'
        }
      });

      console.log(`💰 Yearly price created: ${yearlyPrice.id} - $${(product.yearlyPrice / 100).toFixed(2)}/year`);

      console.log(`\n📋 Product Summary:`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Monthly: $${(product.monthlyPrice / 100).toFixed(2)}`);
      console.log(`   Yearly: $${(product.yearlyPrice / 100).toFixed(2)}`);
      console.log(`   Features: ${product.features.length} features`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error creating product ${product.name}:`, error.message);
    }
  }

  console.log('🎉 Stripe products setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Copy the product and price IDs to your database');
  console.log('2. Set up webhook endpoints in Stripe dashboard');
  console.log('3. Test the subscription flow');
}

// Run the setup
if (require.main === module) {
  setupStripeProducts().catch(console.error);
}

module.exports = { setupStripeProducts, products }; 