module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.user?.connection_id) {
    console.log("INSIDE AUTH MIDDLEWARE", )
    res.locals.userName= req.session.user.user_name; 
    next();
  } else {
    console.log("AUTH MIDDLEWARE ELSE", req.session.user);
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  }
};