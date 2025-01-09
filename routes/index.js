var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/submit", function(req, res) {
  const data = req.body;
  console.log(data);

  res.redirect("/step2");
})
router.get("/step2", function(req, res) {
  res.render("step2");
})
router.post("/step2", function(req, res) {
  const data = req.body;
  console.log(data);

  res.send(data)
})
module.exports = router;

