const app = require('express')()
const cors = require('cors')()
const multer = require('multer')
const port = process.env.port || 5000
const bodyParser = require('body-parser');
const exec = require('child_process').exec;


app.use(cors)
app.use(bodyParser.json());



//  exec(cmd, function (err){
//        if (err){
//           console.error('Error occured: ' + err);
//        }else{
//           console.log('PDF encrypted :)');
//        }
//  });

// Multer File Uploading
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.pdf') //Appending .jpg
  }
})

const fileFilter = function (req, file, cb) {
  const allowedTypes = ["application/pdf"]
  if (!allowedTypes.includes(file.mimetype)){
      return cb(null, false)
  }
  cb(null, true)
}

var upload = multer({ storage: storage, fileFilter });

// Variables

var password 
var encryptedFilePath
var decryptedFilePath



// Routes
app.get('/', (req, res) =>{
    res.send("Hello")
})

app.post('/upload', upload.single('aadhaarEncryptedPDF'), (req, res) => {
    // console.log(req.file);
    // console.log(req.body);
    password = req.body.aadhaarPassword
    encryptedFilePath = __dirname + "\\" + req.file.path
    decryptedFilePath = __dirname + `\\downloads\\${password}.pdf`
    var cmd = `qpdf --password="${password}" --decrypt ${encryptedFilePath} ${decryptedFilePath}`;

    exec(cmd, function (err){
      if (err){
        console.error('Error occured: ' + err);
      }else{
        console.log('PDF decrypted :)');
      }
    });

    console.log(password);
    console.log(decryptedFilePath);
    res.json({message: 'Finished'})
})

var frontViewPath
var backViewPath
app.get('/process', (req, res) =>{
  // res.download(decryptedFilePath, `${password}.pdf`)
  frontViewPath = __dirname + `\\downloads\\front_${password}.png`
  backViewPath = __dirname + `\\downloads\\back_${password}.png`
  
  var frontViewCommand = `magick.exe convert -density 300 -units PixelsPerInch ${decryptedFilePath} -crop 999x656+123+2192 -sample 1029x640! ${frontViewPath}`
  var backViewCommand = `magick.exe convert -density 300 -units PixelsPerInch ${decryptedFilePath} -crop 999x656+1164+2192 -fill white -draw "rectangle 965,164 1006,523" -sample 1029x640! ${backViewPath}`

  exec(frontViewCommand, function (err){
    if (err){
      console.error('Error occured: ' + err);
    }else{
      console.log('Front View Generated!');
    }
    })
    // var f1 = new Promise ( () =>{
    //   exec(frontViewCommand, function (err){
    //   if (err){
    //     console.error('Error occured: ' + err);
    //   }else{
    //     console.log('Front View Generated!');
    //   }
    //   })
    //   }
    // )
    exec(backViewCommand, function (err){
      if (err){
        console.error('Error occured: ' + err);
      }else{
        console.log('Back View Generated!');
      }
    })
    // var f2 = new Promise (() =>{ })

    // f1.then( () => {return f2})
    //   .then(() => {return res.json({match:"finshed"})})
    //   .catch((err) =>{
    //     console.log("couldn't run")
    //   });
  
  setTimeout(() => res.json({match:"finshed"}), 5000 )
  

})

app.get('/frontView.png', (req,res) =>{
  res.sendFile(frontViewPath)
  console.log('Front View Served!');
})
app.get('/backView.png', (req,res) =>{
  res.sendFile(backViewPath)
  console.log('Back View Served!');
})

app.get('/process/frontViewDownload', (req,res) =>{
  res.download(frontViewPath)
  console.log('Downloaded Front View!');
})
app.get('/process/backViewDownload', (req,res) =>{
  res.download(backViewPath)
  console.log('Downloaded Back View!');
})

app.get('/process/decryptedPDF', (req,res) =>{
  res.download(decryptedFilePath)
  console.log('Downloaded Back View!');
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(__dirname + '/public/'))

  app.get(/.*/, (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
  })
}


app.listen(port,() =>{
    console.log(`Server is running at ${port}`);
})



