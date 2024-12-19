const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User,Post } = require('../models');


const router = express.Router();

router.use((req,res,next) => {
    res.locals.user = req.user;
     next();
})

router.get('/profile',isLoggedIn,((req,res)=> {
    res.render('profile', { title: '내 정보'});
}));

router.get('/account',isNotLoggedIn,(req,res) => {
    res.render('account', { title: '회원가입'});
});

router.get('/', async (req,res,next) => {
    try{
        const posts = await Post.findAll({
            include: {
                model: User,
                attributes: ['id','name'],
            }
        });
        res.render('main', {
            title: 'project',
            twits: posts,
        });
    }catch(err){
        console.error(err);
        next(err);
    }
});

module.exports = router;
