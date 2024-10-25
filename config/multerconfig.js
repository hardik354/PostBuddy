const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// disk storage configuration/setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads');
    },
    filename: function (req, file, cb) {
        // making a unique random filename for each uploaded file
        crypto.randomBytes(16, (err, name) => {
            // console.log(bytes.toString('hex'));
            const fn = name.toString('hex') + path.extname(file.originalname);
            cb(null,fn);        
        });
    }
  });


  // export upload variable 
  const upload = multer({ storage: storage });

  module.exports = upload;

  

