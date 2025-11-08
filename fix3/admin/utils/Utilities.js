// توابع تبدیل اعداد
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const enToFaNum = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (w) => persianDigits[+w]);
};

export const faToEnNum = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[۰-۹]/g, (w) => {
    const index = persianDigits.indexOf(w);
    return englishDigits[index];
  });
};

// تابع قالب‌بندی قیمت
export const formatPrice = (price, currency = 'تومان') => {
  if (price === null || price === undefined || isNaN(Number(price))) return '';
  
  const numericPrice = Number(faToEnNum(price)); // اطمینان از انگلیسی بودن عدد ورودی
  const formattedPrice = new Intl.NumberFormat('fa-IR').format(numericPrice);
  
  return `${formattedPrice} ${currency}`;
};