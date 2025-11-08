"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiEdit, FiTrash2 } from "react-icons/fi";

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

const fetchAdminProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/products`, {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await parseJsonResponse(response, "Failed to fetch admin products.");
  return payload?.data ?? payload;
};

const deleteAdminProduct = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/products/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseJsonResponse(response, "Failed to delete product.");
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const {
    data: productsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchAdminProducts,
  });

  const products = productsData ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => {
      alert('U.O-O�U^U, O"O U.U^U?U,UOO� O-O�U? O\'O_.');
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingId(null);
    },
    onError: (mutationError) => {
      alert(`OrO�O O_O� O-O�U? U.O-O�U^U,: ${mutationError.message}`);
      setDeletingId(null);
    },
  });

  const handleDelete = (product) => {
    if (
      window.confirm(
        `O�UOO OO� O-O�U? U.O-O�U^U, "${product.name}" OO�U.UOU+OU+ O_OO�UOO_OY`
      )
    ) {
      setDeletingId(product._id);
      deleteMutation.mutate(product._id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        O_O� O-OU, O"OO�U_O�OO�UO U.O-O�U^U,OO�...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600">
        OrO�O O_O� O_O�UOOU?O� U.O-O�U^U,OO�: {error.message}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-right">U,UOO3O� U.O-O�U^U,OO�</h1>
        <Link href="/products/new">
          <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
            OU?O�U^O_U+ U.O-O�U^U, O�O_UOO_
          </button>
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200 text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  U+OU. U.O-O�U^U,
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  U,UOU.O�
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  U.U^O�U^O_UO
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  O_O3O�U؃?OO"U+O_UO
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  O"O�U+O_
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  O1U.U,UOOO�
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
                    {product.price.toLocaleString()} O�U^U.OU+
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category?.name || "U+OU.O'OrO�"}
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
        <div className="p-8 text-center text-gray-600">
          U�UOU+ U.O-O�U^U,UO UOOU?O� U+O'O_. O"O�OUO OU?O�U^O_U+ U.O-O�U^U, O�O_UOO_OO O�U^UO
          O_UcU.U� O"OU,O UcU,UOUc UcU+UOO_.
        </div>
      )}
    </div>
  );
}
