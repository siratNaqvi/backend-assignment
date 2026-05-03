const fakeAuth = (req, res, next) => {
  const role = req.headers.role || "user"; // 👈 test from Postman

  req.user = {
    id: 1,
    role: role
  };

  next();
};

export default fakeAuth;