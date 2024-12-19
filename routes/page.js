const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User,Post } = require('../models');


const router = express.Router();

// 미들웨어: res.locals에 사용자와 게시글 정보를 추가
router.use(async (req, res, next) => {
    if (req.user) {
        try {
            const user = await User.findOne({
                where: { id: req.user.id },
                include: [{ model: Post }], // 게시글 포함
            });
            res.locals.user = user; // 최신 사용자 정보
            res.locals.postCount = user.Posts.length; // 게시글 개수
            res.locals.postIdList = user.Posts; // 게시글 목록
        } catch (error) {
            console.error('사용자 데이터 로드 오류:', error);
            res.locals.user = null;
            res.locals.postCount = 0;
            res.locals.postIdList = [];
        }
    } else {
        res.locals.user = null;
        res.locals.postCount = 0;
        res.locals.postIdList = [];
    }
    next();
});

// 프로필 페이지 라우트
router.get('/profile', isLoggedIn, async (req, res, next) => {
    try {
        // 게시글과 작성자 정보를 함께 가져오기
        const posts = await Post.findAll({
            where: { userId: req.user.userId }, // 현재 로그인한 사용자의 게시글
            include: [{ model: User, attributes: ['name'] }], // 작성자 이름 포함
        });

        res.render('profile', { posts }); // 미들웨어에서 설정한 res.locals를 활용
    } catch (error) {
        console.error(error);
        next(error);
    }
});

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
