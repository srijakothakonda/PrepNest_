const router=require('express').Router(), c=require('../controllers/authController'), {requireAuth}=require('../middleware/auth');
router.post('/register',c.register); router.post('/login',c.login); router.post('/logout',c.logout); router.get('/me',requireAuth,c.me); module.exports=router;
