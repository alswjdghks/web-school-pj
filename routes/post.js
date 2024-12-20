const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize'); // Sequelize 비교 연산자

const Post = require('../models/post');
const User = require('../models/user');
const { afterUploadImage, uploadPost } = require('../controllers/post')
// routes/post.js
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

try{
    fs.readdirSync('uploads');
}catch(error){
    console.error('uploads 폴더가 없어서 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req,file,cb){
            cb(null,'uploads/');
        },
        filename(req,file,cb){
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname,ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, 
});

// POST /post/img
router.post('/img', isLoggedIn, upload.single('img'), afterUploadImage);

// POST /post
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), uploadPost);

// 게시판 페이지
router.get('/', async (req, res, next) => {
    try {
        const posts = await Post.findAll({
            include: [{ model: User, attributes: ['name'] }],
            order: [['createdAt', 'DESC']],
        });
        res.render('posts', { posts, user: req.user });
    } catch (error) {
        console.error('게시판 로드 오류:', error);
        next(error);
    }
});

// 검색 라우트
router.get('/search', async (req, res, next) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).send('검색어를 입력해주세요.');
        }

        const results = await Post.findAll({
            where: {
                [Op.or]: [
                    { content: { [Op.substring]: keyword } }, // 게시글 내용 검색
                ],
            },
            include: [
                {
                    model: User,
                    where: {
                        username: { [Op.substring]: keyword }, // 작성자 이름 검색
                    },
                    attributes: ['name'], // 필요한 작성자 정보만 가져옴
                },
            ],
        });

        res.render('search', { results, keyword }); // 검색 결과 렌더링
    } catch (error) {
        console.error('검색 기능 오류:', error);
        next(error);
    }
});

router.get('/:id', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { postId: req.params.id }, // 현재 로그인한 사용자의 게시글
            include: [{ model: User, attributes: ['name'] }], // 작성자 이름 포함
        });

        if (!post) {
            return res.status(404).send('게시글이 존재하지 않습니다.');
        }

        res.render('post-detail', { post });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/:id/edit', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { postId: req.params.id, userId: req.user.userId }, // 권한 확인
        });

        if (!post) {
            return res.status(404).send('게시글이 존재하지 않거나 수정 권한이 없습니다.');
        }

        res.render('post-edit', { post }); // post-edit.html로 데이터 전달
    } catch (error) {
        console.error('게시글 수정 페이지 로드 오류:', error);
        next(error);
    }
});

// POST /:id/edit (게시글 수정)
router.post('/:id/edit', isLoggedIn, upload.single('img'), async (req, res, next) => {
    try {
        const post = await Post.findOne({ where: { postId: req.params.id, userId: req.user.userId } });

        if (!post) {
            return res.status(403).send('권한이 없습니다.');
        }

        await post.update({
            content: req.body.content || post.content,
            img: req.file ? `/uploads/${req.file.filename}` : post.img,
        });

        res.redirect(`/post/${req.params.id}`);
    } catch (error) {
        console.error('게시글 수정 오류:', error);
        next(error);
    }
});

// POST /:id/delete (게시글 삭제)
router.post('/:id/delete', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({ where: { postId: req.params.id, userId: req.user.userId } });

        if (!post) {
            return res.status(403).send('권한이 없습니다.');
        }

        await post.destroy();
        res.redirect('/post');
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        next(error);
    }
})

module.exports =router;