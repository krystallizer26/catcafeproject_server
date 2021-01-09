var express = require('express');
var router = express.Router();
const userController = require("../controller/auth")

router.post('/sign_in',
  userController.signIn
);
router.get('/info',
  userController.getUserInfo
);

router.post('/forgot_password',
  userController.forgotPassword
);
router.put('/change_password',
  userController.changePassword
);
router.put('/change_password_member',
  userController.changePassword_member
);
router.put('/reset_password',
  userController.forgotPassword
);
router.put('/confirm_password/',
  userController.confirm_changePassword
);

module.exports = router;