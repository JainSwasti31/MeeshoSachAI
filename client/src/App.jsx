import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AddProductPage from "./pages/AddProductPage";
import NotFoundPage from "./pages/NotFoundPage";
import { ProductProvider } from "./context/ProductContext";

export default function App() {
  return (
    <ProductProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/add-product" element={<AddProductPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ProductProvider>
  );
}
