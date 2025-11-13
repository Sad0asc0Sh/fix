"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { getAdminProducts, deleteAdminProduct } from "@/lib/api";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => getAdminProducts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingId(null);
      alert("Product deleted successfully.");
    },
    onError: (e) => {
      setDeletingId(null);
      alert(`Delete failed: ${e?.response?.data?.message || e.message}`);
    },
  });

  const handleDelete = (product) => {
    if (window.confirm(`Delete product "${product.name}"?`)) {
      setDeletingId(product._id);
      deleteMutation.mutate(product._id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading products…</div>;
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600">Error: {error?.message}</div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/products/new">
          <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
            Create Product
          </button>
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Number(product.price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.brand || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/products/edit/${product._id}`}
                      className="text-indigo-600 hover:text-indigo-900 ml-4"
                    >
                      <FiEdit className="inline-block h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deleteMutation.isPending && deletingId === product._id}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 className="inline-block h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-600">No products found.</div>
      )}
    </div>
  );
}

