var http = require('http')
  , fs = require('fs')
  , async = require('async')
  , express = require('express')
  , _ = require('underscore')
  , qt = require('quickthumb')
  , uuid = require('node-uuid')
  , mime = require('mime')
  , path = require('path')

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
  saveFile(req.body, req.files, function (err, result) {
    if (err) return res.json(err, 422)
    res.json({index : result})
  })
})

app.get('/download', authenticate, express.bodyParser(), function (req, res) {
  var file = _.keys(req.query)[0]
  fs.readFile(file, function(error, content) {
    if (error) {
      res.writeHead(500);
      res.end();
    }
    else {
      res.writeHead(200, { 'Content-Type': mime.lookup(file) });
      res.end(content, 'binary');
    }
  });
})

var httpServer = http.createServer(app).listen(app.get('port'), function () {
  console.log("HTTP server listening on port %s in %s mode", app.get('port'), app.settings.env)
})

function getThumbnails (done) {
  fs.readdir('public/img/thumbs', function (err, files) {
    done(null, files)
  })
}

function saveFile (caption, files, done) {
  var vals = _.values(caption)
  var index = vals[0]
  var text = vals[1]
  var name = uuid.v4()

  fs.readFile(files['file_' + index].path, function (err, data) {
    var fileName = files['file_' + index].name
    var extension = path.extname(fileName)
    var newPath = 'uploads/' + name + extension
    var thumbPath = 'public/img/thumbs/' + name + extension
    var largePath = 'public/img/' + name + extension
    var captionPath = 'public/captions/' + name + '.txt'
    fs.writeFile(newPath, data, function (err2) {
      if (err2) return console.log(err2)
      var mimeType = mime.lookup(newPath)
      console.log(mimeType)
      console.log(mimeType.indexOf('image'))
      if (mimeType.indexOf('image') >= 0) {
        qt.convert({
          src: newPath,
          dst: thumbPath,
          width: 300,
          height: 200
        }, function (err3, pathToThumb) {
          if (err3) return done(err3)
          qt.convert({
            src: newPath,
            dst: largePath,
            height: 600,
            type: 'resize'
          }, function (err4, pathToThumb2) {
            if (err4) return done(err4)
            fs.writeFile(captionPath, text, function (err5) {
              if (err5) return done(err5)
              done(null, index);
            })
          })
        })
      } else {
        fs.writeFile(captionPath, text, function (err6) {
          if (err5) return done(err6)
          done(null, index);
        })
      }
    })
  })
}
