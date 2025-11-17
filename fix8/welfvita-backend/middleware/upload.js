const multer = require('multer')
const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer storage that uploads directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = 'welfvita/uploads'

    // تعیین folder بر اساس نوع فایل
    if (file.fieldname === 'icon' || file.fieldname === 'image') {
      folder = 'welfvita/categories'
    } else if (file.fieldname === 'logo') {
      folder = 'welfvita/brands'
    } else if (file.fieldname === 'avatar') {
      folder = 'welfvita/avatars'
    }

    return {
      folder,
      resource_type: 'image',
      // Let Cloudinary generate unique public_id if not provided
    }
  },
})

const upload = multer({ storage })

module.exports = {
  upload,
  cloudinary,
}

