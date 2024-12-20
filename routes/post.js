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
        const keyword = req.query.keyword;

        if (!keyword || keyword.trim() === '') {
            // 검색어가 비어 있거나 공백만 있는 경우
            return res.redirect('/'); // 검색 페이지로 리다이렉트
        }
        // 검색어 출력 (디버깅용)
        console.log('검색 키워드:', keyword);
        const posts = await Post.findAll({
            where: {
                [Op.or]: [
                    { content: { [Op.substring]: keyword } }, // 게시글 내용에서 검색
                    { '$User.name$': { [Op.substring]: keyword } }, // 작성자 이름에서 검색
                ],
            },
            include: [
                {
                    model: User,
                    attributes: ['name'], // 작성자 이름 포함
                },
            ],
        });
        res.render('search', { posts, keyword }); // 검색 결과 렌더링
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