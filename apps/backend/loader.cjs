import('./dist/main.js').catch((err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});
