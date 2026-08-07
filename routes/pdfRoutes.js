const router=require('express').Router(), multer=require('multer'),path=require('path'),crypto=require('crypto'),c=require('../controllers/pdfController'),{requireAuth}=require('../middleware/auth');
const upload=multer({storage:multer.diskStorage({destination:path.join(__dirname,'../uploads'),filename:(req,file,cb)=>cb(null,crypto.randomUUID()+'.pdf')}),fileFilter:(req,file,cb)=>{
  if(path.extname(file.originalname).toLowerCase()!=='.pdf')return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE','pdf'));
  cb(null,true);
},limits:{fileSize:20*1024*1024}});
router.get('/pdf',requireAuth,c.list);router.post('/pdf/upload',requireAuth,(req,res,next)=>upload.single('pdf')(req,res,(err)=>{
  if(!err)return next();
  if(err.code==='LIMIT_FILE_SIZE')return res.status(400).json({message:'PDF must be 20 MB or smaller.'});
  return res.status(400).json({message:'Please select a PDF file.'});
}),c.upload);router.put('/pdf/progress/:id',requireAuth,c.update);router.delete('/pdf/:id',requireAuth,c.remove);module.exports=router;
