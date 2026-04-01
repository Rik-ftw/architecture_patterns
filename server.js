const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/patterns', (req, res) => {
  const patternsDir = path.join(__dirname, 'patterns');
  const files = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));
  const patterns = files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(patternsDir, f), 'utf8'));
      const svgFile = f.replace('.json', '.svg');
      const hasSvg = fs.existsSync(path.join(patternsDir, svgFile));
      return { ...data, _svgFile: hasSvg ? svgFile : null };
    } catch { return null; }
  }).filter(Boolean);
  res.json(patterns);
});

app.get('/api/patterns/:file', (req, res) => {
  const filePath = path.join(__dirname, 'patterns', req.params.file);
  if (!filePath.startsWith(path.join(__dirname, 'patterns'))) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  const ext = path.extname(filePath);
  if (ext === '.svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(fs.readFileSync(filePath));
  } else {
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  }
});

app.get('/api/vendors', (req, res) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'vendors', 'registry.json'), 'utf8'));
  res.json(data);
});

app.use('/api/intake', require('./routes/intake'));
app.use('/api/solutions', require('./routes/solutions'));
app.use('/api/ai', require('./routes/aiReview'));
app.use('/api/github', require('./routes/github'));
app.use('/api/operational-support', require('./routes/operationalSupport'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EA Platform running on http://0.0.0.0:${PORT}`);
});
