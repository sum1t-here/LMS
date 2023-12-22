import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`App is running at http://localhost:${PORT}`);
});
