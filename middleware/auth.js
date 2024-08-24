function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    //console.log('User in session:', req.user);
    return next();
  }
  res.redirect('/auth');
}

module.exports = { isAuthenticated };