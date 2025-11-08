"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductById, updateProduct, getCategories } from "@/lib/api";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();

  // State for form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Fetch product data
  const { data: product, isLoading: isLoadingProduct, isError: isErrorProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id, // Only run query if id is available
  });

  // Fetch categories data
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setPrice(product.price || "");
      setStock(product.stock || "");
      setCategory(product.category?._id || "");
      setBrand(product.brand || "");
      setExistingImages(product.images || []);
    }
  }, [product]);

  // Mutation for updating the product
  const mutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      alert("محصول با موفقیت به‌روزرسانی شد!");
      queryClient.invalidateQueries(["products"]); // Invalidate product list to refetch
      queryClient.invalidateQueries(["product", id]); // Invalidate this product's cache
      router.push("/products");
    },
    onError: (error) => {
      console.error("خطا در به‌روزرسانی محصول:", error);
      alert(`خطا: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("category", category);
    formData.append("brand", brand);

    // If new images are selected, append them. Otherwise, backend should keep the old ones.
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
    }

    mutation.mutate({ id, formData });
  };

  if (isLoadingProduct) return <div className="p-8 text-center">در حال بارگذاری اطلاعات محصول...</div>;
  if (isErrorProduct) return <div className="p-8 text-center text-red-500">خطا در دریافت اطلاعات محصول.</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-right">ویرایش محصول: {product?.name}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        
        {/* Form fields are similar to NewProductPage, just pre-filled */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">نام محصول</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">برند</label>
                <input id="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
                <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required min="0" />
            </div>
            <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">موجودی انبار</label>
                <input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required min="0" />
            </div>
        </div>

        <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required disabled={isLoadingCategories}>
                <option value="" disabled>یک دسته‌بندی انتخاب کنید</option>
                {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
            </select>
        </div>

        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">توضیحات محصول</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="6" className="w-full p-2 border border-gray-300 rounded-md" required></textarea>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تصاویر فعلی</label>
            <div className="flex flex-wrap gap-4 p-2 border border-gray-200 rounded-md min-h-[60px]">
                {existingImages.length > 0 ? existingImages.map(img => (
                    <img key={img._id} src={img.url} alt="Product Image" className="h-20 w-20 object-cover rounded-md" />
                )) : <p className="text-sm text-gray-500">تصویری وجود ندارد.</p>}
            </div>
        </div>

        <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">جایگزینی تصاویر (اختیاری)</label>
            <input id="images" type="file" multiple onChange={handleImageChange} className="w-full p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <div className="flex justify-end">
            <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400">
                {mutation.isPending ? "در حال به‌روزرسانی..." : "ذخیره تغییرات"}
            </button>
        </div>
      </form>
    </div>
  );
}
