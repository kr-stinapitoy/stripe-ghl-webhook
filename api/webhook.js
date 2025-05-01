const axios = require('axios');

module.exports = async (req, res) => {
  // Ensure the request method is POST (webhook from Stripe is a POST request)
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Parse the incoming Stripe event
  const event = req.body;

  // Handle the checkout.session.completed event from Stripe
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract customer information from the session
    const email = session.customer_email;
    const name = session.customer_details?.name || '';
    
    // Split the name into first and last name (if possible)
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ') || '';

    try {
      // Send the customer details to Go High Level using their API
      await axios.post('https://rest.gohighlevel.com/v1/contacts/', {
        email,
        firstName,
        lastName,
        tags: ['Purchased Product'] // You can customize the tags here
      }, {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`, // Use the environment variable for the GHL API Key
          'Content-Type': 'application/json'
        }
      });

      console.log('Contact sent to GHL');
      res.status(200).send('Success'); // Respond back to Stripe with a success status
    } catch (error) {
      console.error('Error sending contact to GHL:', error.response?.data || error.message);
      res.status(500).send('Error sending to GHL'); // Return an error response
    }
  } else {
    // Handle other event types (you can add more events as needed)
    res.status(200).send('Event type not handled');
  }
};
