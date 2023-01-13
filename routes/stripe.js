const express = require('express');
const { JsonDB, Config } = require('node-json-db')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

const db = new JsonDB(new Config("myDataBase", true, false, '/'));

router.post('/onboarding', async (req, res) => {
  const { company } = req.body
  const { arEmail } = company

  const index = await db.getIndex('/stripeUsers', arEmail, "email")
  let account
  if (index === -1) {
    account = await stripe.accounts.create({
      type: 'standard',
      country: 'US',
      email: arEmail
    });
    await db.push('/stripeUsers[]', account) // save that account to database
  } else {
    account = await db.getData(`/stripeUsers[${index}]`)
  }
  
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `http://localhost:3000/companies/${company.id}`,
    return_url: `http://localhost:3000/companies/${company.id}`,
    type: 'account_onboarding',
  });

  console.log('accountLink', accountLink)
  

  res.json(accountLink)
})

module.exports = router;
