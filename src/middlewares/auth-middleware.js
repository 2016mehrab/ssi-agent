module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.connection_id) {
    next();
  } else {
    // res.status(401).send('You are not authorized to view this page');
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  }
};

module.exports.isAuthenticatedSP = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.session.returnTo = req.originalUrl;
    res.redirect('/signup_with_idp');
  }
};