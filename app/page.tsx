"use client";

import ReceiptGenerator from "@/components/receipt-generator";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          Maintenance Receipt Generator
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Generate and manage maintenance receipts with ease
        </p>
        <ReceiptGenerator />
      </div>
    </main>
  );
}