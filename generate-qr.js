const QRCode = require('qrcode');
const os = require('os');

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
const ip = getLocalIP();
const url = `http://${ip}:${PORT}`;

// 1. Generar PNG
QRCode.toFile('qr.png', url, { width: 300, margin: 2 }, (err) => {
  if (err) throw err;
  console.log('\n  QR guardado en: qr.png');
});

// 2. Mostrar en terminal (ASCII)
QRCode.toString(url, { type: 'terminal', small: true }, (err, code) => {
  if (err) throw err;
  console.log('\n' + code);
  console.log('  URL: ' + url);
  console.log('  Escanea con tu celular (misma red WiFi)\n');
});
