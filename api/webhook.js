const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    const name = session.customer_details?.name || '';
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ') || '';

    try {
      await axios.post('https://rest.gohighlevel.com/v1/contacts/', {
        email,
        firstName,
        lastName,
        tags: ['Purchased Product']
      }, {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Contact sent to GHL');
      res.status(200).send('Success');
    } catch (error) {
      console.error('Error sending contact to GHL:', error.response?.data || error.message);
      res.status(500).send('Error sending to GHL');
    }
  } else {
    res.status(200).send('Event type not handled');
  }
};
