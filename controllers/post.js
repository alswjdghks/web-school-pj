const Post = require('../models/post');

exports.afterUploadImage = (req, res) => {
  //console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
};

exports.uploadPost = async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
};