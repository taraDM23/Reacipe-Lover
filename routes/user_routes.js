// for /users routes
const passport = require("passport");

const router = require("express").Router();

const Users = require("../models").user;
const {
  DashboardPageSettings,
  LoginPageSettings,
  RegisterUserPageSettings,
} = require("../config/page_settings");

const { checkAuthenticated, forwardAuthenticated } = require("../config/auth");

// --- GET Routes ---

// route "/user" : User dashboard page.
router.get("/", checkAuthenticated, (_, res) => res.render("user", DashboardPageSettings));

// route "/user/register" : User Registration page.
router.get("/register", forwardAuthenticated, (_, res) => res.render("register_user", RegisterUserPageSettings));

// route "/user/login" : User log-in page
router.get("/login", forwardAuthenticated, (_, res) => res.render("login", LoginPageSettings));

// route:"/user/logout" : Logout
router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "You are successfully logged out");
  res.redirect("/user/login");
});

// --- http Request - POST ---
// route "/user/login" : Login
router.post("/login", (req, res, next) => {
  // check if user has authorization
  passport.authenticate("local", (err, user) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        error: [{ msg: "Incorrect username or password" }],
      });
    }
    // log in User.
    req.logIn(user, (logInErr) => {
      if (logInErr) {
        console.error(logInErr);
        return next(logInErr);
      }
      return res.status(200).json({
        success_msg: "Login successful.",
      });
    });
    return null;
  })(req, res, next);
});

router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
    } = req.body;
    const errors = [];

    // data validation
    if (!email) errors.push({ msg: "Email is required. " });
    if (!password) errors.push({ msg: "Password is required. " });
    if (!name) errors.push({ msg: "Name is required. " });

    if (password.length < 8) {
      errors.push({ msg: "Password must be at least 8 characters long" });
    }

    if (errors.length > 0) {
      // if there is errors, send it back to browser.
      return res.status(400).json({
        error: errors,
      });
    }

    // check if user already registered.
    const user = await Users.findOne({
      where: { email },
    });
    if (user) {
      // if user, then notify the client.
      return res.status(400).json({
        error: [{ msg: "User already exists." }],
      });
    }

    // add new user to db
    await Users.create({
      email,
      name,
      password,
    });
    // return success code back to browser
    return res.status(200).json({
      success_msg: "Successfully registered",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: [{ msg: "Something went wrong. Try again later." }],
    });
  }
});

module.exports = router;
