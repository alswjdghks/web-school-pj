const express = require('express');
const morgan = require('morgan'); // 서버로 들어온 요청과 응답을 기록
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv'); // .env 파일을 읽어서 process.env로 만듦
const passport = require('passport');
const path = require('path');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

dotenv.config();
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');

const app = express();
passportConfig(); // passport 설정
app.set('port',process.env.PORT || 3001);
app.set('view engine','html');
nunjucks.configure('views',{
    express: app,
    watch: true,
});
sequelize.sync({ force:false })
    .then(() => {
        console.log("데이터베이스 연결 성공");
    })
    .catch((err) => {
        console.error(err);
    });

app.use(morgan('dev'));
app.use('/',express.static(path.join(__dirname,'public'))); // 정적인 파일들 제공, 요청경로 와 실제경로 설정
app.use(express.json()); // 요청의 본문을 해석
app.use(express.urlencoded({ extends: false })); // 폼 요청 해석
app.use(cookieParser(process.env.COOKIE_SECRET)); // 요청 헤더의 쿠키를 해석
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
    name:'session-cookie',
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);

app.use(bodyParser.raw());
app.use(bodyParser.text());

app.use((req,res,next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.get((err,req,res,next) => {
   res.locals.message = err.message;
   res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
   res.status(err.status || 500);
   res.render('error');
});

app.listen(app.get('port'),() => {
    console.log(app.get('port'),'번 포트에서 대기 중');
});

