import { createApp } from './app';
const app = await createApp();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
app.listen(PORT, '::', () => {
  console.log(`App listening on port ${PORT} (IPv4 and IPv6)`);
  console.log('Press Ctrl+C to quit.');
});
