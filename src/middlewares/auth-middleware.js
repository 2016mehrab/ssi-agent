module.exports.isAdmin = (req, res, next) => {
  if (req.session.admin) {
    res.locals.adminName = req.session.admin.name;
    next();
  } else {
    req.session.returnTo = req.originalUrl;
    res.redirect('/admin-login');
  }
};

module.exports.isAuthenticatedSP = (req, res, next) => {
  if (req.session.user) {
    res.locals.userName = req.session.user.user_name;
    next();
  } else {
    res.redirect('/generate_invitation_page');
  }
};

module.exports.isAuthenticatedForService = (req, res, next) => {
  if (req.session.user ) {
    // res.locals.userName = req.session.user.name;
    res.locals.userName = req.session.user.user_name;
    next();
  } else {
    res.redirect('/prove');
  }
};