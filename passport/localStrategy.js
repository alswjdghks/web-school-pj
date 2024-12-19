const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');
const { where } = require('sequelize');

module.exports = () => {
    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
    }, async(id,password,done) => {
        try{
            const exUser = await User.findOne({ where : { id } });
            console.log('User:', exUser);
            console.log('Plain password:', password);
            console.log('Hashed password:', exUser.password);
            if(exUser){
                const result = await bcrypt.compare(password, exUser.password);
                if(result){
                    done(null, exUser);
                }else{
                    done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
                }
            }else{
                done(null, false, { message: '가입되지 않은 아이디입니다.' } );
            }
        }catch(error){
            console.error(error);
            done(error);
        }
    }));
};