require('dotenv').config()
const mongoose = require('mongoose')
const Admin = require('./models/Admin')

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/welfvita-store'

const TEST_EMAIL = 'testuser@welfvita.com'

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('MongoDB connected:', mongoose.connection.name)

    const existing = await Admin.findOne({ email: TEST_EMAIL })
    if (existing) {
      console.log('User already exists:')
      console.log({
        id: existing._id.toString(),
        email: existing.email,
        role: existing.role,
      })
      await mongoose.disconnect()
      return
    }

    const user = await Admin.create({
      name: 'Test User',
      email: TEST_EMAIL,
      password: 'test1234',
      role: 'user',
      isActive: true,
    })

    console.log('User created successfully:')
    console.log({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    await mongoose.disconnect()
    console.log('Done.')
  } catch (err) {
    console.error('Error seeding user:', err)
    process.exit(1)
  }
}

run()

