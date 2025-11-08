const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
// const Notification = require('../models/Notification'); // اگر این مدل را ندارید، این خط را حذف یا کامنت کنید

let users = [];
let products = [];
try {
    users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json'), 'utf-8'));
    products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf-8'));
} catch (err) {
    console.error(`❌ خطا در خواندن فایل‌های JSON داده: ${err.message}`.red.bold);
    process.exit(1);
}

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error('متغیر محیطی MONGO_URI تعریف نشده است.');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB متصل شد: ${conn.connection.host}`.cyan.bold);
  } catch (error) {
    console.error(`❌ خطا در اتصال: ${error.message}`.red.bold);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    console.log('🗑️  در حال پاک کردن داده‌های قبلی...'.yellow);
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    // await Notification.deleteMany(); // اگر مدل Notification وجود دارد
    console.log('✅ تمام داده‌ها پاک شدند'.green.bold);
  } catch (error) {
    console.error(`❌ خطا در پاک کردن: ${error.message}`.red.bold);
    process.exit(1);
  }
};

function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `WF${year}${month}${day}${random}`;
}

const importData = async () => {
  let createdUsers = [];
  let createdProducts = [];
  let sampleOrders = [];

  try {
    console.log('📦 در حال وارد کردن داده‌های جدید...'.yellow);

    console.log('👤 ایجاد کاربران...');
    if (!users || users.length === 0) {
        console.warn('⚠️ فایل users.json خالی است. کاربری ایجاد نشد.'.yellow);
    } else {
        createdUsers = await User.create(users);
        console.log(`✅ ${createdUsers.length} کاربر ایجاد شد`.green);
    }

    const adminUser = createdUsers.find(user => user.role === 'admin');
    if (!adminUser && products.length > 0) {
        console.error('❌ کاربر ادمین یافت نشد! محصولات بدون کاربر ایجاد می‌شوند.'.red);
    }

    console.log('📦 ایجاد محصولات...');
     if (!products || products.length === 0) {
        console.warn('⚠️ فایل products.json خالی است. محصولی ایجاد نشد.'.yellow);
    } else {
        const productsWithUser = products.map(product => ({
          ...product,
          user: adminUser ? adminUser._id : null
        }));
        createdProducts = await Product.create(productsWithUser);
        console.log(`✅ ${createdProducts.length} محصول ایجاد شد`.green);

        console.log('🛒 ایجاد سفارشات نمونه...');
        const user1 = createdUsers.find(u => u.email === 'ali@test.com');
        if (user1 && createdProducts.length >= 2) {
          const order1 = {
            user: user1._id,
            orderNumber: generateOrderNumber(), // <-- تولید شماره سفارش اینجا
            orderItems: [
              { name: createdProducts[0].name, qty: 1, image: createdProducts[0].images[0]?.url || '', price: createdProducts[0].price, product: createdProducts[0]._id },
              { name: createdProducts[1].name, qty: 2, image: createdProducts[1].images[0]?.url || '', price: createdProducts[1].price, product: createdProducts[1]._id }
            ],
            shippingAddress: { fullName: user1.name, address: user1.address?.street || 'خیابان آزادی، پلاک 123', city: user1.address?.city || 'تهران', state: user1.address?.state || 'تهران', postalCode: user1.address?.postalCode || '1234567890', country: 'ایران', phone: user1.phone || '09121234567', email: user1.email },
            paymentMethod: 'online', itemsPrice: createdProducts[0].price + (createdProducts[1].price * 2), taxPrice: 0, shippingPrice: 50000, totalPrice: (createdProducts[0].price + (createdProducts[1].price * 2)) + 50000,
            isPaid: true, paidAt: new Date(Date.now() - 24 * 60 * 60 * 1000), status: 'delivered', isDelivered: true, deliveredAt: new Date()
          };
          sampleOrders.push(order1);
        } else if (user1) { console.warn('⚠️ محصولات کافی برای ایجاد سفارش اول کاربر علی محمدی وجود ندارد.'.yellow); }

        const user2 = createdUsers.find(u => u.email === 'sara@test.com');
        if (user2 && createdProducts.length >= 4) {
          const order2 = {
            user: user2._id,
            orderNumber: generateOrderNumber(), // <-- تولید شماره سفارش اینجا
            orderItems: [ { name: createdProducts[3].name, qty: 1, image: createdProducts[3].images[0]?.url || '', price: createdProducts[3].price, product: createdProducts[3]._id } ],
            shippingAddress: { fullName: user2.name, address: 'خیابان ولیعصر، پلاک 456', city: 'شیراز', postalCode: '9876543210', country: 'ایران', phone: user2.phone || '09129876543', email: user2.email },
            paymentMethod: 'cod', itemsPrice: createdProducts[3].price, taxPrice: 0, shippingPrice: 60000, totalPrice: createdProducts[3].price + 60000, isPaid: false, status: 'processing'
          };
          sampleOrders.push(order2);
        } else if (user2) { console.warn('⚠️ محصولات کافی برای ایجاد سفارش دوم کاربر سارا احمدی وجود ندارد.'.yellow); }

        if (sampleOrders.length > 0) {
          const createdOrders = await Order.insertMany(sampleOrders);
          console.log(`✅ ${createdOrders.length} سفارش ایجاد شد`.green);
          for (const order of createdOrders) {
            for (const item of order.orderItems) {
              try {
                  await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty, soldCount: item.qty } }, { new: true, runValidators: true });
              } catch (updateError) { console.error(`❌ خطا در به‌روزرسانی موجودی محصول ${item.product}: ${updateError.message}`.red); }
            }
          }
          console.log(`✅ موجودی محصولات به‌روزرسانی شد`.green);
        } else { console.warn('⚠️ هیچ سفارش نمونه‌ای ایجاد نشد.'.yellow); }
    }

    // console.log('🔔 ایجاد اعلان‌های نمونه...');
    // ...

    console.log('\n🎉 تمام داده‌ها با موفقیت وارد شدند!'.green.bold);
    console.log('\n📊 خلاصه:'.cyan.bold);
    console.log(`   👤 کاربران: ${createdUsers.length}`.white);
    // نمایش تعداد واقعی محصولات ایجاد شده
    console.log(`   📦 محصولات: ${createdProducts.length}`.white);
    console.log(`   🛒 سفارشات: ${sampleOrders.length}`.white);
    // console.log(`   🔔 اعلان‌ها: ${sampleNotifications.length}`.white);
    console.log('\n✅ اطلاعات ورود:'.yellow.bold);
    console.log(`   ادمین: admin@welfvita.com / Admin123`.cyan);
    console.log(`   مدیر: manager@welfvita.com / Manager123`.cyan);
    console.log(`   کاربر: ali@test.com / User123`.cyan);

  } catch (error) {
    // نمایش کامل خطا برای دیباگ بهتر
    console.error(`❌ خطا در وارد کردن:`.red.bold, error);
    process.exit(1);
  }
};

const runSeed = async () => {
  await connectDB();
  const command = process.argv[2];
  if (command === '-d' || command === '--delete') { await deleteData(); }
  else if (command === '-i' || command === '--import') { await importData(); }
  else { await deleteData(); await importData(); }
  console.log('\n✅ عملیات با موفقیت انجام شد!'.green.bold);
  await mongoose.connection.close(); // اطمینان از بسته شدن اتصال
  process.exit(0);
};

runSeed();