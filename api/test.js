module.exports = function handler(req, res) {
  res.json({ ok: true, url: req.url })
}
