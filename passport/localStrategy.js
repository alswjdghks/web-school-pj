const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');
const { where } = require('sequelize');

module.exports = () => {
    passport.use(new localStrategy({
        usernameField: 'id',
        passwordField: 'password',
    }, async(id,password,done) => {
        try{
            const exUser = User.findOne( {where : { id } } );
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