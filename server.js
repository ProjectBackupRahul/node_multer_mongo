const express = require('express');
const path = require ('path');
const crypto = require('crypto') //  Generate the file name 
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require ('gridfs-stream');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');


//@ Configuring os for network interfce .
var os = require('os');
var ifaces = os.networkInterfaces();
//@ Configuring os for network interfce 

// @ Using Gridfs insted of using, GridFS

const app = express();

// @ Imporing Midleware 
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//  @ Mongo URI Config 

const mongoURI = ('mongodb://127.0.0.1:27017/filemongo')

// @ Mongo Connectivity 

const connection = mongoose.createConnection(mongoURI,{ useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

// @ Init GFS 

let gfs 
connection.once('open', () =>{
     //  Init Stream with GFS
 gfs = Grid(connection.db, mongoose.mongo) ;
 gfs.collection('uploads')
})

// @ Creating  storage engine 

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

// @  Route : GET
// @  Loads Forms 
// @  Public

app.get('/', (req,res) =>{
  gfs.files.find().toArray((err,files) =>{
    //  Check if any file exists 
    if (files || files.length === 0){
      res.render('index',{
        files: false
      });
    }
      else {
          files.map(file =>{
              if (file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                file.isImage = true;
              } else {
                 file.isImage = false;
              }
          });
          res.render('index',{files: files});
      }
     
 });
   
});

// @ Route : POST
// @ uploads file to DB 
// @ public 

app.post('/upload', upload.single('file'),(req,res) =>{

 // res.json({file: req.file});
 res.redirect('/');
   
})

// @ Route : GET /file
// @ Desc : Display all file in json
// @ Access : Public

app.get('/files', (req,res)=>{
   gfs.files.find().toArray((err,files) =>{
      //  Check if any file exists 
      if (files || files.length === 0){
         return res.status(404).json({
            err: 'No files exists'
         })
      }
        //  File exists 
        return res.json(files);
   });
});

// @ Route : GET /file/:filename
// @ Desc : Display single file object
// @ Access : Public

app.get('/files/:filename', (req,res)=>{
  gfs.files.findOne({filename: req.params.filename}, (err, file) =>{

    if (file || file.length === 0){
      return res.status(404).json({
         err: 'No file exists'
      })
   }
     return res.json(file);

  });

});

// @ Route : GET /image/:filename
// @ Desc : Display image
// @ Access : Public

app.get('/files/:filename', (req,res)=>{
  gfs.files.findOne({filename: req.params.filename}, (err, file) =>{

    if (file || file.length === 0){
      return res.status(404).json({
         err: 'No file exists'
      })
   }
      //  Check if image 

       if (file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
           //  Read document to Browser 
              const readStream = gfs.createdReadStream(file.filename);
              readStream.pipe(res)
       } else {
            res.status(404).json({
              err: 'Not an Image'
            })
       }
  });
});


const PORT =5678;

app.listen(PORT, async ()=>{
 genURL();
})

 // @ Generating the local system URL

  const genURL = () => {
  Object.keys(ifaces).forEach((ifname) => {
      var alias = 0;
      ifaces[ifname].forEach((iface) => {
          if ('IPv4' !== iface.family || iface.internal !== false) {
              return;
          }
          if (alias >= 1) {res.render('index',{
            files: false
          });
          
          } else {
              var url = 'http://' + iface.address + ':' + PORT + '/'
              console.log(url);
          }
          ++alias;
      });
  });
}