var http = require('http')
  , fs = require('fs')
  , async = require('async')
  , express = require('express')
  , _ = require('underscore')
  , qt = require('quickthumb')

var app = express()

app.configure( function () {
  app.set('views', __dirname + '/views')
  app.set('view engine', 'hbs')
  app.set('port', 9000)
  app.use(app.router)
  app.use(express.static('./public'))
  app.use(express.favicon('./public/img/favicon.ico'))
})

var authenticate = express.basicAuth( function (user, pass, done) {
  done(null, pass === 'mardelplata')
})

app.get('/', authenticate, function (req, res) {
  res.render('index')
})

app.get('/view', authenticate, function (req, res) {
  getThumbnails(function (err, result) {
    res.render('view', { thumbs : result })
  })
})

app.get('/share', authenticate, function (req, res) {
  res.render('share')
})

app.post('/upload', authenticate, express.bodyParser(), function (req, res) {
  saveFiles(req.body, req.files, function (err, result) {
    res.render('view')
  })
})

var httpServer = http.createServer(app).listen(app.get('port'), function () {
  console.log("HTTP server listening on port %s in %s mode", app.get('port'), app.settings.env)
})

function getThumbnails (done) {
  fs.readdir('public/img/thumbs', function (err, files) {
    console.log(err, files)
    done(null, files)
  })
}

function saveFiles (captions, files, done) {
  _.each(captions, function (caption, index) {
    index = index.replace('caption_','')
    fs.readFile(files['file_' + index].path, function (err, data) {
      var newPath = 'public/img/uploads/' + files['file_' + index].name
      var thumbPath = 'public/img/thumbs/' + files['file_' + index].name
      fs.writeFile(newPath, data, function (err) {
        if (err) return console.log(err)
        qt.convert({
          src: newPath,
          dst: thumbPath,
          width: 300,
          height: 200
        }, function (err, pathToThumb) {
          if (err) return res.json(err, 500)
          done();
        })
      })
    })
  })
}
