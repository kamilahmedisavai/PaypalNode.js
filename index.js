const express = require('express');
const paypal = require('paypal-rest-sdk');

// Configure PayPal with your credentials
paypal.configure({
  'mode': 'sandbox', // Use "sandbox" for testing or "live" for production
  'client_id': 'AQU1OK1dLeHmpkm7tax8_q9OC5o7Xe39UlmBRGIxQWTxblV6oqT5_-W1xeHBuLqLdW3xbsF7gLxcxQ3S',
  'client_secret': 'EHiu0IlHkfcpjFCajuzZ0_MaYrhHlwQi5PMk0Dn8-aEa56f6d7qOKXzTN9TJXbZnJKCZ_VR2Eh7AIVu9'
});

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/pay', (req, res) => {
    const totalAmount = req.body.totalAmount; // Receive the total amount from the form
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success?total=" + totalAmount,
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": totalAmount // Use the total amount received from the frontend
            },
            "description": "Payment for food items."
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            console.error(JSON.stringify(error));
            res.status(500).send('Error creating payment');
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
});

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const totalAmount = req.query.total;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": totalAmount // Ensure this matches the authorized amount
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.error(JSON.stringify(error));
            res.status(500).send('Error processing payment');
        } else {
            console.log(JSON.stringify(payment));
            res.send('Payment successful');
        }
    });
});

app.get('/cancel', (req, res) => {
    res.send('Payment was canceled');
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
