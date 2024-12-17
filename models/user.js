const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            userId:{
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            id:{
                type: Sequelize.STRING(20),
                unique:true, // 중복 제거
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            password:{
                type: Sequelize.STRING,
                allowNull: false,
            },
            email:{
                type: Sequelize.STRING(255),
                unique: true, // 중복 제거
                allowNull: false,
            }
        }, {
            sequelize, 
            timestamps: false,
            underscored: false,
            modelName: 'User',
            tableName: 'users',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    static associate(db){
        db.User.hasMany(db.Post, { foreignKey: 'userId' });
        //db.Post.belongsTo(db.User, { foreignKey: 'userId' });
    }
};