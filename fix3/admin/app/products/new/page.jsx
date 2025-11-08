"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCategories } from "@/lib/api";
import { getToken } from "@/utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

const parseJsonResponse = async (response, fallbackMessage) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload;
};

const createAdminProduct = async (formData) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/products`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  return parseJsonResponse(response, "Failed to create product.");
};

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [images, setImages] = useState([]);

  const {
    data: categories,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const mutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => {
      alert('U.O-O�U^U, O"O U.U^U?U,UOO� OOOU?U� O\'O_.');
      router.push("/products");
    },
    onError: (error) => {
      console.error("OrO�O O_O� OU?O�U^O_U+ U.O-O�U^U,:", error);
      alert(`OrO�O O_O� OU?O�U^O_U+ U.O-O�U^U,: ${error.message}`);
    },
  });

  const handleImageChange = (event) => {
    setImages(Array.from(event.target.files ?? []));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!category) {
      alert("U,O�U?O UOUc O_O3O�U؃?OO\"U+O_UO OU+O�OrOO\" UcU+UOO_.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("category", category);
    formData.append("brand", brand);

    images.forEach((file) => {
      formData.append("images", file);
    });

    mutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-right">OU?O�U^O_U+ U.O-O�U^U, O�O_UOO_</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              U+OU. U.O-O�U^U,
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              O"O�U+O_ (OOrO�UOOO�UO)
            </label>
            <input
              id="brand"
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              U,UOU.O� (O�U^U.OU+)
            </label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              min="0"
            />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              U.U^O�U^O_UO OU+O"OO�
            </label>
            <input
              id="stock"
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              min="0"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            O_O3O�U؃?OO"U+O_UO
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
            disabled={isLoadingCategories}
          >
            <option value="" disabled>
              {isLoadingCategories
                ? "O_O� O-OU, O\"OO�U_O�OO�UO..."
                : isErrorCategories
                ? "OrO�O O_O� O_O�UOOU?O� O_O3O�U؃?OO\"U+O_UO�?OU�O�"
                : "UOUc O_O3O�U؃?OO\"U+O_UO OU+O�OrOO\" UcU+UOO_"}
            </option>
            {categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            O�U^OUOO-OO� U.O-O�U^U,
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
            O�O�OU^UOO� U.O-O�U^U,
          </label>
          <input
            id="images"
            type="file"
            multiple
            onChange={handleImageChange}
            className="w-full p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {mutation.isPending ? "O_O� O-OU, O�OrUOO�U�..." : "O�OrUOO�U� U.O-O�U^U,"}
          </button>
        </div>
      </form>
    </div>
  );
}
