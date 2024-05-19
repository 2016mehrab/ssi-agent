module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.connection_id) {
    next();
  } else {
    // res.status(401).send('You are not authorized to view this page');
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  }
};