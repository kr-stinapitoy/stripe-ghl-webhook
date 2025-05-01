const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;  // Store your webhook secret in environment variables

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sigHeader = req.headers['stripe-signature'];
  const payload = req.body;

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(payload, sigHeader, endpointSecret);

  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send('Webhook Error: ' + error.message);
  }

  // Handle the 'checkout.session.completed' event from Stripe
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Extract customer data from the session object
    const email = session.customer_email;
    const name = session.customer_details?.name || '';
    const [firstName, ...lastNameArr] = name.split(' ');
    const lastName = lastNameArr.join(' ');

    try {
      // Send customer data to Go High Level (GHL)
      await axios.post('https://rest.gohighlevel.com/v1/contacts/', {
        email,
        firstName,
        lastName,
        tags: ['Purchased Product']  // You can adjust the tags here
      }, {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Contact sent to GHL');
      return res.status(200).send('Success');
    } catch (error) {
      console.error('Error sending to GHL:', error.message);
      return res.status(500).send('Error sending to GHL');
    }
  } else {
    console.log('Unhandled event type:', event.type);
    return res.status(200).send('Event type not handled');
  }
};
