const { createProxyMiddleware } = require('http-proxy-middleware');

const proxy = createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  ws: true,
});

module.exports = function (app) {
  app.use('/graphql', proxy);
  app.use('/api', proxy);
};
