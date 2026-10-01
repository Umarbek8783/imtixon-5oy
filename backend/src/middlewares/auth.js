const jwt=require('jsonwebtoken');
function auth(req,res,next){const h=req.headers.authorization;if(!h?.startsWith('Bearer ')) return res.status(401).json({success:false,message:'Token kerak'});try{req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET);next()}catch{return res.status(401).json({success:false,message:'Token noto‘g‘ri yoki muddati o‘tgan'})}}
function verified(req,res,next){if(!req.user?.is_verified) return res.status(403).json({success:false,message:'Akkaunt tasdiqlanmagan'});next()}
function admin(req,res,next){if(req.user?.role!=='admin') return res.status(403).json({success:false,message:'Faqat admin uchun'});next()}
module.exports={auth,verified,admin};
