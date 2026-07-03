const webhookUrl = 'https://script.google.com/macros/s/AKfycbyxJGUsd186Bd0h8jtmguJLXf3wG2TnfDd85O9S2Bybq6sJhlDmEKJDZwTVjm-vhBE4/exec';
const payload = {
  exportType: 'warranties',
  data: [{
    Customer_Name: 'Test Name',
    Customer_Email: 'test@example.com',
    Customer_Phone: '1234567890',
    Product_Name: 'Test Product',
    Serial_Number: 'TEST-123',
    Warranty_Status: 'ACTIVE',
    Start_Date: '2026-07-03',
    End_Date: '2027-07-03',
    Certificate_Number: 'CERT-12345678'
  }]
};

fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.text().then(text => console.log('Status:', res.status, 'Body:', text)))
.catch(err => console.error(err));
