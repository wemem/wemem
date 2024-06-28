// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bodyParser = require('body-parser');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TurndownService = require('turndown');

const app = express();
const port = 5010;

app.use(bodyParser.text({ type: 'text/html' }));

const turndownService = new TurndownService();

app.post('/convert', (req, res) => {
  const html = req.body;
  if (!html) {
    return res.status(400).send('No HTML content provided');
  }

  try {
    const markdown = turndownService.turndown(html);
    res.send({
      code: 0, message: 'success', data: markdown,
    });
  } catch (error) {
    console.error('error', error);
    res.status(500).send({
      code: 1, message: error.message, data: null,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
