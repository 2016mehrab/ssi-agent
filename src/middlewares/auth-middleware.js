module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  }
  else {
    res.status(401).send('You are not authorized to view this page');
  }
}