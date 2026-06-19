import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createProduct } from "../api";

const CATEGORIES = [
  "Sarees","Kurtis","Lehengas","Tops","Ethnic Wear","Jewellery",
  "Home Decor","Kitchen","Beauty","Kids Wear","Footwear","Electronics","Other",
];

const INITIAL = { title: "", description: "", category: "Sarees", price: "", images: "" };

export default function AddProductPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.price || Number(form.price) < 0) errs.price = "Valid price is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        images: form.images
          ? form.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const { data } = await createProduct(payload);
      toast.success("Product created!");
      navigate(`/products/${data.data._id}`);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach((e) => { mapped[e.path] = e.msg; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || "Failed to create product");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="add-product-page">
      <button className="btn btn--ghost back-btn" onClick={() => navigate(-1)}>← Back</button>
      <h1>Add a New Product</h1>

      <form className="product-form" onSubmit={handleSubmit} noValidate>
        <div className={`form-group ${errors.title ? "form-group--error" : ""}`}>
          <label htmlFor="title">Product Title <span aria-hidden="true">*</span></label>
          <input id="title" name="title" type="text" value={form.title} onChange={handleChange} maxLength={200} />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className={`form-group ${errors.description ? "form-group--error" : ""}`}>
          <label htmlFor="description">Description <span aria-hidden="true">*</span></label>
          <textarea id="description" name="description" rows={5} value={form.description} onChange={handleChange} maxLength={2000} />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={`form-group ${errors.price ? "form-group--error" : ""}`}>
            <label htmlFor="price">Price (₹) <span aria-hidden="true">*</span></label>
            <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} />
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="images">Image URLs <span className="field-hint">(comma-separated)</span></label>
          <input id="images" name="images" type="text" value={form.images} onChange={handleChange} placeholder="https://example.com/img1.jpg, https://..." />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create Product"}
          </button>
          <button type="button" className="btn btn--outline" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
