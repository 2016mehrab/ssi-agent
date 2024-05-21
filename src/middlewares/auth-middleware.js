module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.connection_id) {
    res.locals.userName= req.session.user_name; 
    next();
  } else {
    // res.status(401).send('You are not authorized to view this page');
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  }
};

module.exports.isAdmin = (req, res, next) => {
  if (req.session.admin) {
    res.locals.adminName = req.session.admin.name; 
    next();
  } else {
    // res.status(401).send('You are not authorized to view this page');
    req.session.returnTo = req.originalUrl;
    res.redirect('/admin-login');
  }
};