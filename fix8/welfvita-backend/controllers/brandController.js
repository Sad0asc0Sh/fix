const Brand = require('../models/Brand')
const { cloudinary } = require('../middleware/upload')

// تبدیل فایل آپلود شده Cloudinary به { url, public_id }
const extractImageInfo = (file) => {
  if (!file) return null
  return {
    url: file.path,
    public_id: file.filename,
  }
}

// GET /api/brands
exports.getAllBrands = async (req, res) => {
  try {
    const { limit = 1000, fields } = req.query

    let brandsQuery = Brand.find().limit(parseInt(limit, 10)).sort({ name: 1 })

    if (fields) {
      brandsQuery = brandsQuery.select(fields.split(',').join(' '))
    }

    const brands = await brandsQuery

    res.json({
      success: true,
      data: brands,
      count: brands.length,
    })
  } catch (error) {
    console.error('Error fetching brands:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست برندها',
      error: error.message,
    })
  }
}

// GET /api/brands/:id
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'برند مورد نظر یافت نشد',
      })
    }

    res.json({
      success: true,
      data: brand,
    })
  } catch (error) {
    console.error('Error fetching brand by id:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات برند',
      error: error.message,
    })
  }
}

// POST /api/brands
exports.createBrand = async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'نام برند الزامی است',
      })
    }

    const brandData = {
      name,
      description,
    }

    // اگر لوگو آپلود شده باشد، اطلاعات آن را ذخیره کن
    if (req.file) {
      brandData.logo = extractImageInfo(req.file)
    }

    const brand = await Brand.create(brandData)

    res.status(201).json({
      success: true,
      data: brand,
      message: 'برند با موفقیت ایجاد شد',
    })
  } catch (error) {
    console.error('Error creating brand:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد برند',
      error: error.message,
    })
  }
}

// PUT /api/brands/:id
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'برند مورد نظر یافت نشد',
      })
    }

    const { name, description, removeLogo } = req.body
    const hasNewLogo = Boolean(req.file)

    // مدیریت لوگو: اگر لوگو جدید آپلود شده، لوگو قدیمی را از Cloudinary حذف کن
    if (hasNewLogo) {
      if (brand.logo && brand.logo.public_id) {
        try {
          await cloudinary.uploader.destroy(brand.logo.public_id)
        } catch (err) {
          console.error('Error deleting old logo from Cloudinary:', err.message)
        }
      }
      brand.logo = extractImageInfo(req.file)
    } else if (removeLogo === 'true' || removeLogo === true) {
      // اگر درخواست حذف لوگو داده شده
      if (brand.logo && brand.logo.public_id) {
        try {
          await cloudinary.uploader.destroy(brand.logo.public_id)
        } catch (err) {
          console.error('Error deleting logo from Cloudinary:', err.message)
        }
      }
      brand.logo = { url: null, public_id: null }
    }

    // به‌روزرسانی فیلدهای اصلی
    if (name !== undefined) brand.name = name
    if (description !== undefined) brand.description = description

    const updatedBrand = await brand.save()

    res.json({
      success: true,
      data: updatedBrand,
      message: 'برند با موفقیت به‌روزرسانی شد',
    })
  } catch (error) {
    console.error('Error updating brand:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی برند',
      error: error.message,
    })
  }
}

// DELETE /api/brands/:id
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'برند مورد نظر یافت نشد',
      })
    }

    // حذف لوگو از Cloudinary (در صورت وجود)
    if (brand.logo && brand.logo.public_id) {
      try {
        await cloudinary.uploader.destroy(brand.logo.public_id)
      } catch (err) {
        console.error('Error deleting logo from Cloudinary:', err.message)
      }
    }

    await brand.deleteOne()

    res.json({
      success: true,
      message: 'برند با موفقیت حذف شد',
    })
  } catch (error) {
    console.error('Error deleting brand:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در حذف برند',
      error: error.message,
    })
  }
}
